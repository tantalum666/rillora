import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { get } from 'node:https';
import { once } from 'node:events';
import { X509Certificate } from 'node:crypto';
import type { TLSSocket } from 'node:tls';
import { createManagedTlsServer, validateCertificate, type CertificateMaterial } from '../src/managed-tls.js';

let directory:string;
const materials:CertificateMaterial[]=[];
beforeAll(()=>{
 directory=mkdtempSync(join(tmpdir(),'rillora-tls-'));
 const ca=join(directory,'ca.pem'),caKey=join(directory,'ca.key'),extensions=join(directory,'extensions.cnf');
 execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',caKey,'-out',ca,
  '-days','4','-subj','/CN=Rillora local test root','-addext','basicConstraints=critical,CA:TRUE'],{stdio:'ignore'});
 writeFileSync(extensions,'basicConstraints=critical,CA:FALSE\nsubjectAltName=DNS:origin.production.rillora.xyz\nextendedKeyUsage=serverAuth\n');
 for(let i=0;i<2;i++){
  const key=join(directory,`${i}.key`),cert=join(directory,`${i}.pem`),csr=join(directory,`${i}.csr`);
  execFileSync('openssl',['req','-new','-newkey','rsa:2048','-nodes','-keyout',key,'-out',csr,
   '-subj','/CN=origin.production.rillora.xyz'],{stdio:'ignore'});
  execFileSync('openssl',['x509','-req','-in',csr,'-CA',ca,'-CAkey',caKey,'-set_serial',String(i+1),
   '-days','3','-extfile',extensions,'-out',cert],{stdio:'ignore'});
  materials.push({certificate:readFileSync(cert,'utf8'),privateKey:readFileSync(key,'utf8'),chain:readFileSync(ca,'utf8'),passphrase:''});
 }
},20_000);
afterAll(()=>{if(directory)rmSync(directory,{recursive:true,force:true});});

describe('Managed container TLS',()=>{
 it('rejects the wrong hostname, stale certificate and mismatched private key',()=>{
  expect(()=>validateCertificate(materials[0]!,'attacker.example')).toThrow('name or validity');
  expect(()=>validateCertificate(materials[0]!,'origin.production.rillora.xyz',Date.now()+4*86_400_000)).toThrow('name or validity');
  expect(()=>validateCertificate({...materials[0]!,privateKey:materials[1]!.privateKey},'origin.production.rillora.xyz')).toThrow('does not match');
 });
 it('serves verified HTTPS and rotates the certificate without restarting its listener',async()=>{
  let index=0,exports=0;
  const runtime=await createManagedTlsServer((_req,res)=>res.end('ok'),{
   certificateArn:'test',serverName:'origin.production.rillora.xyz',region:'eu-central-1',
  },{async serial(){return new X509Certificate(materials[index]!.certificate).serialNumber;},
    async export(){exports++;return materials[index]!;}});
  try{
   runtime.server.listen(0,'127.0.0.1');await once(runtime.server,'listening');
   const port=(runtime.server.address() as {port:number}).port;
   const probe=(servername='origin.production.rillora.xyz')=>new Promise<{body:string;serial:string}>((resolve,reject)=>{
    get({hostname:'127.0.0.1',port,servername,ca:materials[0]!.chain,agent:false,rejectUnauthorized:true},res=>{
     const serial=(res.socket as TLSSocket).getPeerCertificate().serialNumber;
     let body='';res.on('data',c=>body+=String(c));res.on('end',()=>resolve({body,serial}));
    }).on('error',reject);
   });
   const before=await probe();expect(before.body).toBe('ok');expect(runtime.ready()).toBe(true);
   await expect(probe('wrong.example')).rejects.toThrow();
   await runtime.refresh();expect(exports).toBe(1);
   index=1;await runtime.refresh();expect(exports).toBe(2);
   const after=await probe();expect(after.body).toBe('ok');expect(after.serial).not.toBe(before.serial);
   expect(after.serial).toBe(new X509Certificate(materials[1]!.certificate).serialNumber);
  }finally{runtime.close();runtime.server.close();await once(runtime.server,'close');}
 });
 it('does not fall back to HTTP when certificate retrieval fails',async()=>{
  await expect(createManagedTlsServer((_req,res)=>res.end(),{certificateArn:'test',serverName:'origin.production.rillora.xyz',region:'eu-central-1'},
   {async serial(){throw new Error('unavailable');},async export(){return materials[0]!;}})).rejects.toThrow('unavailable');
 });
});
