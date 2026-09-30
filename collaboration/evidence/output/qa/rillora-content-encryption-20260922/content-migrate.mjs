import {spawnSync} from 'node:child_process';
for(const operation of ['--check','--apply','--apply','--enforce','--check']){
 console.log('Content migration operation '+operation);
 const result=spawnSync(process.execPath,['dist/migrate-private-content.js',operation],{stdio:'inherit',timeout:300000});
 if(result.status!==0)throw Error('Content migration stopped; no following stage executed');
}
