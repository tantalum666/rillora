import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, lstatSync } from 'node:fs';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CfnOutput, Duration, RemovalPolicy, Stack, Tags, type StackProps,
  aws_s3 as s3, aws_s3_deployment as deployment, aws_cloudfront as cloudfront,
  aws_cloudfront_origins as origins, aws_certificatemanager as acm, aws_iam as iam } from 'aws-cdk-lib';
import type { Construct } from 'constructs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const contractBytes = readFileSync(resolve(root, 'config/production-connections.json'));
export const productionConnections = JSON.parse(contractBytes.toString());
export const PRODUCTION_WEB_CSP = "default-src 'self'; base-uri 'self'; connect-src 'self'; font-src 'self'; form-action 'self' https://login.rillora.xyz; frame-ancestors 'none'; img-src 'self' data:; object-src 'none'; script-src 'self'; style-src 'self'";

export function verifyProductionClientArtifact(directory: string, reviewEnabled = false): void {
  const manifest = JSON.parse(readFileSync(resolve(directory, 'production-build.json'), 'utf8'));
  if (productionConnections.schemaVersion !== 1 || productionConnections.customerAccess !== 'closed'
    || manifest.version !== 1 || manifest.surface !== 'production-client' || manifest.customerAccess !== 'closed'
    || manifest.publicationCandidate !== true
    || (reviewEnabled ? manifest.reviewAccess !== 'identity-allowlist' : manifest.reviewAccess !== undefined)
    || manifest.webOrigin !== productionConnections.webOrigin || manifest.apiBaseURL !== productionConnections.apiBaseURL
    || manifest.connectionsSha256 !== createHash('sha256').update(contractBytes).digest('hex')
    || !manifest.files || typeof manifest.files !== 'object' || Array.isArray(manifest.files)) {
    throw new Error('Only a matching production client artifact with the explicitly selected access mode is accepted');
  }
  const observed: string[] = [];
  function visit(folder: string) {
    for (const name of readdirSync(folder)) {
      const path = resolve(folder, name), stat = lstatSync(path);
      if (stat.isSymbolicLink()) throw new Error('Artifact symlink rejected');
      if (stat.isDirectory()) visit(path);
      else {
        const key = relative(directory, path);
        if (key === 'production-build.json') continue;
        if (key !== 'index.html' && !/^assets\/[A-Za-z0-9_-]+\.(js|css|png|jpe?g|webp|svg|woff|woff2|txt)$/.test(key)) throw new Error('Unexpected production artifact path');
        observed.push(key);
        if (manifest.files[key] !== createHash('sha256').update(readFileSync(path)).digest('hex')) throw new Error('Production asset hash mismatch');
      }
    }
  }
  visit(resolve(directory));
  if (!observed.includes('index.html') || JSON.stringify(observed.sort()) !== JSON.stringify(Object.keys(manifest.files).sort())) throw new Error('Production asset manifest is incomplete');
}

/** Same-origin client delivery only. Existing API/customer activation is untouched. */
export class RilloraProductionWebStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps & { certificateArn: string; assetDirectory?: string; reviewEnabled?: boolean }) {
    super(scope, id, props);
    if (props.env?.region !== 'eu-central-1') throw new Error('Production origin storage remains in Frankfurt');
    if (!/^arn:aws:acm:us-east-1:\d{12}:certificate\/[0-9a-f-]+$/.test(props.certificateArn)
      || props.certificateArn.split(':')[4] !== props.env.account) throw new Error('Use the reviewed same-account CloudFront certificate');
    const directory = props.assetDirectory ?? resolve(root, props.reviewEnabled ? 'apps/web/dist-production-review' : 'apps/web/dist-production');
    verifyProductionClientArtifact(directory, props.reviewEnabled);
    Tags.of(this).add('Project', 'Rillora'); Tags.of(this).add('Environment', 'Production');
    const assets = new s3.Bucket(this, 'Assets', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, enforceSSL: true,
      encryption: s3.BucketEncryption.S3_MANAGED, versioned: true, removalPolicy: RemovalPolicy.RETAIN,
      lifecycleRules: [{ noncurrentVersionExpiration: Duration.days(30) }],
    });
    const securityHeadersBehavior: cloudfront.ResponseSecurityHeadersBehavior = {
      contentSecurityPolicy: { contentSecurityPolicy: PRODUCTION_WEB_CSP, override: true },
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
    const distribution = new cloudfront.Distribution(this, 'Client', {
      comment: props.reviewEnabled
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
      additionalBehaviors: { '/api/*': {
        origin: new origins.HttpOrigin(productionConnections.originApiDomain, {
          protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
          originSslProtocols: [cloudfront.OriginSslPolicy.TLS_V1_2], readTimeout: Duration.seconds(30),
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        responseHeadersPolicy: apiHeaders, functionAssociations: association, compress: true,
      } },
      errorResponses: [400, 403, 404, 405, 414, 416, 500, 501, 502, 503, 504].map(httpStatus => ({ httpStatus, ttl: Duration.seconds(0) })),
    });
    const upload = new deployment.BucketDeployment(this, 'Deployment', {
      sources: [deployment.Source.asset(directory)], destinationBucket: assets,
      distribution, distributionPaths: ['/*'], prune: true,
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
    new CfnOutput(this, 'CustomerAccess', { value: 'closed' });
    if (props.reviewEnabled) new CfnOutput(this, 'ReviewAccess', { value: 'identity-allowlist' });
  }
}
