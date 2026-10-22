const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const files={};
function visit(p){
  const s=fs.lstatSync(p),name=p.replace(/^\/app\//,'');
  if(s.isSymbolicLink()){files[name]={symlink:fs.readlinkSync(p)};return;}
  if(s.isDirectory()){for(const entry of fs.readdirSync(p).sort())visit(path.join(p,entry));return;}
  if(s.isFile())files[name]={sha256:crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),bytes:s.size};
}
for(const name of ['package.json','dist','migrations','certificates','certs','node_modules'])visit('/app/'+name);
console.log(JSON.stringify({checkedAt:new Date().toISOString(),runtime:{node:process.version,arch:process.arch,platform:process.platform,uid:process.getuid()},files}));
