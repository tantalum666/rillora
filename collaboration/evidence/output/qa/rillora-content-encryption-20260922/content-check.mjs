import {spawnSync} from 'node:child_process';
const result=spawnSync(process.execPath,['dist/migrate-private-content.js','--check'],{stdio:'inherit',timeout:60000});
if(result.status!==0)throw Error('Protected content inspection failed');
