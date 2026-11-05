import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
  Aws,
  ArnFormat,
  CfnOutput,
  CfnParameter,
  Duration,
  Fn,
  RemovalPolicy,
  Stack,
  type StackProps,
} from "aws-cdk-lib";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecrAssets from "aws-cdk-lib/aws-ecr-assets";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as logs from "aws-cdk-lib/aws-logs";
import * as rds from "aws-cdk-lib/aws-rds";
import * as iam from "aws-cdk-lib/aws-iam";
import * as kms from "aws-cdk-lib/aws-kms";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as servicediscovery from "aws-cdk-lib/aws-servicediscovery";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import type { Construct } from "constructs";
import { RilloraMaintenanceBroker } from './rillora-maintenance-broker.js';
import {RilloraRuntimeBoundaryKeys,RilloraIdentityDeletionWorker} from './rillora-runtime-boundaries.js';
import {RilloraPrivateContent} from './rillora-private-content.js';
import {userSessionEnvironment,userSessionOriginHeaders} from './rillora-user-sessions.js';

export type RilloraStagingStackProps = StackProps & {
  desiredCount: number;
  stripeTestIntegrationEnabled: boolean;
  appleStoreKitSandboxEnabled: boolean;
  familyMaintenancePreviewEnabled?: boolean;
  accountDeletionEnabled?: boolean;
  emailVerificationEnabled?: boolean;
  contentProtectionMode?: "read-compatible" | "encrypted";
  contentMigrationEnabled?: boolean;
  legacyContentPrepared?: boolean;
  legacyContentEnabled?: boolean;
  localTranscriptionEnabled?: boolean;
};

const apiContainerPort = 8080;
const rdsCaBundleSha256 = "e5bb2084ccf45087bda1c9bffdea0eb15ee67f0b91646106e466714f9de3c7e3";
const moduleDirectory = dirname(fileURLToPath(import.meta.url));
const webAssetDirectory = resolve(moduleDirectory, "../../../apps/web/dist/client");
const webDomainName = "app.staging.rillora.xyz";

