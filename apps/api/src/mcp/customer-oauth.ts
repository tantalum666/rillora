import { createPrivateKey, type JsonWebKey } from 'node:crypto';
import Provider, { errors, type AdapterPayload, type Configuration } from 'oidc-provider';
import { Router, type Express, type Request, type Response } from 'express';
import { z } from 'zod';
import { OAuthError, OAuthErrorCode, requireBearerAuth, type AuthInfo } from '@modelcontextprotocol/server';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import type { AppConfig } from '../config.js';
import { withAuthDatabase, type DatabasePool } from '../db.js';
import { requireCsrf } from '../auth.js';
import { ApiError, asyncHandler } from '../errors.js';
import { preventCaching } from '../security.js';
import { requireRecentAuthentication } from '../recent-authentication.js';
import { Auth0EmailIdentityVerifier, type EmailIdentityVerifying } from '../email-verification.js';
import { SelectedAiService, connectionInput } from './service.js';
import { MCP_SCOPES, type McpConfig } from './config.js';
import type { McpActor } from './identity.js';
import { customerClients, customerClientMetadata } from './customer-clients.js';
import { OAuthStore, OAUTH_MAX_TTL } from './oauth-store.js';

const bindingSchema = z.object({plannerPublicId:z.uuid(),connectionId:z.uuid(),clientId:z.string(),
  issuer:z.string(),subject:z.string().min(1).max(255),scopes:z.array(z.enum(MCP_SCOPES)),
  identityScopes:z.array(z.enum(['openid','email'])),expiresAt:z.number().int().positive()}).strict();
type Binding = z.infer<typeof bindingSchema>;
const approvedInput = z.object({selection:connectionInput,
  interactionUid:z.string().min(20).max(128)}).strict();
const secretSchema = z.object({version:z.literal(1),storageKey:z.string().regex(/^[a-f0-9]{64}$/),
  cookieKeys:z.array(z.string().regex(/^[a-f0-9]{64}$/)).min(1).max(3),
  jwks:z.object({keys:z.array(z.record(z.string(),z.unknown())).min(1).max(3)})}).strict();
export type CustomerOAuthSecrets = z.infer<typeof secretSchema>;
const unavailable = () => new ApiError(403,'ai_connection_unavailable','Review this connection in Rillora and reconnect.');

/** An optional authorization surface. Existing Web/iOS identity and commercial routes are independent. */
export class CustomerOAuth {
  readonly provider: Provider;
  readonly interactions = Router();
  readonly issuer: string;
  private service: SelectedAiService;

