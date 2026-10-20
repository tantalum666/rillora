import test from 'node:test';
import assert from 'node:assert/strict';
import {readSavedFile,validateMapBackup,validateDirectionsCopy,downloadMapBackup} from '../src/savedCopy.js';
import {createDeletionReference,validateDeletionReference} from '../src/accountDeletionClient.js';
const backup={schemaVersion:'rillora-map-backup-v1',createdAt:new Date().toISOString(),owner:{displayName:'QA'},plan:{},matters:[{publicId:'11111111-1111-4111-8111-111111111111',title:'Private letter',category:'document',notes:'Retain this note',details:{}}],people:[],roles:[],officialChecks:[],boundaries:{containsPrivateMap:true,restoresAccess:false,credentialsIncluded:false}};
test('complete backup preserves private Notes and cannot claim restored sharing',()=>{assert.equal(validateMapBackup(backup).matters[0].notes,'Retain this note');assert.throws(()=>validateMapBackup({...backup,boundaries:{...backup.boundaries,restoresAccess:true}}));});
test('reader rejects partial, malformed and oversized files',async()=>{for(const [text,size] of [['{}',2],['null',4],['{',1],['x',2097153]])await assert.rejects(()=>readSavedFile({name:'map.json',size,text:async()=>text}));assert.equal((await readSavedFile({name:'guide.txt',size:5,text:async()=>'Guide'})).text,'Guide');});
test('directions require exact safety boundaries',()=>{assert.throws(()=>validateDirectionsCopy({...backup,schemaVersion:'start-here-v1'}));});
test('deletion references are random portable status-only receipts',()=>{const a=createDeletionReference(),b=createDeletionReference();assert.notEqual(a.receipt,b.receipt);assert.match(a.receipt,/^[A-Za-z0-9_-]{43}$/);assert.equal(validateDeletionReference(JSON.parse(JSON.stringify(a))).receipt,a.receipt);assert.throws(()=>validateDeletionReference({...a,receipt:'account-token'}));});

test('a maximum-size backup downloads into the same file boundary its reader accepts',async(t)=>{
  const maximum=2*1024*1024;
  const large={...backup,matters:Array.from({length:500},(_,i)=>({...backup.matters[0],
    publicId:`00000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`,locationHint:'Synthetic archive',notes:'界'.repeat(1000)}))};
  let remaining=maximum-Buffer.byteLength(JSON.stringify(large));
  for(const matter of large.matters){const wide=Math.min(1000,Math.floor(remaining/3));remaining-=wide*3;
    const ascii=Math.min(1000-wide,remaining);remaining-=ascii;matter.notes+='界'.repeat(wide)+'x'.repeat(ascii);}
  assert.equal(remaining,0);
  let downloaded;
  const oldDocument=globalThis.document,oldWindow=globalThis.window;
  const create=t.mock.method(URL,'createObjectURL',blob=>{downloaded=blob;return 'blob:synthetic-test';});
  globalThis.document={body:{append(){}},createElement(){return {click(){},remove(){}};}};
  globalThis.window={setTimeout(){}};
  try{
    downloadMapBackup(large);
    assert.equal(downloaded.size,maximum);
    const parsed=await readSavedFile({name:'rillora-map.json',size:downloaded.size,text:()=>downloaded.text()});
    assert.deepEqual(parsed.value,large);
    large.matters.at(-1).notes+='x';
    assert.throws(()=>downloadMapBackup(large),/2 MB/);
    assert.equal(create.mock.callCount(),1);
  }finally{
    if(oldDocument===undefined)delete globalThis.document;else globalThis.document=oldDocument;
    if(oldWindow===undefined)delete globalThis.window;else globalThis.window=oldWindow;
  }
});
