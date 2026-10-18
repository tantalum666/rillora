import {mkdtemp,mkdir,writeFile,readFile,copyFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {clientPackages} from './client-packages.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
/** Public install material only; this never edits user client configuration. */
export async function buildCustomerDownload(destination) {
  const registry=JSON.parse(await readFile(resolve(root,'apps/api/src/mcp/customer-clients.json'),'utf8'));
  const files=clientPackages({serverUrl:'https://app.rillora.xyz/api/mcp',clientIds:Object.fromEntries(registry.map(c=>[c.key,c.clientId]))});
  delete files['readiness.json'];
  const temporary=await mkdtemp(resolve(tmpdir(),'rillora-client-download-'));
  try {
    for(const [path,body] of Object.entries(files)) {await mkdir(dirname(resolve(temporary,path)),{recursive:true});await writeFile(resolve(temporary,path),body);}
    for(const folder of ['openai','codex-plugin']) {
      await mkdir(resolve(temporary,folder,'assets'),{recursive:true});
      await copyFile(resolve(root,'apps/web/src/assets/brand/apple-touch-icon.png'),resolve(temporary,folder,'assets/icon.png'));
    }
    for(const locale of ['en','zh-CN']) await copyFile(resolve(root,`integrations/ai/customer/README.${locale}.md`),resolve(temporary,`README.${locale}.md`));
    await mkdir(dirname(destination),{recursive:true});
    // The standard-library writer supplies a deterministic archive without adding a runtime ZIP dependency.
    execFileSync('python3',['-c',[
      'import pathlib,sys,zipfile',
      'source=pathlib.Path(sys.argv[1])',
      'with zipfile.ZipFile(sys.argv[2],"w",zipfile.ZIP_DEFLATED) as archive:',
      ' for path in sorted(source.rglob("*")):',
      '  if path.is_file():',
      '   entry=zipfile.ZipInfo(path.relative_to(source).as_posix(),(1980,1,1,0,0,0));entry.compress_type=zipfile.ZIP_DEFLATED;entry.external_attr=0o100644<<16',
      '   archive.writestr(entry,path.read_bytes())',
    ].join('\n'),temporary,destination]);
  } finally {await rm(temporary,{recursive:true,force:true});}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  if(process.argv.length!==3)throw new Error('Usage: node tools/mcp/build-customer-download.mjs output.zip');
  await buildCustomerDownload(resolve(process.argv[2]));
}