  constructor(private pool: DatabasePool, private app: AppConfig, private config: McpConfig,
    private store: OAuthStore, secret: CustomerOAuthSecrets, private emailVerifier: EmailIdentityVerifying | null) {
    const origin = app.oidc?.webAppOrigin;
    if (!origin || config.resourceUrl !== origin + '/api/mcp') throw new Error('Customer MCP requires its same-origin production resource');
    this.issuer = origin + '/api/ai/oauth';
    this.service = new SelectedAiService(pool,app,config);
    const secure = new URL(origin).protocol === 'https:';
    if (app.nodeEnv === 'production' && !secure) throw new Error('Customer OAuth requires HTTPS');
    const options: Configuration = {
      adapter:store.adapter, clients:customerClientMetadata(), jwks:secret.jwks,
      claims:{openid:['sub'],email:['email','email_verified']}, scopes:['openid','email'],
      pkce:{required:()=>true}, responseTypes:['code'],
      cookies:{keys:secret.cookieKeys,
        names:{session:(secure?'__Host-':'')+'rillora_ai_session',interaction:(secure?'__Host-':'')+'rillora_ai_interaction',
          resume:(secure?'__Secure-':'')+'rillora_ai_resume'},
        long:{httpOnly:true,secure,sameSite:'lax',path:'/',signed:true},
        short:{httpOnly:true,secure,sameSite:'lax',path:'/',signed:true}},
      features:{devInteractions:{enabled:false},registration:{enabled:false},registrationManagement:{enabled:false},
        clientIdMetadataDocument:{enabled:false},clientCredentials:{enabled:false},deviceFlow:{enabled:false},
        pushedAuthorizationRequests:{enabled:false},dPoP:{enabled:false},rpInitiatedLogout:{enabled:false},
        revocation:{enabled:true,allowedPolicy:(_ctx,client,token)=>token.clientId===client.clientId},
        resourceIndicators:{enabled:true,defaultResource:()=>config.resourceUrl,useGrantedResource:()=>true,
          getResourceServerInfo:(_ctx,resource,client)=>{
            const allowed=customerClients.find(c=>c.clientId===client.clientId);
            if (resource!==config.resourceUrl || !allowed) throw new errors.InvalidTarget();
            return {audience:config.resourceUrl,scope:[...MCP_SCOPES,...(allowed.identityScopes?['openid','email']:[])].join(' '),
              accessTokenTTL:900,accessTokenFormat:'opaque'};
          }}},
      ttl:{AccessToken:900,AuthorizationCode:60,Interaction:600,Session:1800,Grant:OAUTH_MAX_TTL,IdToken:900,
        RefreshToken:(_ctx,token)=>Math.max(1,OAUTH_MAX_TTL-(Math.floor(Date.now()/1000)-(token.iiat??Math.floor(Date.now()/1000))))},
      expiresWithSession:()=>false,rotateRefreshToken:true,
      issueRefreshToken:async (_ctx,client,source)=>{
        if (!client.grantTypeAllowed('refresh_token') || !source.grantId) return false;
        await this.activeBinding(source.grantId); return true;
      },
      extraTokenClaims:async (_ctx,token)=>{
        if (token.kind !== 'AccessToken' || !token.grantId) throw new errors.InvalidGrant();
        const binding=await this.activeBinding(token.grantId);
        if (binding.clientId!==token.clientId || binding.plannerPublicId!==token.accountId) throw new errors.InvalidGrant();
        return {connectionId:binding.connectionId};
      },
      // Every new authorization returns to an explicit Rillora selection. A stale OP session never auto-grants it.
      loadExistingGrant:async ctx=>{
        const grantId=ctx.oidc.result?.consent?.grantId;
        return grantId ? this.provider.Grant.find(grantId) : undefined;
      },
      interactions:{url:()=>origin+'/account?next=ai-connect'},
      findAccount:async (_ctx,publicId)=>{
        const exists=await withAuthDatabase(pool,async c=>(await c.query("select 1 from app.planners where public_id=$1 and status='active'",[publicId])).rowCount);
        return exists?{accountId:publicId,claims:async()=>({sub:publicId})}:undefined;
      },
      routes:{userinfo:'/userinfo'},
      renderError:async ctx=>{
        const zh=/(^|,)\s*zh(?:-|;|,|$)/i.test(ctx.get('accept-language'));
        ctx.type='text/plain';ctx.body=zh?'连接未能完成。请返回 Rillora 后重新发起连接。':'The connection could not be completed. Return to Rillora and start again.';
      },
    };
    this.provider=new Provider(this.issuer,options);
    this.provider.proxy=app.trustProxyHops>0;
    this.provider.on('server_error',()=>process.stderr.write('AI authorization is temporarily unavailable.\n'));
    this.mountInteractions();
  }

  private actor(binding: Binding): McpActor {
    return {issuer:binding.issuer,subject:binding.subject,clientId:binding.clientId,scopes:binding.scopes,
      boundConnectionPublicId:binding.connectionId,issuedAt:Math.floor(Date.now()/1000)};
  }

  private async binding(grantId: string) {
    const value=bindingSchema.safeParse(await this.store.find('ConnectionBinding',grantId));
    if (!value.success || value.data.expiresAt<=Date.now()/1000 || value.data.issuer!==this.config.issuer.replace(/\/$/,'')) throw unavailable();
    return value.data;
  }

