import https from 'node:https';
import dns from 'node:dns';
import {isIP} from 'node:net';

const safeCodes=new Set(['ENOTFOUND','EAI_AGAIN','ECONNRESET','ECONNREFUSED','ETIMEDOUT','CERT_HAS_EXPIRED','CERT_NOT_YET_VALID','ERR_TLS_CERT_ALTNAME_INVALID','DEPTH_ZERO_SELF_SIGNED_CERT','UNABLE_TO_VERIFY_LEAF_SIGNATURE','PRIVATE_ADDRESS_BLOCKED']);
export function isPublicAddress(address){
  if(isIP(address)===4){
    const [a,b,c]=address.split('.').map(Number);
    return !(a===0||a===10||a===127||a>=224||(a===169&&b===254)||(a===172&&b>=16&&b<=31)||(a===192&&b===168)||(a===100&&b>=64&&b<=127)||(a===192&&b===0)||(a===198&&(b===18||b===19||b===51&&c===100))||(a===203&&b===0&&c===113));
  }
  if(isIP(address)!==6)return false;
  const ip=new URL(`http://[${address}]/`).hostname.slice(1,-1).toLowerCase();
  if(ip.startsWith('::ffff:')){
    const rest=ip.slice(7);
    if(isIP(rest)===4)return isPublicAddress(rest);
    const parts=rest.split(':');
    if(parts.length!==2)return false;
    const hi=parseInt(parts[0],16),lo=parseInt(parts[1],16);
    return isPublicAddress(`${hi>>8}.${hi&255}.${lo>>8}.${lo&255}`);
  }
  // Only native global unicast; also exclude documentation and transition ranges.
  return /^[23]/.test(ip)&&!(/^2001:(?:0:|:|db8:)|^2002:|^3ffe:|^3fff:/i.test(ip));
}

export function validateConfig(config){
  if(!config||config.schemaVersion!==1
    ||typeof config.environment!=='string'||!/^[a-z][a-z0-9-]{1,40}$/.test(config.environment)
    ||!Array.isArray(config.allowedOrigins)||config.allowedOrigins.length>12
    ||!Array.isArray(config.targets)||!config.targets.length||config.targets.length>16
    ||!Number.isInteger(config.timeoutMs)||config.timeoutMs<100||config.timeoutMs>10000
    ||!Number.isInteger(config.certificateWarningDays)||config.certificateWarningDays<1||config.certificateWarningDays>90)throw new Error('Invalid operations configuration');
  const origins=new Set(config.allowedOrigins.map(origin=>{
    const u=new URL(origin);
    if(u.protocol!=='https:'||u.origin!==origin||u.username||u.password||u.search||u.hash||isIP(u.hostname)||u.port)throw new Error('Invalid allowed origin');
    return u.origin;
  }));
  const ids=new Set();
  for(const target of config.targets){
    const u=new URL(target.url);
    const statuses=Array.isArray(target.expectedStatus)?target.expectedStatus:[target.expectedStatus];
    if(typeof target.id!=='string'||!/^[a-z][a-z0-9-]{1,60}$/.test(target.id)||ids.has(target.id)
      ||!origins.has(u.origin)||u.username||u.password||u.search||u.hash||isIP(u.hostname)||u.port
      ||!statuses.length||statuses.length>3||new Set(statuses).size!==statuses.length||statuses.some(s=>!Number.isInteger(s)||s<100||s>599)
      ||!target.headers||typeof target.headers!=='object'||Array.isArray(target.headers))throw new Error('Invalid health target');
    for(const [key,value]of Object.entries(target.headers))if(!['strict-transport-security','content-security-policy','cache-control','x-content-type-options'].includes(key)||typeof value!=='string'||value.length>100)throw new Error('Invalid expected header');
    ids.add(target.id);
  }
  return config;
}

function guardedLookup(hostname,options,callback){
  dns.lookup(hostname,{...options,all:true},(error,addresses)=>{
    if(error)return callback(error);
    if(!addresses.length||addresses.some(x=>!isPublicAddress(x.address))){const blocked=new Error('Blocked address');blocked.code='PRIVATE_ADDRESS_BLOCKED';return callback(blocked);}
    if(options?.all)return callback(null,addresses);
    return callback(null,addresses[0].address,addresses[0].family);
  });
}

// Read headers and certificate only. No credentials, redirects or response-body retention.
export function requestMetadata(target,timeoutMs){
  return new Promise((resolve,reject)=>{
    let finished=false;
    const finish=(fn,value)=>{if(finished)return;finished=true;clearTimeout(timer);fn(value);};
    const req=https.request(target.url,{method:'GET',agent:false,rejectUnauthorized:true,lookup:guardedLookup,headers:{'user-agent':'Rillora-Operations/1.0','accept':'*/*'}},response=>{
      const cert=response.socket.getPeerCertificate();
      const allowed={};
      for(const key of Object.keys(target.headers))allowed[key]=response.headers[key];
      finish(resolve,{status:response.statusCode,headers:allowed,certificateExpiresAt:cert.valid_to});
      response.destroy();req.destroy();
    });
    const timer=setTimeout(()=>{const e=new Error('Timeout');e.code='ETIMEDOUT';finish(reject,e);req.destroy();},timeoutMs);
    req.on('error',error=>finish(reject,error));req.end();
  });
}

export async function runHealthChecks(config,{transport=requestMetadata,now=()=>Date.now()}={}){
  validateConfig(config);
  const started=now();
  const checks=await Promise.all(config.targets.map(async target=>{
    const issues=[];const begin=now();
    try{
      const metadata=await transport(target,config.timeoutMs);
      const statuses=Array.isArray(target.expectedStatus)?target.expectedStatus:[target.expectedStatus];
      if(!statuses.includes(metadata.status))issues.push('unexpected_http_status');
      for(const[key,expected]of Object.entries(target.headers)){
        const raw=metadata.headers?.[key];const value=Array.isArray(raw)?raw.join(','):raw;
        if(typeof value!=='string'||!value.length||!value.toLowerCase().includes(expected.toLowerCase()))issues.push(`header_check_failed:${key}`);
      }
      const expiry=Date.parse(metadata.certificateExpiresAt??'');
      const days=Number.isFinite(expiry)?Math.floor((expiry-now())/86400000):null;
      if(days===null)issues.push('certificate_metadata_unavailable');else if(days<config.certificateWarningDays)issues.push('certificate_expiring');
      return{id:target.id,ok:!issues.length,httpStatus:metadata.status??null,certificateDaysRemaining:days,latencyMs:Math.max(0,now()-begin),issues};
    }catch(error){
      return{id:target.id,ok:false,httpStatus:null,certificateDaysRemaining:null,latencyMs:Math.max(0,now()-begin),issues:[safeCodes.has(error?.code)?error.code:'NETWORK_ERROR']};
    }
  }));
  return{schemaVersion:1,environment:config.environment,checkedAt:new Date(started).toISOString(),ok:checks.every(c=>c.ok),failed:checks.filter(c=>!c.ok).length,checks,scope:'public-metadata-only',responseBodiesStored:false};
}
