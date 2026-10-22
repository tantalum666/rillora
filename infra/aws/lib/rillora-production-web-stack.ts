import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CfnOutput, Duration, RemovalPolicy, Stack, Tags, type StackProps,
  aws_s3 as s3, aws_s3_deployment as deployment, aws_cloudfront as cloudfront,
  aws_cloudfront_origins as origins, aws_certificatemanager as acm, aws_iam as iam } from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import { readVerifiedClientArtifact } from './client-artifact-files.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const contractBytes = readFileSync(resolve(root, 'config/production-connections.json'));
const speechModel = JSON.parse(readFileSync(resolve(root, 'config/local-transcription.json'), 'utf8'));
export const productionConnections = JSON.parse(contractBytes.toString());
export const PRODUCTION_WEB_CSP = "default-src 'self'; base-uri 'self'; connect-src 'self'; font-src 'self'; form-action 'self' https://login.rillora.xyz; frame-ancestors 'none'; img-src 'self' data:; object-src 'none'; script-src 'self'; style-src 'self'";

export function verifyProductionClientArtifact(directory: string, reviewEnabled = false, liveEnabled = false, customerMcpEnabled = false, legacyContentEnabled = false, localTranscriptionEnabled = false): void {
  const manifest = readVerifiedClientArtifact(directory, 'production-build.json');
  if ((reviewEnabled && liveEnabled) || productionConnections.schemaVersion !== 1 || !['closed','live'].includes(productionConnections.customerAccess)
    || (liveEnabled && productionConnections.customerAccess !== 'live')
    || (customerMcpEnabled && (!liveEnabled || manifest.aiConnections !== true))
    || (!customerMcpEnabled && manifest.aiConnections === true)
    || Boolean(manifest.legacyContent) !== legacyContentEnabled || Boolean(manifest.localTranscription) !== localTranscriptionEnabled
    || (legacyContentEnabled && !liveEnabled) || (localTranscriptionEnabled && !legacyContentEnabled)
    || manifest.version !== 1 || manifest.surface !== 'production-client' || manifest.customerAccess !== (liveEnabled ? 'live' : 'closed')
    || manifest.publicationCandidate !== true
    || (reviewEnabled ? manifest.reviewAccess !== 'identity-allowlist' : manifest.reviewAccess !== undefined)
    || manifest.webOrigin !== productionConnections.webOrigin || manifest.apiBaseURL !== productionConnections.apiBaseURL
    || manifest.connectionsSha256 !== createHash('sha256').update(contractBytes).digest('hex')) {
    throw new Error('Only a matching production client artifact with the explicitly selected access mode is accepted');
  }
  if (localTranscriptionEnabled) for (const asset of speechModel.files) {
    const path = speechModel.publicPath.slice(1) + asset.path;
    if (manifest.files[path] !== asset.sha256) throw new Error('Speech model bytes do not match the reviewed version');
  }
}