  private async activeBinding(grantId: string) {
    try {
      const binding=await this.binding(grantId);
      await this.service.assertAccess(this.actor(binding));
      if (binding.identityScopes.includes('email')) await this.service.assertIdentityDisclosure(this.actor(binding));
      return binding;
    } catch (error) {
      if (error instanceof ApiError) throw new errors.InvalidGrant('The Rillora authorization is no longer active');
      throw error;
    }
  }

  readonly verifier = {verifyAccessToken:async (value: string):Promise<AuthInfo>=>{
    try {
      if (!/^[A-Za-z0-9_-]{43,128}$/.test(value)) throw unavailable();
      const token=await this.provider.AccessToken.find(value);
      if (!token?.grantId || token.aud!==this.config.resourceUrl || !token.exp || token.exp<=Date.now()/1000
        || !Number.isSafeInteger(token.iat) || token.iat!>Date.now()/1000+30 || token.exp-token.iat!>900
        || typeof token.scope!=='string') throw unavailable();
      const binding=await this.binding(token.grantId),grant=await this.provider.Grant.find(token.grantId);
      if (!grant || grant.accountId!==binding.plannerPublicId || grant.clientId!==binding.clientId
        || token.accountId!==binding.plannerPublicId || token.clientId!==binding.clientId) throw unavailable();
      const scopes=token.scope.split(' '),allowed=[...binding.scopes,...binding.identityScopes];
      if (!scopes.includes(MCP_SCOPES[0]) || scopes.some(s=>!allowed.includes(s as typeof allowed[number]))) throw unavailable();
      const actor={...this.actor(binding),issuedAt:token.iat!,scopes};
      await this.service.assertAccess(actor);
      return {token:value,clientId:binding.clientId,scopes,expiresAt:token.exp,resource:new URL(this.config.resourceUrl),
        extra:{actor,grantId:token.grantId,plannerPublicId:binding.plannerPublicId}};
    } catch (error) {
      const invalid=error instanceof ApiError || error instanceof errors.InvalidGrant;
      throw new OAuthError(invalid?OAuthErrorCode.InvalidToken:OAuthErrorCode.ServerError,
        invalid?'A valid selected Rillora connection is required.':'Rillora authorization is temporarily unavailable.');
    }
  }};

  private async pending(request: Request,response: Response) {
    const details=await this.provider.interactionDetails(request,response);
    const client=customerClients.find(c=>c.clientId===details.params.client_id);
    const resource=details.params.resource;
    if (!client || resource!==this.config.resourceUrl || details.params.code_challenge_method!=='S256') throw unavailable();
    const requested=typeof details.params.scope==='string'?details.params.scope.split(' '):[];
    const permitted=[...MCP_SCOPES,...(client.identityScopes?['openid','email']:[])];
    if (!requested.includes(MCP_SCOPES[0]) || requested.some(s=>!permitted.includes(s as typeof permitted[number]))) throw unavailable();
    return {details,client,requested};
  }