export class RilloraStagingStack extends Stack {
  constructor(scope: Construct, id: string, props: RilloraStagingStackProps) {
    super(scope, id, props);

    if (props.env?.region && props.env.region !== "eu-central-1") {
      throw new Error("Rillora staging must be deployed in eu-central-1");
    }
    if (props.legacyContentEnabled && (!props.legacyContentPrepared || !props.accountDeletionEnabled || props.contentProtectionMode === 'read-compatible'))
      throw new Error('Private content requires encrypted staging and isolated cleanup');
    if (props.localTranscriptionEnabled && !props.legacyContentEnabled) throw new Error('Local transcription requires the content workspace');

    const oidcIssuer = new CfnParameter(this, "OidcIssuer", {
      type: "String",
      allowedPattern: "^https://.+[^/]$",
      description: "Exact Auth0 EU issuer without a trailing slash",
    });
    const deletionClientId = new CfnParameter(this, "Auth0DeletionClientId", {
      type: "String", default: "", description: "Dedicated M2M client with only delete:users",
    });
    const deletionDomain = new CfnParameter(this, "Auth0DeletionDomain", {
      type: "String", default: "rillora-dev.eu.auth0.com", allowedPattern: "^[a-zA-Z0-9.-]+$",
    });
    const verificationClientId = new CfnParameter(this, "Auth0EmailVerificationClientId", {
      type: "String", default: "", description: "Dedicated M2M client with only read:users for current-session email proof",
    });
    const verificationDomain = new CfnParameter(this, "Auth0EmailVerificationDomain", {
      type: "String", default: "rillora-dev.eu.auth0.com", allowedPattern: "^[a-zA-Z0-9.-]+$",
    });
    const nativeOidcClientId = new CfnParameter(this, "NativeOidcClientId", {
      type: "String",
      minLength: 1,
      noEcho: true,
      description: "Auth0 native application client ID",
    });
    const webOidcClientId = new CfnParameter(this, "WebOidcClientId", {
      type: "String",
      minLength: 1,
      description: "Auth0 regular Web application client ID",
    });
    const webOidcRedirectUri = new CfnParameter(this, "WebOidcRedirectUri", {
      type: "String",
      allowedPattern: "^https://.+/auth/callback$",
      description: "Exact HTTPS callback handled by the staging API",
    });
    const oidcApiAudience = new CfnParameter(this, "OidcApiAudience", {
      type: "String",
      minLength: 1,
      noEcho: true,
      description: "Exact Auth0 API audience",
    });
    const webCorsOrigin = new CfnParameter(this, "WebCorsOrigin", {
      type: "String",
      allowedPattern: "^https://.+[^/]$",
      description: "Single staging Web origin; no wildcard is accepted",
    });
    const webCertificateArn = new CfnParameter(this, "WebCertificateArn", {
      type: "String",
      allowedPattern:
        "^arn:(aws|aws-us-gov|aws-cn):acm:us-east-1:[0-9]{12}:certificate/[0-9a-f-]+$",
      description: `Issued us-east-1 ACM certificate for ${webDomainName}`,
    });
    const webCertificate = acm.Certificate.fromCertificateArn(
      this,
      "WebCertificate",
      webCertificateArn.valueAsString,
    );

    const vpc = new ec2.Vpc(this, "Vpc", {
      ipAddresses: ec2.IpAddresses.cidr("10.42.0.0/16"),
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          name: "edge",
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: "data",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });
    vpc.addFlowLog("RejectedTrafficFlowLog", {
      trafficType: ec2.FlowLogTrafficType.REJECT,
      destination: ec2.FlowLogDestination.toCloudWatchLogs(
        new logs.LogGroup(this, "VpcRejectedTraffic", {
          retention: logs.RetentionDays.ONE_MONTH,
          removalPolicy: RemovalPolicy.DESTROY,
        }),
      ),
    });

    const taskSecurityGroup = new ec2.SecurityGroup(this, "ApiTaskSecurityGroup", {
      vpc,
      allowAllOutbound: false,
      description: "Rillora staging API tasks; ingress only from the API Gateway VPC link",
    });
    taskSecurityGroup.addEgressRule(
      ec2.Peer.ipv4("0.0.0.0/0"),
      ec2.Port.tcp(443),
      "Reach Auth0 and AWS HTTPS endpoints without a NAT Gateway",
    );
    const vpcLinkSecurityGroup = new ec2.SecurityGroup(this, "VpcLinkSecurityGroup", {
      vpc,
      allowAllOutbound: false,
      description: "API Gateway VPC Link to the Rillora API tasks",
    });
    vpcLinkSecurityGroup.addEgressRule(
      taskSecurityGroup,
      ec2.Port.tcp(apiContainerPort),
      "Forward HTTPS-edge traffic to the API container",
    );
    taskSecurityGroup.addIngressRule(
      vpcLinkSecurityGroup,
      ec2.Port.tcp(apiContainerPort),
      "Only API Gateway VPC Link may reach the API container",
    );

    const databaseSecurityGroup = new ec2.SecurityGroup(this, "DatabaseSecurityGroup", {
      vpc,
      allowAllOutbound: false,
      description: "Rillora staging PostgreSQL; API and migration tasks only",
    });
    databaseSecurityGroup.addIngressRule(
      taskSecurityGroup,
      ec2.Port.tcp(5432),
      "API and migration tasks may connect to PostgreSQL",
    );
    taskSecurityGroup.addEgressRule(
      databaseSecurityGroup,
      ec2.Port.tcp(5432),
      "API and migration tasks may connect only to the staging database",
    );

    const database = new rds.DatabaseInstance(this, "Database", {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16_13,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO),
      credentials: rds.Credentials.fromGeneratedSecret("continuity_admin", {
        excludeCharacters: " @/\\\"'`",
      }),
      databaseName: "rillora",
      allocatedStorage: 20,
      storageType: rds.StorageType.GP3,
      storageEncrypted: true,
      multiAz: false,
      publiclyAccessible: false,
      autoMinorVersionUpgrade: true,
      deletionProtection: true,
      backupRetention: Duration.days(1),
      preferredBackupWindow: "02:00-03:00",
      preferredMaintenanceWindow: "sun:03:00-sun:04:00",
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [databaseSecurityGroup],
      cloudwatchLogsExports: ["postgresql"],
      cloudwatchLogsRetention: logs.RetentionDays.ONE_MONTH,
      engineLifecycleSupport: rds.EngineLifecycleSupport.OPEN_SOURCE_RDS_EXTENDED_SUPPORT_DISABLED,
      removalPolicy: RemovalPolicy.SNAPSHOT,
    });
    if (!database.secret) throw new Error("RDS did not create an administrator secret");
    database.secret.applyRemovalPolicy(RemovalPolicy.DESTROY);

