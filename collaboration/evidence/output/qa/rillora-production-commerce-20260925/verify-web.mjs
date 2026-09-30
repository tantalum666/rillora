import{readFile,writeFile}from'node:fs/promises';import{createHash}from'node:crypto';
const expected=createHash('sha256').update(await readFile('apps/web/dist-production/index.html')).digest('hex'),checks=[];
for(const[path,status]of[['/',200],['/account/billing',200],['/account/billing/complete?session_id=untrusted-fixture',200],['/api/health/ready',200],['/api/v1/commerce/stripe/quote',503],['/.env',404],['/account/billing/unsafe',404]]){
 const r=await fetch('https://app.rillora.xyz'+path,{redirect:'error',signal:AbortSignal.timeout(20000)}),body=Buffer.from(await r.arrayBuffer());
 checks.push({path,status:r.status,expected:status,noStore:r.headers.get('cache-control')?.includes('no-store')??false,noSessionCookie:!r.headers.has('set-cookie'),...(status===200&&!path.startsWith('/api/')?{matchesArtifact:createHash('sha256').update(body).digest('hex')===expected}:{})});
}
const passed=checks.every(x=>x.status===x.expected&&x.noSessionCookie&&x.matchesArtifact!==false&&(!x.path.startsWith('/api/')||x.noStore));
await writeFile('output/qa/rillora-production-commerce-20260925/web-cloud-acceptance-final.json',JSON.stringify({checkedAt:new Date().toISOString(),passed,artifactHTML:expected,sourceCommit:'7cf75bb4ad4b3403a9932a2095edf2ad891ecdff',checks,boundary:'Closed Web artifact only; API runtime, provider credentials and new migrations not deployed.'},null,2)+'\n');console.log(JSON.stringify({passed,checks:checks.length}));if(!passed)process.exitCode=1;