  private mountInteractions() {
    this.interactions.get('/',asyncHandler(async (request,response)=>{
      try {
        const {details,client,requested}=await this.pending(request,response);
        response.json({pending:{uid:details.uid,clientKey:client.key,name:client.name,privacyUrl:client.privacyUrl,
          scopes:requested.filter(s=>MCP_SCOPES.includes(s as typeof MCP_SCOPES[number])),shareVerifiedEmail:requested.includes('email')}});
      } catch (error) {
        if (error instanceof errors.SessionNotFound) {response.json({pending:null});return;}
        throw error;
      }
    }));
    this.interactions.post('/complete',requireCsrf,asyncHandler(async (request,response)=>{
      if (request.auth.mode!=='session') throw unavailable();
      requireRecentAuthentication(this.app,request.auth);
      const input=approvedInput.parse(request.body),{details,client,requested}=await this.pending(request,response);
      if (input.interactionUid!==details.uid || input.selection.clientKey!==client.key
        || input.selection.scopes.some(s=>!requested.includes(s))
        || requested.includes('email') !== Boolean(input.selection.identityDisclosure)) throw unavailable();
      const identity=await withAuthDatabase(this.pool,async c=>(await c.query<{issuer:string;subject:string}>(
        `select i.issuer,i.subject from app.auth_sessions s join app.identity_accounts i on i.id=s.identity_account_id
         where s.public_id=$1 and s.planner_id=$2 and i.planner_id=$2 and s.revoked_at is null and s.expires_at>now()`,
        [request.auth.sessionPublicId,request.auth.plannerId])).rows[0]);
      if (!identity || identity.issuer!==this.config.issuer.replace(/\/$/,'')) throw unavailable();
      if (requested.includes('email') && (!this.emailVerifier || !await this.emailVerifier.verifiedEmail(identity))) {
        throw new ApiError(403,'ai_verified_email_required','Verify your email before connecting this application.');
      }
      const result=await this.service.authorize(request.auth.plannerId,input.selection);
      const grant=new this.provider.Grant({accountId:request.auth.plannerPublicId,clientId:client.clientId});
      const identityScopes=requested.filter((s):s is 'openid'|'email'=>s==='openid'||s==='email');
      grant.addOIDCScope(identityScopes);
      grant.addResourceScope(this.config.resourceUrl,[...input.selection.scopes,...identityScopes]);
      grant.rejectResourceScope(this.config.resourceUrl,requested.filter(s=>!input.selection.scopes.includes(s as typeof MCP_SCOPES[number])&&!identityScopes.includes(s as 'openid'|'email')));
      const binding:Binding={...identity,plannerPublicId:request.auth.plannerPublicId,clientId:client.clientId,
        connectionId:result.connection.publicId,scopes:input.selection.scopes,identityScopes,
        expiresAt:Math.floor(new Date(result.connection.expiresAt).getTime()/1000)};
      try {
        const grantId=await grant.save();
        await this.store.save('ConnectionBinding',grantId,binding as AdapterPayload,binding.expiresAt-Math.floor(Date.now()/1000));
        const redirectTo=await this.provider.interactionResult(request,response,{login:{accountId:binding.plannerPublicId,
          ts:Math.floor(request.auth.authenticatedAt!.getTime()/1000),remember:false},consent:{grantId}},{mergeWithLastSubmission:false});
        if (!redirectTo.startsWith(this.issuer+'/')) throw unavailable();
        response.json({redirectTo});
      } catch (error) {
        await this.service.revoke(request.auth.plannerId,result.connection.publicId,result.connection.version);
        throw error;
      }
    }));
    this.interactions.post('/cancel',requireCsrf,asyncHandler(async (request,response)=>{
      const input=z.object({interactionUid:z.string()}).strict().parse(request.body);
      const {details}=await this.pending(request,response);
      if (details.uid!==input.interactionUid) throw unavailable();
      response.json({redirectTo:await this.provider.interactionResult(request,response,{error:'access_denied'},{mergeWithLastSubmission:false})});
    }));
  }