    const runtimeDatabaseSecret = new secretsmanager.Secret(this, "RuntimeDatabaseSecret", {
      description: "Generated Rillora staging database runtime credential",
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: "continuity_runtime_staging" }),
        generateStringKey: "password",
        passwordLength: 48,
        excludeCharacters: " @/\\\"'`",
      },
    });
    runtimeDatabaseSecret.applyRemovalPolicy(RemovalPolicy.DESTROY);

    const webOidcClientSecret = new secretsmanager.Secret(this, "WebOidcClientSecret", {
      description: "Rillora staging Auth0 regular Web application client secret",
      generateSecretString: {
        passwordLength: 64,
        excludePunctuation: true,
      },
    });
    webOidcClientSecret.applyRemovalPolicy(RemovalPolicy.DESTROY);
    const accountDeletionSecret = new secretsmanager.Secret(this, "AccountDeletionClientSecret", {
      description: "Rillora dedicated Auth0 identity-deletion service secret",
    });
    accountDeletionSecret.applyRemovalPolicy(RemovalPolicy.DESTROY);
    const emailVerificationSecret = new secretsmanager.Secret(this, "EmailVerificationClientSecret", {
      description: "Rillora dedicated read-only Auth0 email-verification service secret",
    });
    emailVerificationSecret.applyRemovalPolicy(RemovalPolicy.DESTROY);

    const stripeTestApiKeySecret = new secretsmanager.Secret(this, "StripeTestSecret", {
      description: "Rillora Phase 1C Stripe test restricted API key",
    });
    stripeTestApiKeySecret.applyRemovalPolicy(RemovalPolicy.DESTROY);

    const stripeTestWebhookSecret = new secretsmanager.Secret(this, "StripeTestWebhookSecret", {
      description: "Rillora Phase 1C Stripe test webhook signing secret",
    });
    stripeTestWebhookSecret.applyRemovalPolicy(RemovalPolicy.DESTROY);

    const appleIapKeyIdSecret = props.appleStoreKitSandboxEnabled
      ? new secretsmanager.Secret(this, "AppleIapKeyIdSecret", {
          description: "Rillora App Store Sandbox In-App Purchase key ID",
        })
      : null;
    const appleIapIssuerIdSecret = props.appleStoreKitSandboxEnabled
      ? new secretsmanager.Secret(this, "AppleIapIssuerIdSecret", {
          description: "Rillora App Store Sandbox In-App Purchase issuer ID",
        })
      : null;
    const appleIapPrivateKeySecret = props.appleStoreKitSandboxEnabled
      ? new secretsmanager.Secret(this, "AppleIapPrivateKeySecret", {
          description: "Rillora App Store Sandbox In-App Purchase PKCS#8 private key",
        })
      : null;
    for (const secret of [
      appleIapKeyIdSecret,
      appleIapIssuerIdSecret,
      appleIapPrivateKeySecret,
    ]) {
      secret?.applyRemovalPolicy(RemovalPolicy.DESTROY);
    }

    const stagingOperatorRole = new iam.Role(this, "StagingOperatorRole", {
      roleName: "rillora-staging-operator",
      path: "/rillora/",
      description: "MFA-gated least-privilege role for Rillora staging migration and verification.",
      assumedBy: new iam.ArnPrincipal(
        `arn:${Aws.PARTITION}:iam::${Aws.ACCOUNT_ID}:user/rillora/rillora-operator`,
      ).withConditions({ Bool: { "aws:MultiFactorAuthPresent": "true" } }),
      maxSessionDuration: Duration.hours(1),
    });

    const cluster = new ecs.Cluster(this, "Cluster", {
      vpc,
      containerInsightsV2: ecs.ContainerInsights.DISABLED,
    });
    const namespace = new servicediscovery.PrivateDnsNamespace(this, "Namespace", {
      vpc,
      name: "staging.rillora.internal",
    });
    const discoveryService = namespace.createService("ApiDiscovery", {
      name: "api",
      dnsRecordType: servicediscovery.DnsRecordType.SRV,
      dnsTtl: Duration.seconds(10),
    });

    const apiLogGroup = new logs.LogGroup(this, "ApiLogGroup", {
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    const taskDefinition = new ecs.FargateTaskDefinition(this, "ApiTaskDefinition", {
      cpu: 256,
      memoryLimitMiB: 512,
      runtimePlatform: {
        cpuArchitecture: ecs.CpuArchitecture.ARM64,
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
      },
    });
    // Retain the wrapping key independently of the database and deployments.
    // AWS rotates backing key material without making older ciphertext unreadable.
    const contentKey = new kms.Key(this, "PrivateContentKey", {
      description: "Rillora staging private-content wrapping key",
      enableKeyRotation: true,
      pendingWindow: Duration.days(30),
      removalPolicy: RemovalPolicy.RETAIN,
    });
    const contentEnvironment = {
      CONTENT_PROTECTION_MODE: props.contentProtectionMode ?? "encrypted",
      CONTENT_KMS_KEY_ARN: contentKey.keyArn,
      CONTENT_KEY_NAMESPACE: "rillora-staging",
    };
    const boundaryKeys=new RilloraRuntimeBoundaryKeys(this,'RuntimeBoundaries','staging');
    const allowContentKeys = (role: iam.IRole) => role.addToPrincipalPolicy(new iam.PolicyStatement({
      sid: "UseOnlyStagingContentKeys",
      actions: ["kms:GenerateDataKey", "kms:Decrypt"],
      resources: [contentKey.keyArn],
      conditions: {
        StringEquals: { "kms:EncryptionContext:rillora_application": "content-v1",
          "kms:EncryptionContext:rillora_environment": "rillora-staging" },
        Null: { "kms:EncryptionContext:owner_id": "false", "kms:EncryptionContext:key_id": "false" },
      },
    }));
    allowContentKeys(taskDefinition.taskRole);
    const privateContent = props.legacyContentPrepared ? new RilloraPrivateContent(this, 'PrivateContent', 'staging') : null;
    privateContent?.allowApi(taskDefinition.taskRole);
    stagingOperatorRole.addToPolicy(new iam.PolicyStatement({
      sid: "InspectOnlyStagingContentKey",
      actions: ["kms:DescribeKey", "kms:GetKeyRotationStatus"],
      resources: [contentKey.keyArn],
    }));
    const image = ecs.ContainerImage.fromAsset(resolve(moduleDirectory, "../../../apps/api"), {
      buildArgs: { RDS_CA_BUNDLE_SHA256: rdsCaBundleSha256 },
      platform: ecrAssets.Platform.LINUX_ARM64,
    });
    const sharedEnvironment = {
      NODE_ENV: "production",
      HOST: "0.0.0.0",
      PORT: String(apiContainerPort),
      DATABASE_HOST: database.instanceEndpoint.hostname,
      DATABASE_PORT: String(database.instanceEndpoint.port),
      DATABASE_NAME: "rillora",
      DATABASE_SSL_MODE: "verify-full",
      DATABASE_SSL_CA_PATH: "/app/certs/rds-global-bundle.pem",
      DATABASE_CONNECTION_TIMEOUT_MS: "45000",
      DATA_REGION: "eu-central-1",
    };
    const container = taskDefinition.addContainer("Api", {
      image,
      logging: ecs.LogDrivers.awsLogs({ logGroup: apiLogGroup, streamPrefix: "api" }),
      environment: {
        ...sharedEnvironment,
        ...contentEnvironment,
        ...privateContent?.environmentValues(props.legacyContentEnabled === true),
        CORS_ORIGINS: webCorsOrigin.valueAsString,
        ALLOW_DEV_AUTH: "false",
        ALLOW_SYNTHETIC_RECIPIENT_REHEARSAL: "false",
        DATABASE_POOL_MAX: "5",
        TRUST_PROXY_HOPS: "1",
        ...userSessionEnvironment(this,props.emailVerificationEnabled===true),
        PRODUCTION_RUNTIME_MODE: "staging",
        REQUIRE_RECENT_AUTHENTICATION: "true",
        OIDC_ISSUER_URL: oidcIssuer.valueAsString,
        OIDC_CLIENT_ID: webOidcClientId.valueAsString,
        ...(props.emailVerificationEnabled ? {
          AUTH0_EMAIL_VERIFICATION_DOMAIN: verificationDomain.valueAsString,
          AUTH0_EMAIL_VERIFICATION_CLIENT_ID: verificationClientId.valueAsString,
        } : {}),
        ...(props.accountDeletionEnabled ? {DELETION_WORKER_ENABLED:'true',DELETION_PROOF_KMS_KEY_ARN:boundaryKeys.proof.keyArn} : {}),
        OIDC_REDIRECT_URI: webOidcRedirectUri.valueAsString,
        WEB_APP_ORIGIN: webCorsOrigin.valueAsString,
        NATIVE_OIDC_CLIENT_ID: nativeOidcClientId.valueAsString,
        OIDC_API_AUDIENCE: oidcApiAudience.valueAsString,
        ALLOW_STRIPE_TEST_INTEGRATION: props.stripeTestIntegrationEnabled ? "true" : "false",
        ALLOW_FAMILY_MAINTENANCE_PREVIEW: props.familyMaintenancePreviewEnabled ? "true" : "false",
        ALLOW_APPLE_SANDBOX_INTEGRATION:
          props.appleStoreKitSandboxEnabled ? "true" : "false",
        ...(props.stripeTestIntegrationEnabled
          ? {
              STRIPE_TEST_STAGING_MODE: "true",
              STRIPE_EXPECTED_ACCOUNT_ID: "acct_1U6B2RCxTlowhyiG",
              STRIPE_FAMILY_PRODUCT_ID: "prod_V6O8lAFbTCDmKd",
              STRIPE_FAMILY_PLAN_VERSION: "2",
              STRIPE_FAMILY_PRICE_VERSION: "4",
              STRIPE_FAMILY_MONTHLY_PRICE_ID: "price_1UHMlhCxTlowhyiGvBEPdb4x",
              STRIPE_FAMILY_ANNUAL_PRICE_ID: "price_1UJe38CxTlowhyiGdx5ypIKJ",
              STRIPE_CHECKOUT_SUCCESS_URL:
                `https://${webDomainName}/?view=access&billing=return`,
              STRIPE_CHECKOUT_CANCEL_URL: `https://${webDomainName}/?view=access&billing=cancelled`,
              STRIPE_PORTAL_RETURN_URL: `https://${webDomainName}/?view=access&billing=return`,
            }
          : {}),
        ...(props.appleStoreKitSandboxEnabled
          ? {
              APPLE_SANDBOX_STAGING_MODE: "true",
              APPLE_ROOT_CERTIFICATE_DIRECTORY: "/app/certificates/apple",
            }
          : {}),
      },
      secrets: {
        DATABASE_USER: ecs.Secret.fromSecretsManager(runtimeDatabaseSecret, "username"),
        DATABASE_PASSWORD: ecs.Secret.fromSecretsManager(runtimeDatabaseSecret, "password"),
        ...boundaryKeys.apiSecrets(),
        OIDC_CLIENT_SECRET: ecs.Secret.fromSecretsManager(webOidcClientSecret),
        ...(props.emailVerificationEnabled ? {
          AUTH0_EMAIL_VERIFICATION_CLIENT_SECRET: ecs.Secret.fromSecretsManager(emailVerificationSecret),
        } : {}),
        ...(props.stripeTestIntegrationEnabled
          ? {
              STRIPE_TEST_API_KEY: ecs.Secret.fromSecretsManager(stripeTestApiKeySecret),
              STRIPE_TEST_WEBHOOK_SECRET: ecs.Secret.fromSecretsManager(
                stripeTestWebhookSecret,
              ),
            }
          : {}),
        ...(appleIapKeyIdSecret && appleIapIssuerIdSecret && appleIapPrivateKeySecret
          ? {
              APPLE_IAP_KEY_ID: ecs.Secret.fromSecretsManager(appleIapKeyIdSecret),
              APPLE_IAP_ISSUER_ID: ecs.Secret.fromSecretsManager(appleIapIssuerIdSecret),
              APPLE_IAP_PRIVATE_KEY: ecs.Secret.fromSecretsManager(
                appleIapPrivateKeySecret,
              ),
            }
          : {}),
      },
      healthCheck: {
        command: [
          "CMD-SHELL",
          "node -e \"fetch('http://127.0.0.1:8080/health/live').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))\"",
        ],
        interval: Duration.seconds(30),
        timeout: Duration.seconds(5),
        retries: 3,
        startPeriod: Duration.seconds(30),
      },
    });
    container.addPortMappings({
      name: "http",
      containerPort: apiContainerPort,
      protocol: ecs.Protocol.TCP,
      appProtocol: ecs.AppProtocol.http,
    });

    const service = new ecs.FargateService(this, "ApiService", {
      cluster,
      taskDefinition,
      desiredCount: props.desiredCount,
      // The single API is an interactive/login and signed-webhook receiver.
      // A verified Spot interruption left Cloud Map without an endpoint during
      // refund delivery; keep this baseline on regular Fargate capacity.
      capacityProviderStrategies: [{ capacityProvider: "FARGATE", weight: 1 }],
      assignPublicIp: true,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroups: [taskSecurityGroup],
      circuitBreaker: { rollback: true },
      minHealthyPercent: 100,
      maxHealthyPercent: 200,
      enableECSManagedTags: true,
      propagateTags: ecs.PropagatedTagSource.SERVICE,
    });
    // A stable migration nonce replaces existing Spot tasks as well as changing
    // the strategy, without triggering a fresh rollout on unrelated updates.
    service.forceNewDeployment("api-on-demand-20260917");
    service.associateCloudMapService({
      service: discoveryService,
      container,
      containerPort: apiContainerPort,
    });
    service.node.addDependency(database);
    let identityWorker:RilloraIdentityDeletionWorker|undefined;
    if(props.accountDeletionEnabled){
      boundaryKeys.allowProof(taskDefinition.taskRole,'staging','kms:GenerateDataKey');
      identityWorker=new RilloraIdentityDeletionWorker(this,'IdentityWorker',{environment:'staging',vpc,cluster,
        databaseNetwork:databaseSecurityGroup,databaseEnvironment:sharedEnvironment,keys:boundaryKeys,image,
        providerEnvironment:{AUTH0_DELETION_DOMAIN:deletionDomain.valueAsString,AUTH0_DELETION_CLIENT_ID:deletionClientId.valueAsString},
        providerSecrets:{AUTH0_DELETION_CLIENT_SECRET:ecs.Secret.fromSecretsManager(accountDeletionSecret)},
        issuers:[oidcIssuer.valueAsString],clients:[webOidcClientId.valueAsString,nativeOidcClientId.valueAsString],
        desiredCount:props.desiredCount>0?1:0});
      privateContent?.allowCleanup(identityWorker.task, props.legacyContentEnabled === true);
    }

    const migrationLogGroup = new logs.LogGroup(this, "MigrationLogGroup", {
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    const migrationTaskDefinition = new ecs.FargateTaskDefinition(this, "MigrationTaskDefinition", {
      cpu: 256,
      memoryLimitMiB: 512,
      runtimePlatform: {
        cpuArchitecture: ecs.CpuArchitecture.ARM64,
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
      },
    });
    // Temporary during the bounded backfill only. Removing this policy also
    // removes access from retained older migration task-definition revisions.
    if (props.contentMigrationEnabled) allowContentKeys(migrationTaskDefinition.taskRole);
    migrationTaskDefinition.addContainer("Migration", {
      image,
      command: ["/bin/sh", "-c", "node dist/migrate.js && node dist/bootstrap-runtime.js && node dist/migrate-email-matches.js"],
      logging: ecs.LogDrivers.awsLogs({ logGroup: migrationLogGroup, streamPrefix: "migration" }),
      environment: {
        ...sharedEnvironment,
        ...(props.contentMigrationEnabled ? { ...contentEnvironment, CONTENT_PROTECTION_MODE: "encrypted" } : {}),
      },
      secrets: {
        DATABASE_USER: ecs.Secret.fromSecretsManager(database.secret, "username"),
        DATABASE_PASSWORD: ecs.Secret.fromSecretsManager(database.secret, "password"),
        RUNTIME_DATABASE_USER: ecs.Secret.fromSecretsManager(runtimeDatabaseSecret, "username"),
        RUNTIME_DATABASE_PASSWORD: ecs.Secret.fromSecretsManager(runtimeDatabaseSecret, "password"),
        ...boundaryKeys.migrationSecrets(),
      },
    });

    const stagingMaintenancePolicies: iam.PolicyStatement[] = [];
    stagingMaintenancePolicies.push(
      new iam.PolicyStatement({
        sid: "RunOnlyTheStagingMigrationTask",
        actions: ["ecs:RunTask"],
        resources: [migrationTaskDefinition.taskDefinitionArn],
        conditions: { ArnEquals: { "ecs:cluster": cluster.clusterArn } },
      }),
    );
    if (appleIapKeyIdSecret && appleIapIssuerIdSecret && appleIapPrivateKeySecret) {
      stagingOperatorRole.addToPolicy(
        new iam.PolicyStatement({
          sid: "ReplaceOnlyTheStagingAppleIapSecrets",
          actions: ["secretsmanager:DescribeSecret", "secretsmanager:PutSecretValue"],
          resources: [
            appleIapKeyIdSecret.secretArn,
            appleIapIssuerIdSecret.secretArn,
            appleIapPrivateKeySecret.secretArn,
          ],
        }),
      );
    }
    stagingOperatorRole.addToPolicy(
      new iam.PolicyStatement({
        sid: "ReplaceOnlyTheStagingStripeTestSecrets",
        actions: ["secretsmanager:DescribeSecret", "secretsmanager:PutSecretValue"],
        resources: [stripeTestApiKeySecret.secretArn, stripeTestWebhookSecret.secretArn],
      }),
    );
    stagingMaintenancePolicies.push(
      new iam.PolicyStatement({
        sid: "PassOnlyTheMigrationTaskRoles",
        actions: ["iam:PassRole"],
        resources: [
          migrationTaskDefinition.taskRole.roleArn,
          migrationTaskDefinition.executionRole!.roleArn,
        ],
        conditions: { StringEquals: { "iam:PassedToService": "ecs-tasks.amazonaws.com" } },
      }),
    );
    const maintenanceBroker = new RilloraMaintenanceBroker(this,'MaintenanceBroker',{
      operator:stagingOperatorRole,policies:stagingMaintenancePolicies,
      settings:{environment:'staging',cluster:cluster.clusterName,migrationTask:migrationTaskDefinition.taskDefinitionArn,
        subnets:vpc.publicSubnets.map(subnet=>subnet.subnetId),migrationSecurityGroup:taskSecurityGroup.securityGroupId,
        securityAuditScriptSha256:createHash('sha256').update(readFileSync(resolve(dirname(fileURLToPath(import.meta.url)),'../../../tools/release/probe_security_rollout.mjs'))).digest('hex'),
        securityAuthorityScriptSha256:createHash('sha256').update(readFileSync(resolve(dirname(fileURLToPath(import.meta.url)),'../../../tools/release/probe_security_authority.mjs'))).digest('hex')},
    });
    new CfnOutput(this,'MaintenanceBrokerFunctionName',{value:maintenanceBroker.function.functionName});
    stagingOperatorRole.addToPolicy(new iam.PolicyStatement({
      sid:'ReadOwnMaintenanceOutputs',actions:['cloudformation:DescribeStacks'],resources:[this.stackId],
    }));
    stagingOperatorRole.addToPolicy(
      new iam.PolicyStatement({
        sid: "ObserveAndStopStagingTasks",
        actions: ["ecs:DescribeTasks", "ecs:StopTask"],
        resources: ["*"],
        conditions: { ArnEquals: { "ecs:cluster": cluster.clusterArn } },
      }),
    );
    stagingOperatorRole.addToPolicy(new iam.PolicyStatement({
      sid: "SnapshotOnlyStagingContentMigration",
      actions: ["rds:CreateDBSnapshot"],
      resources: [database.instanceArn,
        this.formatArn({ service: "rds", resource: "snapshot", resourceName: "rillora-content-encryption-*", arnFormat: ArnFormat.COLON_RESOURCE_NAME })],
      conditions: { StringEquals: { "aws:RequestedRegion": "eu-central-1" } },
    }));
    stagingOperatorRole.addToPolicy(new iam.PolicyStatement({
      sid: "InspectStagingMigrationSnapshots",
      actions: ["rds:DescribeDBSnapshots"],
      resources: ["*"],
      conditions: { StringEquals: { "aws:RequestedRegion": "eu-central-1" } },
    }));
    stagingOperatorRole.addToPolicy(
      new iam.PolicyStatement({
        sid: "InspectStagingService",
        actions: ["ecs:DescribeClusters", "ecs:DescribeServices"],
        resources: [cluster.clusterArn, service.serviceArn,...(identityWorker?[identityWorker.service.serviceArn]:[])],
      }),
    );
    // These APIs do not support resource-level IAM authorization. Keep them
    // read-only and in this stack's region; operational tooling requests only
    // the exact Rillora task definition and metric dimensions.
    stagingOperatorRole.addToPolicy(new iam.PolicyStatement({
      sid: "ReadOnlyRegionalCapacityDiagnostics",
      actions: ["ecs:DescribeTaskDefinition", "cloudwatch:GetMetricStatistics"],
      resources: ["*"],
      conditions: { StringEquals: { "aws:RequestedRegion": this.region } },
    }));
    stagingOperatorRole.addToPolicy(
      new iam.PolicyStatement({
        sid: "ReadStagingTaskLogs",
        actions: ["logs:DescribeLogStreams", "logs:GetLogEvents", "logs:FilterLogEvents"],
        resources: [
          migrationLogGroup.logGroupArn,
          `${migrationLogGroup.logGroupArn}:*`,
          apiLogGroup.logGroupArn,
          `${apiLogGroup.logGroupArn}:*`,
          ...(identityWorker?[identityWorker.logGroup.logGroupArn,`${identityWorker.logGroup.logGroupArn}:*`]:[]),
        ],
      }),
    );
    stagingOperatorRole.addToPolicy(
      new iam.PolicyStatement({
        sid: "ReplaceOnlyTheStagingWebOidcSecret",
        actions: ["secretsmanager:DescribeSecret", "secretsmanager:PutSecretValue"],
        resources: [webOidcClientSecret.secretArn, accountDeletionSecret.secretArn, emailVerificationSecret.secretArn],
      }),
    );
    stagingOperatorRole.addToPolicy(
      new iam.PolicyStatement({
        sid: "InspectTheStagingDatabase",
        actions: ["rds:DescribeDBInstances"],
        resources: ["*"],
      }),
    );

    const vpcLink = new apigwv2.VpcLink(this, "VpcLink", {
      vpc,
      subnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroups: [vpcLinkSecurityGroup],
    });
    const integration = new integrations.HttpServiceDiscoveryIntegration(
      "ServiceDiscoveryIntegration",
      discoveryService,
      { vpcLink },
    );
    const accessLogGroup = new logs.LogGroup(this, "HttpApiAccessLogs", {
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    stagingOperatorRole.addToPolicy(new iam.PolicyStatement({
      sid: "ReadOnlyStagingGatewayDiagnostics",
      actions: ["logs:DescribeLogStreams", "logs:GetLogEvents", "logs:FilterLogEvents"],
      resources: [accessLogGroup.logGroupArn, `${accessLogGroup.logGroupArn}:*`],
    }));
    const httpApi = new apigwv2.HttpApi(this, "HttpApi", {
      apiName: "rillora-staging",
      description: "Synthetic-only Rillora staging API",
      defaultIntegration: integration,
      corsPreflight: {
        allowCredentials: true,
        allowHeaders: ["authorization", "content-type", "x-csrf-token", "x-rillora-client"],
        allowMethods: [apigwv2.CorsHttpMethod.ANY],
        allowOrigins: [webCorsOrigin.valueAsString],
        maxAge: Duration.hours(1),
      },
    });
    const defaultStage = httpApi.defaultStage?.node.defaultChild as apigwv2.CfnStage | undefined;
    if (!defaultStage) throw new Error("HTTP API default stage was not created");
    defaultStage.accessLogSettings = {
      destinationArn: accessLogGroup.logGroupArn,
      format: JSON.stringify({
        requestId: "$context.requestId",
        httpMethod: "$context.httpMethod",
        path: "$context.path",
        status: "$context.status",
        responseLength: "$context.responseLength",
        integrationError: "$context.integrationErrorMessage",
      }),
    };
    defaultStage.defaultRouteSettings = {
      throttlingBurstLimit: 50,
      throttlingRateLimit: 25,
    };
    service.node.addDependency(vpcLink);

    const webBucket = new s3.Bucket(this, "WebBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
    const responseHeadersPolicy = new cloudfront.ResponseHeadersPolicy(
      this,
      "WebResponseHeadersPolicy",
      {
        securityHeadersBehavior: {
          contentSecurityPolicy: {
            contentSecurityPolicy: [
              "default-src 'self'",
              "base-uri 'self'",
              "connect-src 'self'",
              "font-src 'self'",
              "form-action 'self' https://login.rillora.xyz",
              "frame-ancestors 'none'",
              "img-src 'self' data:",
              "object-src 'none'",
              props.localTranscriptionEnabled ? "script-src 'self' 'wasm-unsafe-eval'" : "script-src 'self'",
              ...(props.legacyContentEnabled ? ["media-src 'self' blob:", "worker-src 'self'"] : []),
              "style-src 'self'",
            ].join("; "),
            override: true,
          },
          contentTypeOptions: { override: true },
          frameOptions: {
            frameOption: cloudfront.HeadersFrameOption.DENY,
            override: true,
          },
          referrerPolicy: {
            referrerPolicy: cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
            override: true,
          },
          strictTransportSecurity: {
            accessControlMaxAge: Duration.days(365),
            includeSubdomains: true,
            preload: false,
            override: true,
          },
        },
      },
    );
    const spaRewrite = new cloudfront.Function(this, "SpaRewrite", {
      runtime: cloudfront.FunctionRuntime.JS_2_0,
      code: cloudfront.FunctionCode.fromInline(`function handler(event) {
  var request = event.request;
  if (request.uri === '/.well-known/apple-app-site-association' && (request.method === 'GET' || request.method === 'HEAD')) {
    return { statusCode: 200, headers: { 'content-type': { value: 'application/json' }, 'cache-control': { value: 'public, max-age=3600' } },
      body: request.method === 'HEAD' ? '' : '{"applinks":{"apps":[],"details":[{"appID":"8L99CFNK24.com.rillora.ios","paths":["/invite","/invite/*","/future-invite","/future-invite/*"]}]}}' };
  }
  var uri = request.uri;
  if (uri.endsWith('/')) {
    request.uri = uri + 'index.html';
  } else if (!uri.split('/').pop().includes('.')) {
    request.uri = '/index.html';
  }
  return request;
}`),
    });
    const sessionEdge = new cloudfront.Function(this, 'SessionEdge', {
      runtime: cloudfront.FunctionRuntime.JS_2_0,
      code: cloudfront.FunctionCode.fromFile({filePath:resolve(moduleDirectory,'../../../apps/web/worker/session-edge.js')}),
    });
    const distribution = new cloudfront.Distribution(this, "WebDistribution", {
      domainNames: [webDomainName],
      certificate: webCertificate,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      defaultRootObject: "index.html",
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(webBucket),
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
        responseHeadersPolicy,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        functionAssociations: [
          {
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
            function: spaRewrite,
          },
        ],
      },
      additionalBehaviors: {
        "/api/*": {
          origin: new origins.HttpOrigin(Fn.parseDomainName(httpApi.apiEndpoint), {
            customHeaders: userSessionOriginHeaders(this),
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
            originSslProtocols: [cloudfront.OriginSslPolicy.TLS_V1_2],
            readTimeout: Duration.seconds(30),
          }),
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
          functionAssociations: [{eventType:cloudfront.FunctionEventType.VIEWER_REQUEST,function:sessionEdge}],
          compress: true,
          responseHeadersPolicy,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
      },
    });
    new s3deploy.BucketDeployment(this, "WebDeployment", {
      memoryLimit: props.legacyContentEnabled ? 512 : 128,
      sources: [s3deploy.Source.asset(webAssetDirectory)],
      destinationBucket: webBucket,
      distribution,
      distributionPaths: ["/*"],
      // Keep immutable chunks used by open tabs while the content client rolls out.
      prune: !props.legacyContentEnabled,
    });

    new CfnOutput(this, "ApiEndpoint", { value: httpApi.apiEndpoint });
    new CfnOutput(this, "PrivateContentKeyArn", { value: contentKey.keyArn });
    new CfnOutput(this, "ContentProtectionMode", { value: contentEnvironment.CONTENT_PROTECTION_MODE });
    new CfnOutput(this, "ContentMigrationEnabled", { value: String(props.contentMigrationEnabled ?? false) });
    new CfnOutput(this, "WebDistributionDomainName", {
      value: distribution.distributionDomainName,
    });
    new CfnOutput(this, "WebUrl", { value: `https://${webDomainName}` });
    new CfnOutput(this, "ClusterName", { value: cluster.clusterName });
    new CfnOutput(this, "MigrationTaskDefinitionArn", {
      value: migrationTaskDefinition.taskDefinitionArn,
    });
    new CfnOutput(this, "TaskSecurityGroupId", {
      value: taskSecurityGroup.securityGroupId,
    });
    new CfnOutput(this, "PublicSubnetIds", {
      value: vpc.publicSubnets.map((subnet) => subnet.subnetId).join(","),
    });
    new CfnOutput(this, "ServiceDesiredCount", { value: String(props.desiredCount) });
    new CfnOutput(this, "WebOidcClientSecretArn", {
      value: webOidcClientSecret.secretArn,
    });
    new CfnOutput(this, "AccountDeletionClientSecretArn", { value: accountDeletionSecret.secretArn });
    new CfnOutput(this, "EmailVerificationClientSecretArn", { value: emailVerificationSecret.secretArn });
    new CfnOutput(this, "StripeTestApiKeySecretArn", {
      value: stripeTestApiKeySecret.secretArn,
    });
    new CfnOutput(this, "StripeTestWebhookSecretArn", {
      value: stripeTestWebhookSecret.secretArn,
    });
    if (appleIapKeyIdSecret && appleIapIssuerIdSecret && appleIapPrivateKeySecret) {
      new CfnOutput(this, "AppleIapKeyIdSecretArn", {
        value: appleIapKeyIdSecret.secretArn,
      });
      new CfnOutput(this, "AppleIapIssuerIdSecretArn", {
        value: appleIapIssuerIdSecret.secretArn,
      });
      new CfnOutput(this, "AppleIapPrivateKeySecretArn", {
        value: appleIapPrivateKeySecret.secretArn,
      });
    }
    new CfnOutput(this, "StagingOperatorRoleArn", {
      value: stagingOperatorRole.roleArn,
    });
  }
}
