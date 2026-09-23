import { App } from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { describe, expect, it } from "vitest";
import { RilloraStagingStack } from "../lib/rillora-staging-stack.js";

function templateFor(
  desiredCount = 0,
  stripeTestIntegrationEnabled = false,
  appleStoreKitSandboxEnabled = false,
  familyMaintenancePreviewEnabled = false,
  accountDeletionEnabled = false,
  emailVerificationEnabled = false,
  contentMigrationEnabled = false,
  contentProtectionMode: "read-compatible" | "encrypted" = "encrypted",
): Template {
  const app = new App();
  const stack = new RilloraStagingStack(app, "TestStack", {
    env: { account: "111111111111", region: "eu-central-1" },
    desiredCount,
    stripeTestIntegrationEnabled,
    appleStoreKitSandboxEnabled,
    familyMaintenancePreviewEnabled,
    accountDeletionEnabled,
    emailVerificationEnabled,
    contentMigrationEnabled,
    contentProtectionMode,
  });
  return Template.fromStack(stack);
}

describe("Rillora staging infrastructure", () => {
  it("retains and rotates content keys with only purpose-scoped runtime usage", () => {
    const template = templateFor();
    template.hasResource("AWS::KMS::Key", { DeletionPolicy: "Retain", UpdateReplacePolicy: "Retain",
      Properties: { EnableKeyRotation: true, PendingWindowInDays: 30 } });
    const use = Object.values(template.findResources("AWS::IAM::Policy"))
      .flatMap(policy => policy.Properties.PolicyDocument.Statement)
      .filter(statement => statement.Sid === "UseOnlyStagingContentKeys");
    expect(use).toHaveLength(1);
    expect(use[0].Action).toEqual(["kms:GenerateDataKey", "kms:Decrypt"]);
    expect(JSON.stringify(use[0].Resource)).toContain("PrivateContentKey");
    expect(use[0].Condition.StringEquals).toEqual({
      "kms:EncryptionContext:rillora_application": "content-v1",
      "kms:EncryptionContext:rillora_environment": "rillora-staging",
    });
    expect(use[0].Condition.Null).toEqual({ "kms:EncryptionContext:owner_id": "false", "kms:EncryptionContext:key_id": "false" });
    const containers = Object.values(template.findResources("AWS::ECS::TaskDefinition")).flatMap(r => r.Properties.ContainerDefinitions);
    expect(containers.find(c => c.Name === "Api").Environment).toContainEqual({Name:"CONTENT_PROTECTION_MODE",Value:"encrypted"});
    expect(containers.find(c => c.Name === "Migration").Environment.some((e:{Name:string})=>e.Name.startsWith("CONTENT_"))).toBe(false);
  });
  it("enables migration keys explicitly while retaining a compatibility reader", () => {
    const template = templateFor(1,true,false,true,true,true,true,"read-compatible");
    const use = Object.values(template.findResources("AWS::IAM::Policy"))
      .flatMap(policy => policy.Properties.PolicyDocument.Statement).filter(statement=>statement.Sid==="UseOnlyStagingContentKeys");
    expect(use).toHaveLength(2);
    const containers=Object.values(template.findResources("AWS::ECS::TaskDefinition")).flatMap(r=>r.Properties.ContainerDefinitions);
    expect(containers.find(c=>c.Name==="Api").Environment).toContainEqual({Name:"CONTENT_PROTECTION_MODE",Value:"read-compatible"});
    expect(containers.find(c=>c.Name==="Migration").Environment).toContainEqual({Name:"CONTENT_PROTECTION_MODE",Value:"encrypted"});
  });
  it("keeps capacity diagnostics read-only and in the stack region", () => {
    const statements = Object.values(templateFor().findResources("AWS::IAM::Policy"))
      .flatMap(policy => policy.Properties.PolicyDocument.Statement);
    const read = statements.find(statement => statement.Sid === "ReadOnlyRegionalCapacityDiagnostics");
    expect(read.Action).toEqual(["ecs:DescribeTaskDefinition", "cloudwatch:GetMetricStatistics"]);
    expect(read.Condition).toEqual({ StringEquals: { "aws:RequestedRegion": "eu-central-1" } });
    const snapshot=statements.find(statement=>statement.Sid==="SnapshotOnlyStagingContentMigration");
    expect(snapshot.Action).toBe("rds:CreateDBSnapshot");
    expect(snapshot.Resource).toHaveLength(2);
    expect(JSON.stringify(snapshot.Resource)).toContain(":snapshot:rillora-content-encryption-*");
    expect(snapshot.Resource).not.toContain("*");
  });
  it("isolates the read-only verification secret and injects it only after activation", () => {
    for (const enabled of [false, true]) {
      const template = templateFor(1, false, false, false, false, enabled);
      const api = Object.values(template.findResources("AWS::ECS::TaskDefinition")).flatMap(r => r.Properties.ContainerDefinitions).find(c => c.Name === "Api");
      expect(api.Secrets.some((s: {Name:string}) => s.Name === "AUTH0_EMAIL_VERIFICATION_CLIENT_SECRET")).toBe(enabled);
      expect(api.Environment.some((s: {Name:string}) => s.Name === "AUTH0_EMAIL_VERIFICATION_CLIENT_ID")).toBe(enabled);
      expect(api.Secrets.some((s: {Name:string}) => s.Name === "AUTH0_DELETION_CLIENT_SECRET")).toBe(false);
    }
  });
  it("scopes gateway diagnostics to its access log group without granting writes", () => {
    const statements=Object.values(templateFor().findResources("AWS::IAM::Policy"))
      .flatMap(policy=>policy.Properties.PolicyDocument.Statement);
    const read=statements.find(statement=>statement.Sid==="ReadOnlyStagingGatewayDiagnostics");
    expect(read.Action).toEqual(["logs:DescribeLogStreams","logs:GetLogEvents","logs:FilterLogEvents"]);
    expect(read.Resource).toHaveLength(2);
    for(const resource of read.Resource) {
      expect(resource).not.toBe("*");
      expect(JSON.stringify(resource)).toContain("HttpApiAccessLogs");
    }
  });
  it("injects the dedicated deletion credential only after explicit activation", () => {
    for (const enabled of [false, true]) {
      const template = templateFor(1, false, false, false, enabled);
      const api = Object.values(template.findResources("AWS::ECS::TaskDefinition")).flatMap(r => r.Properties.ContainerDefinitions).find(c => c.Name === "Api");
      expect(api.Secrets.some((s: {Name:string}) => s.Name === "AUTH0_DELETION_CLIENT_SECRET")).toBe(enabled);
      expect(api.Environment.some((s: {Name:string}) => s.Name === "AUTH0_DELETION_CLIENT_ID")).toBe(enabled);
      const policies = JSON.stringify(template.findResources("AWS::IAM::Policy"));
      expect(policies).toContain("AccountDeletionClientSecret");
    }
  });

  it("keeps maintenance preview explicit without adding billing resources", () => {
    const template = templateFor(1, false, false, true);
    const definitions = Object.values(template.findResources("AWS::ECS::TaskDefinition"));
    const api = definitions.flatMap((resource) => resource.Properties.ContainerDefinitions)
      .find((container) => container.Name === "Api");
    const environment = Object.fromEntries(api.Environment.map((entry: { Name: string; Value: unknown }) => [entry.Name, entry.Value]));
    expect(environment).toMatchObject({ ALLOW_FAMILY_MAINTENANCE_PREVIEW: "true", ALLOW_DEV_AUTH: "false", ALLOW_STRIPE_TEST_INTEGRATION: "false" });
    expect(Object.keys(template.findResources("AWS::SecretsManager::Secret"))).toHaveLength(
      Object.keys(templateFor().findResources("AWS::SecretsManager::Secret")).length,
    );
  });
  it("keeps the first deploy at zero API tasks until migrations are complete", () => {
    templateFor().hasResourceProperties("AWS::ECS::Service", { DesiredCount: 0 });
  });

  it("keeps Single-AZ RDS PostgreSQL private, encrypted, and deletion protected", () => {
    const template = templateFor();
    template.hasResourceProperties("AWS::RDS::DBInstance", {
      DBInstanceClass: "db.t4g.micro",
      Engine: "postgres",
      AllocatedStorage: "20",
      StorageType: "gp3",
      StorageEncrypted: true,
      MultiAZ: false,
      PubliclyAccessible: false,
      DeletionProtection: true,
      BackupRetentionPeriod: 1,
      DBName: "rillora",
    });
    template.resourceCountIs("AWS::RDS::DBCluster", 0);
  });

  it("keeps the interactive API and payment receiver on regular Fargate capacity", () => {
    templateFor(1).hasResourceProperties("AWS::ECS::Service", {
      DesiredCount: 1,
      CapacityProviderStrategy: [{ CapacityProvider: "FARGATE", Weight: 1 }],
      ForceNewDeployment: { EnableForceNewDeployment: true, ForceNewDeploymentNonce: "api-on-demand-20260917" },
    });
  });

  it("creates an MFA-gated least-privilege staging operator role", () => {
    templateFor().hasResourceProperties("AWS::IAM::Role", {
      RoleName: "rillora-staging-operator",
      Path: "/rillora/",
      MaxSessionDuration: 3600,
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Action: "sts:AssumeRole",
            Condition: { Bool: { "aws:MultiFactorAuthPresent": "true" } },
            Effect: "Allow",
            Principal: {
              AWS: Match.anyValue(),
            },
          },
        ],
      },
    });
  });

  it("injects runtime credentials from Secrets Manager and disables unsafe surfaces", () => {
    const resources = templateFor(1).findResources("AWS::ECS::TaskDefinition");
    const taskDefinitions = Object.values(resources) as Array<{
      Properties: {
        ContainerDefinitions: Array<{
          Name: string;
          Environment?: Array<{ Name: string; Value: string }>;
          Secrets?: Array<{ Name: string }>;
        }>;
      };
    }>;
    const apiContainer = taskDefinitions
      .flatMap((resource) => resource.Properties.ContainerDefinitions)
      .find((candidate) => candidate.Name === "Api");
    expect(apiContainer).toBeDefined();
    expect(Object.fromEntries(apiContainer!.Environment!.map(({ Name, Value }) => [Name, Value]))).toMatchObject({
      ALLOW_DEV_AUTH: "false",
      ALLOW_SYNTHETIC_RECIPIENT_REHEARSAL: "false",
      ALLOW_STRIPE_TEST_INTEGRATION: "false",
      ALLOW_APPLE_SANDBOX_INTEGRATION: "false",
      DATABASE_SSL_MODE: "verify-full",
      DATABASE_CONNECTION_TIMEOUT_MS: "45000",
    });
    expect(apiContainer!.Secrets!.map(({ Name }) => Name)).toEqual(
      expect.arrayContaining(["DATABASE_USER", "DATABASE_PASSWORD", "OIDC_CLIENT_SECRET"]),
    );
    expect(apiContainer!.Environment!.map(({ Name }) => Name)).toEqual(
      expect.arrayContaining([
        "OIDC_CLIENT_ID",
        "OIDC_REDIRECT_URI",
        "WEB_APP_ORIGIN",
        "NATIVE_OIDC_CLIENT_ID",
        "OIDC_API_AUDIENCE",
      ]),
    );
  });

  it("creates three write-only Apple IAP secrets only when Sandbox Server API is enabled", () => {
    const disabled = templateFor(1);
    disabled.resourceCountIs("AWS::SecretsManager::Secret", 7);

    const enabled = templateFor(1, false, true);
    enabled.resourceCountIs("AWS::SecretsManager::Secret", 10);
    const enabledTasks = enabled.findResources("AWS::ECS::TaskDefinition");
    const enabledApi = (Object.values(enabledTasks) as Array<{
      Properties: {
        ContainerDefinitions: Array<{
          Name: string;
          Environment?: Array<{ Name: string; Value: string }>;
          Secrets?: Array<{ Name: string }>;
        }>;
      };
    }>).flatMap((resource) => resource.Properties.ContainerDefinitions)
      .find((candidate) => candidate.Name === "Api");
    expect(enabledApi!.Secrets!.map(({ Name }) => Name)).toEqual(
      expect.arrayContaining([
        "APPLE_IAP_KEY_ID",
        "APPLE_IAP_ISSUER_ID",
        "APPLE_IAP_PRIVATE_KEY",
      ]),
    );
    expect(Object.fromEntries(enabledApi!.Environment!.map(({ Name, Value }) => [Name, Value])))
      .toMatchObject({
        ALLOW_APPLE_SANDBOX_INTEGRATION: "true",
        APPLE_SANDBOX_STAGING_MODE: "true",
        APPLE_ROOT_CERTIFICATE_DIRECTORY: "/app/certificates/apple",
      });
    enabled.hasResourceProperties("AWS::IAM::Policy", {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Sid: "ReplaceOnlyTheStagingAppleIapSecrets",
            Action: ["secretsmanager:DescribeSecret", "secretsmanager:PutSecretValue"],
            Effect: "Allow",
          }),
        ]),
      },
    });
  });

  it("creates write-only operator paths for separate Stripe test secrets and injects them only when enabled", () => {
    const disabled = templateFor(1);
    disabled.resourceCountIs("AWS::SecretsManager::Secret", 7);
    const disabledTasks = disabled.findResources("AWS::ECS::TaskDefinition");
    const disabledApi = (Object.values(disabledTasks) as Array<{
      Properties: { ContainerDefinitions: Array<{ Name: string; Secrets?: Array<{ Name: string }> }> };
    }>).flatMap((resource) => resource.Properties.ContainerDefinitions)
      .find((candidate) => candidate.Name === "Api");
    expect(disabledApi!.Secrets!.map(({ Name }) => Name)).not.toEqual(
      expect.arrayContaining(["STRIPE_TEST_API_KEY", "STRIPE_TEST_WEBHOOK_SECRET"]),
    );

    const enabled = templateFor(1, true);
    const enabledTasks = enabled.findResources("AWS::ECS::TaskDefinition");
    const enabledApi = (Object.values(enabledTasks) as Array<{
      Properties: {
        ContainerDefinitions: Array<{
          Name: string;
          Environment?: Array<{ Name: string; Value: string }>;
          Secrets?: Array<{ Name: string }>;
        }>;
      };
    }>).flatMap((resource) => resource.Properties.ContainerDefinitions)
      .find((candidate) => candidate.Name === "Api");
    expect(enabledApi!.Secrets!.map(({ Name }) => Name)).toEqual(
      expect.arrayContaining(["STRIPE_TEST_API_KEY", "STRIPE_TEST_WEBHOOK_SECRET"]),
    );
    expect(Object.fromEntries(enabledApi!.Environment!.map(({ Name, Value }) => [Name, Value])))
      .toMatchObject({
        ALLOW_STRIPE_TEST_INTEGRATION: "true",
        STRIPE_TEST_STAGING_MODE: "true",
        STRIPE_EXPECTED_ACCOUNT_ID: "acct_1U6B2RCxTlowhyiG",
      });
    enabled.hasResourceProperties("AWS::IAM::Policy", {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: ["secretsmanager:DescribeSecret", "secretsmanager:PutSecretValue"],
            Effect: "Allow",
          }),
        ]),
      },
    });
  });

  it("does not create a NAT gateway or a public database", () => {
    const template = templateFor();
    template.resourceCountIs("AWS::EC2::NatGateway", 0);
    template.hasResourceProperties("AWS::RDS::DBInstance", { PubliclyAccessible: false });
  });

  it("serves the Web app from a private S3 origin and proxies only /api through CloudFront", () => {
    const template = templateFor(1);
    template.hasResourceProperties("AWS::S3::Bucket", {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          { ServerSideEncryptionByDefault: { SSEAlgorithm: "AES256" } },
        ],
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
    template.hasResourceProperties("AWS::CloudFront::Distribution", {
      DistributionConfig: Match.objectLike({
        Aliases: ["app.staging.rillora.xyz"],
        CacheBehaviors: [
          Match.objectLike({
            PathPattern: "/api/*",
            ViewerProtocolPolicy: "redirect-to-https",
          }),
        ],
        DefaultCacheBehavior: Match.objectLike({
          ViewerProtocolPolicy: "redirect-to-https",
        }),
        Enabled: true,
        ViewerCertificate: Match.objectLike({
          AcmCertificateArn: { Ref: "WebCertificateArn" },
          MinimumProtocolVersion: "TLSv1.2_2021",
          SslSupportMethod: "sni-only",
        }),
      }),
    });
  });
});
