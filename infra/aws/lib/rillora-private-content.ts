import { Construct } from 'constructs';
import { Aws, CfnOutput, Duration, RemovalPolicy, aws_s3 as s3, aws_iam as iam, aws_ecs as ecs } from 'aws-cdk-lib';

/** Only opaque, application-encrypted objects. No website, public URL or CDN. */
export class RilloraPrivateContent extends Construct {
  readonly bucket: s3.Bucket;
  constructor(scope: Construct, id: string, readonly environment: 'production' | 'staging') {
    super(scope, id);
    this.bucket = new s3.Bucket(this, 'Files', {
      bucketName: `rillora-${environment}-private-content-${Aws.ACCOUNT_ID}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
      encryption: s3.BucketEncryption.S3_MANAGED, enforceSSL: true, versioned: true,
      removalPolicy: RemovalPolicy.RETAIN, autoDeleteObjects: false,
      lifecycleRules: [{ id: 'BoundedOldCopies', noncurrentVersionExpiration: Duration.days(90), abortIncompleteMultipartUploadAfter: Duration.days(1) }],
    });
    new CfnOutput(this, 'BucketName', { value: this.bucket.bucketName });
  }
  environmentValues(enabled: boolean) {
    return { RILLORA_LEGACY_CONTENT_ENABLED: enabled ? 'true' : 'false', RILLORA_CONTENT_BUCKET: this.bucket.bucketName };
  }
  allowApi(role: iam.IRole) {
    role.addToPrincipalPolicy(new iam.PolicyStatement({ actions: ['s3:GetObject'], resources: [this.bucket.arnForObjects('content/*')] }));
    role.addToPrincipalPolicy(new iam.PolicyStatement({ actions: ['s3:PutObject'], resources: [this.bucket.arnForObjects('content/*')],
      conditions: { StringEquals: { 's3:x-amz-server-side-encryption': 'AES256' } } }));
  }
  allowCleanup(task: ecs.FargateTaskDefinition, enabled: boolean) {
    task.taskRole.addToPrincipalPolicy(new iam.PolicyStatement({ actions: ['s3:ListBucketVersions'], resources: [this.bucket.bucketArn],
      conditions: { StringLike: { 's3:prefix': ['content/*'] } } }));
    task.taskRole.addToPrincipalPolicy(new iam.PolicyStatement({ actions: ['s3:DeleteObjectVersion'], resources: [this.bucket.arnForObjects('content/*')] }));
    for (const [key, value] of Object.entries(this.environmentValues(enabled))) task.defaultContainer!.addEnvironment(key, value);
  }
}