  mountPublic(app: Express) {
    const router=Router(); router.use(preventCaching,(_req,res,next)=>{res.setHeader('x-robots-tag','noindex, nofollow');next();});
    router.get('/clients',(_req,res)=>res.json({serverUrl:this.config.resourceUrl,clients:customerClients.map(c=>({key:c.key,name:c.name,clientId:c.clientId,privacyUrl:c.privacyUrl}))}));
    // Resource-scoped tokens intentionally cannot use oidc-provider's OP-audience UserInfo route.
    // This same-resource endpoint checks the exact token, original grant and current selected connection.
    router.all('/userinfo',asyncHandler(async (request,response)=>{
      if (!['GET','POST'].includes(request.method)) {response.sendStatus(405);return;}
      const gate=requireBearerAuth({verifier:this.verifier,requiredScopes:['openid'],expectedResource:new URL(this.config.resourceUrl),
        resourceMetadataUrl:this.config.resourceUrl+'/resource-metadata'});
      const auth=await gate(new globalThis.Request(this.issuer+'/userinfo',{headers:{authorization:request.get('authorization')??''}}));
      if (auth instanceof globalThis.Response) {response.status(auth.status).set(Object.fromEntries(auth.headers)).send(await auth.text());return;}
      const binding=await this.binding(String(auth.extra?.grantId));
      const identity:{sub:string;email?:string;email_verified?:true}={sub:binding.plannerPublicId};
      if (auth.scopes.includes('email')) {
        await this.service.assertIdentityDisclosure(this.actor(binding));
        const email=await this.emailVerifier?.verifiedEmail(binding);
        if (!email) throw new ApiError(503,'email_verification_unavailable','Verified identity information is temporarily unavailable.');
        identity.email=email;identity.email_verified=true;
      }
      await this.service.assertAccess(this.actor(binding));
      if (auth.scopes.includes('email')) await this.service.assertIdentityDisclosure(this.actor(binding));
      response.json(identity);
    }));
    const canonical=new URL(this.issuer),callback=this.provider.callback();
    router.use((request,response)=>{
      // The edge removes /api and API Gateway supplies its own backend Host.
      // oidc-provider derives discovery and resume URLs from the request context,
      // so use only the configured public issuer, never caller-supplied forwarding headers.
      request.headers.host=canonical.host;
      request.headers['x-forwarded-host']=canonical.host;
      request.headers['x-forwarded-proto']=canonical.protocol.slice(0,-1);
      request.originalUrl=canonical.pathname+request.url;
      request.baseUrl=canonical.pathname;
      return callback(request,response);
    });
    app.use(['/ai/oauth','/api/ai/oauth'],router);
  }
}

export async function loadCustomerOAuth(pool:DatabasePool,app:AppConfig,config:McpConfig,env:NodeJS.ProcessEnv) {
  const arn=env.MCP_OAUTH_SECRET_ARN,table=env.MCP_OAUTH_TABLE;
  if (!arn || !/^arn:aws:secretsmanager:eu-central-1:133857166372:secret:rillora\/(production|staging)\/ai-oauth-[A-Za-z0-9]{6}$/.test(arn)
    || !table || !/^rillora-(production|staging)-mcp-oauth$/.test(table)) throw new Error('Customer OAuth requires its dedicated protected configuration');
  const environment=app.oidc?.webAppOrigin==='https://app.rillora.xyz'?'production'
    :app.oidc?.webAppOrigin==='https://app.staging.rillora.xyz'?'staging':null;
  if (!environment || table!==`rillora-${environment}-mcp-oauth` || !arn.includes(`:secret:rillora/${environment}/ai-oauth-`)
    || config.clients.length!==customerClients.length || customerClients.some(expected=>!config.clients.some(actual=>
      actual.key===expected.key && actual.clientId===expected.clientId && actual.name===expected.name
      && actual.privacyUrl===expected.privacyUrl && actual.verifiedEmailDisclosure===expected.identityScopes))) {
    throw new Error('Customer OAuth environment or public client registry mismatch');
  }
  const value=await new SecretsManagerClient({region:'eu-central-1'}).send(new GetSecretValueCommand({SecretId:arn}));
  const secret=secretSchema.parse(JSON.parse(value.SecretString??'null'));
  if (!secret.jwks.keys.every(k=>k.kty==='RSA'&&typeof k.d==='string'&&typeof k.kid==='string')) throw new Error('Customer OAuth signing material is unavailable');
  for (const jwk of secret.jwks.keys) {
    const key=createPrivateKey({key:jwk as JsonWebKey,format:'jwk'});
    if (key.asymmetricKeyType!=='rsa' || (key.asymmetricKeyDetails?.modulusLength??0)<2048 || jwk.alg!=='RS256' || jwk.use!=='sig') {
      throw new Error('Customer OAuth signing keys must be RSA 2048 or stronger with the exact signature algorithm');
    }
  }
  return new CustomerOAuth(pool,app,config,new OAuthStore(table,Buffer.from(secret.storageKey,'hex')),secret,
    app.emailVerification?new Auth0EmailIdentityVerifier(app.emailVerification):null);
}
