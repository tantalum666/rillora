import { App } from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { describe, expect, it } from "vitest";
import { RilloraStagingStack } from "../lib/rillora-staging-stack.js";
function templateFor(desiredCount = 0) {
    const app = new App();
    const stack = new RilloraStagingStack(app, "TestStack", {
        env: { account: "111111111111", region: "eu-central-1" },
        desiredCount,
    });
    return Template.fromStack(stack);
}
describe("Rillora staging infrastructure", () => {
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
    it("runs the interruptible synthetic API service on Fargate Spot", () => {
        templateFor(1).hasResourceProperties("AWS::ECS::Service", {
            DesiredCount: 1,
            CapacityProviderStrategy: [{ CapacityProvider: "FARGATE_SPOT", Weight: 1 }],
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
        const taskDefinitions = Object.values(resources);
        const apiContainer = taskDefinitions
            .flatMap((resource) => resource.Properties.ContainerDefinitions)
            .find((candidate) => candidate.Name === "Api");
        expect(apiContainer).toBeDefined();
        expect(Object.fromEntries(apiContainer.Environment.map(({ Name, Value }) => [Name, Value]))).toMatchObject({
            ALLOW_DEV_AUTH: "false",
            ALLOW_SYNTHETIC_RECIPIENT_REHEARSAL: "false",
            DATABASE_SSL_MODE: "verify-full",
            DATABASE_CONNECTION_TIMEOUT_MS: "45000",
        });
        expect(apiContainer.Secrets.map(({ Name }) => Name)).toEqual(expect.arrayContaining(["DATABASE_USER", "DATABASE_PASSWORD", "OIDC_CLIENT_SECRET"]));
        expect(apiContainer.Environment.map(({ Name }) => Name)).toEqual(expect.arrayContaining([
            "OIDC_CLIENT_ID",
            "OIDC_REDIRECT_URI",
            "WEB_APP_ORIGIN",
            "NATIVE_OIDC_CLIENT_ID",
            "OIDC_API_AUDIENCE",
        ]));
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
            }),
        });
    });
});