/** Same-origin client delivery only. Existing API/customer activation is untouched. */
export class RilloraProductionWebStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps & { certificateArn: string; assetDirectory?: string; reviewEnabled?: boolean; liveEnabled?: boolean; customerMcpEnabled?: boolean; legacyContentEnabled?: boolean; localTranscriptionEnabled?: boolean }) {
    super(scope, id, props);
    if (props.env?.region !== 'eu-central-1') throw new Error('Production origin storage remains in Frankfurt');
    if (!/^arn:aws:acm:us-east-1:\d{12}:certificate\/[0-9a-f-]+$/.test(props.certificateArn)
      || props.certificateArn.split(':')[4] !== props.env.account) throw new Error('Use the reviewed same-account CloudFront certificate');
    const directory = props.assetDirectory ?? resolve(root, props.liveEnabled ? 'apps/web/dist-production-live' : props.reviewEnabled ? 'apps/web/dist-production-review' : 'apps/web/dist-production');
    verifyProductionClientArtifact(directory, props.reviewEnabled, props.liveEnabled, props.customerMcpEnabled, props.legacyContentEnabled, props.localTranscriptionEnabled);
    Tags.of(this).add('Project', 'Rillora'); Tags.of(this).add('Environment', 'Production');
    const assets = new s3.Bucket(this, 'Assets', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, enforceSSL: true,
      encryption: s3.BucketEncryption.S3_MANAGED, versioned: true, removalPolicy: RemovalPolicy.RETAIN,
      lifecycleRules: [{ noncurrentVersionExpiration: Duration.days(30) }],
    });
    const securityHeadersBehavior: cloudfront.ResponseSecurityHeadersBehavior = {
      contentSecurityPolicy: { contentSecurityPolicy: PRODUCTION_WEB_CSP
        .replace("script-src 'self'", props.localTranscriptionEnabled ? "script-src 'self' 'wasm-unsafe-eval'" : "script-src 'self'")
        + (props.legacyContentEnabled ? "; media-src 'self' blob:; worker-src 'self'" : ''), override: true },
      contentTypeOptions: { override: true },
      frameOptions: { frameOption: cloudfront.HeadersFrameOption.DENY, override: true },
      referrerPolicy: { referrerPolicy: cloudfront.HeadersReferrerPolicy.NO_REFERRER, override: true },
      strictTransportSecurity: { accessControlMaxAge: Duration.days(365), override: true },
    };
    const headers = new cloudfront.ResponseHeadersPolicy(this, 'WebHeaders', { securityHeadersBehavior });
    const apiHeaders = new cloudfront.ResponseHeadersPolicy(this, 'ApiHeaders', {
      securityHeadersBehavior,
      customHeadersBehavior: { customHeaders: [{ header: 'Cache-Control', value: 'no-store', override: true }] },
    });
    const router = new cloudfront.Function(this, 'Routes', {
      runtime: cloudfront.FunctionRuntime.JS_2_0,
      code: cloudfront.FunctionCode.fromFile({ filePath: resolve(root, 'apps/web/worker/production-router.js') }),
    });
    const association = [{ eventType: cloudfront.FunctionEventType.VIEWER_REQUEST, function: router }];
    const apiOrigin = new origins.HttpOrigin(productionConnections.originApiDomain, {
      protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
      originSslProtocols: [cloudfront.OriginSslPolicy.TLS_V1_2], readTimeout: Duration.seconds(30),
    });
    const distribution = new cloudfront.Distribution(this, 'Client', {
      comment: props.liveEnabled ? 'Rillora production Web client; server-owned customer access and subscriptions' : props.reviewEnabled
        ? 'Rillora restricted review client; server identity allowlist required, public customers closed'
        : 'Rillora production client candidate; server and client account access closed',
      domainNames: [new URL(productionConnections.webOrigin).hostname],
      certificate: acm.Certificate.fromCertificateArn(this, 'Certificate', props.certificateArn),
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, enableLogging: false,
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(assets),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED, compress: true,
        responseHeadersPolicy: headers, functionAssociations: association,
      },
      additionalBehaviors: Object.fromEntries(['/api/*', ...(props.customerMcpEnabled ? [
        '/.well-known/oauth-authorization-server/api/ai/oauth',
        '/.well-known/openid-configuration/api/ai/oauth',
        '/.well-known/oauth-protected-resource/api/mcp',
      ] : [])].map(path => [path, {
        origin: apiOrigin,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        responseHeadersPolicy: apiHeaders, functionAssociations: association, compress: true,
      }])),
      errorResponses: [400, 403, 404, 405, 414, 416, 500, 501, 502, 503, 504].map(httpStatus => ({ httpStatus, ttl: Duration.seconds(0) })),
    });
    const upload = new deployment.BucketDeployment(this, 'Deployment', {
      sources: [deployment.Source.asset(directory)], destinationBucket: assets,
      // Existing browser tabs may still request immutable chunks from the previous build.
      distribution, distributionPaths: ['/*'], prune: !props.customerMcpEnabled,
      cacheControl: [deployment.CacheControl.fromString('public,max-age=300,must-revalidate')],
    });
    // CDK's deployment provider grants invalidations on *. Explicitly limit that
    // effective capability to this distribution, including in shared accounts.
    upload.handlerRole.addToPrincipalPolicy(new iam.PolicyStatement({
      effect: iam.Effect.DENY,
      actions: ['cloudfront:GetInvalidation', 'cloudfront:CreateInvalidation'],
      notResources: [distribution.distributionArn],
    }));
    new CfnOutput(this, 'ClientUrl', { value: productionConnections.webOrigin });
    new CfnOutput(this, 'DistributionId', { value: distribution.distributionId });
    new CfnOutput(this, 'DistributionDomain', { value: distribution.distributionDomainName });
    new CfnOutput(this, 'BucketName', { value: assets.bucketName });
    new CfnOutput(this, 'CustomerAccess', { value: props.liveEnabled ? 'live' : 'closed' });
    if (props.reviewEnabled) new CfnOutput(this, 'ReviewAccess', { value: 'identity-allowlist' });
  }
}
