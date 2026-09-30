import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = process.cwd();
const qa = `${root}/output/qa/rillora-launch-goal-20260926/landing-theme-controls`;
const expected = await readFile(`${root}/apps/web/dist-public/index.html`);
const digest = x => createHash('sha256').update(x).digest('hex');
const results = [];
for (const path of ['/', '/product', '/security', '/pricing', '/support', '/legal', '/legal/licenses', '/account', '/api', '/not-a-route']) {
  const response = await fetch(`https://www.rillora.xyz${path}`);
  const data = Buffer.from(await response.arrayBuffer());
  const publicRoute = !['/account', '/api', '/not-a-route'].includes(path);
  const statusPass = response.status === (publicRoute ? 200 : 404);
  const shellPass = !publicRoute || digest(data) === digest(expected);
  results.push({path,status:response.status,statusPass,shellPass,csp:response.headers.get('content-security-policy'),cookies:response.headers.has('set-cookie')});
}
const boot = expected.toString().match(/src="(\/assets\/website-appearance-[^" ]+\.js)"/)[1];
const bootResponse = await fetch(`https://www.rillora.xyz${boot}`);
const bootData = Buffer.from(await bootResponse.arrayBuffer());
const localBoot = await readFile(`${root}/apps/web/dist-public${boot}`);
results.push({path:boot,status:bootResponse.status,exactBytes:digest(bootData)===digest(localBoot),cookies:bootResponse.headers.has('set-cookie')});
const post = await fetch('https://www.rillora.xyz/',{method:'POST'});
results.push({path:'/',method:'POST',status:post.status,statusPass:post.status===403});
const legalPaths = ['/terms','/privacy','/subscription-terms','/refund-policy','/acceptable-use','/cookies','/legal'];
for(const path of legalPaths){ const r=await fetch(`https://legal.rillora.xyz${path}`);results.push({legalPath:path,status:r.status,statusPass:r.status===200}); }
const passed = results.every(r=>r.statusPass!==false&&r.shellPass!==false&&r.exactBytes!==false);
await writeFile(`${qa}/online-http.json`, JSON.stringify({at:new Date().toISOString(),passed,htmlSha256:digest(expected),results},null,2)+'\n');
console.log(JSON.stringify({passed,checks:results.length,htmlSha256:digest(expected)}));
if(!passed)process.exitCode=1;
