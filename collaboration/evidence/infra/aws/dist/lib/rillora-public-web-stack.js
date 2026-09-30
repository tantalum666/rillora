import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CfnOutput, Duration, RemovalPolicy, Stack, Tags, aws_s3 as s3, aws_s3_deployment as deployment, aws_cloudfront as cloudfront, aws_cloudfront_origins as origins, aws_certificatemanager as acm } from 'aws-cdk-lib';
export const PUBLIC_CSP = "default-src 'none'; base-uri 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'";
export class RilloraPublicWebStack extends Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        if (!/^arn:aws:acm:us-east-1:\d{12}:certificate\/[0-9a-f-]+$/.test(props.certificateArn))
            throw new Error('Public CloudFront requires the reviewed us-east-1 certificate');
        const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
        const directory = props.assetDirectory ?? resolve(root, 'apps/web/dist-public');
        const marker = JSON.parse(readFileSync(resolve(directory, 'public-build.json'), 'utf8'));
        const digest = createHash('sha256').update(readFileSync(resolve(directory, 'index.html'))).digest('hex');
        const storage = marker.browserStorage;
        const noBrowserStorage = marker.cookiesOrStorage === false && storage === undefined;
        const appearanceOnly = marker.version === 2 && marker.cookiesOrStorage === true
            && storage?.cookies === false && storage?.tracking === false
            && storage?.purpose === 'user-selected-appearance'
            && Array.isArray(storage?.localStorageKeys) && storage.localStorageKeys.length === 1
            && storage.localStorageKeys[0] === 'rillora.website.appearance.v1'
            && Object.keys(storage).length === 4;
        if (marker.surface !== 'public-information' || marker.accountsEnabled !== false
            || marker.apiEnabled !== false || (!noBrowserStorage && !appearanceOnly) || marker.htmlSha256 !== digest) {
            throw new Error('Only the verified public-information artifact is accepted');
        }
        Tags.of(this).add('Project', 'Rillora');
        Tags.of(this).add('Purpose', 'PublicInformation');
        const bucket = new s3.Bucket(this, 'PublicAssets', {
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, enforceSSL: true,
            encryption: s3.BucketEncryption.S3_MANAGED, versioned: true,
            removalPolicy: RemovalPolicy.RETAIN,
            lifecycleRules: [{ noncurrentVersionExpiration: Duration.days(30) }],
        });
        const headers = new cloudfront.ResponseHeadersPolicy(this, 'Headers', {
            securityHeadersBehavior: {
                contentSecurityPolicy: { contentSecurityPolicy: PUBLIC_CSP, override: true },
                contentTypeOptions: { override: true },
                frameOptions: { frameOption: cloudfront.HeadersFrameOption.DENY, override: true },
                referrerPolicy: { referrerPolicy: cloudfront.HeadersReferrerPolicy.NO_REFERRER, override: true },
                strictTransportSecurity: { accessControlMaxAge: Duration.days(365), override: true },
            },
            customHeadersBehavior: { customHeaders: [{ header: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()', override: true }] },
        });
        const router = new cloudfront.Function(this, 'PublicRoutes', {
            runtime: cloudfront.FunctionRuntime.JS_2_0,
            code: cloudfront.FunctionCode.fromFile({ filePath: resolve(root, 'apps/web/worker/public-router.js') }),
        });
        const distribution = new cloudfront.Distribution(this, 'Website', {
            comment: 'Rillora public information only; no customer API, identity or checkout',
            domainNames: ['www.rillora.xyz'],
            certificate: acm.Certificate.fromCertificateArn(this, 'Certificate', props.certificateArn),
            minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
            priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
            defaultBehavior: {
                origin: origins.S3BucketOrigin.withOriginAccessControl(bucket),
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
                cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
                compress: true, responseHeadersPolicy: headers,
                functionAssociations: [{ eventType: cloudfront.FunctionEventType.VIEWER_REQUEST, function: router }],
            },
        });
        new deployment.BucketDeployment(this, 'PublicDeployment', {
            sources: [deployment.Source.asset(directory)], destinationBucket: bucket,
            distribution, distributionPaths: ['/*'], prune: false,
            cacheControl: [deployment.CacheControl.fromString('public,max-age=300,must-revalidate')],
        });
        new CfnOutput(this, 'DistributionId', { value: distribution.distributionId });
        new CfnOutput(this, 'DistributionDomain', { value: distribution.distributionDomainName });
        new CfnOutput(this, 'PublicUrl', { value: 'https://www.rillora.xyz' });
        new CfnOutput(this, 'BucketName', { value: bucket.bucketName });
    }
}
