import test from 'node:test';
import assert from 'node:assert/strict';
import {readSavedFile,validateMapBackup,validateDirectionsCopy} from '../src/savedCopy.js';
import {createDeletionReference,validateDeletionReference} from '../src/accountDeletionClient.js';
const backup={schemaVersion:'rillora-map-backup-v1',createdAt:new Date().toISOString(),owner:{displayName:'QA'},plan:{},matters:[{publicId:'11111111-1111-4111-8111-111111111111',title:'Private letter',category:'document',notes:'Retain this note',details:{}}],people:[],roles:[],officialChecks:[],boundaries:{containsPrivateMap:true,restoresAccess:false,credentialsIncluded:false}};
test('complete backup preserves private Notes and cannot claim restored sharing',()=>{assert.equal(validateMapBackup(backup).matters[0].notes,'Retain this note');assert.throws(()=>validateMapBackup({...backup,boundaries:{...backup.boundaries,restoresAccess:true}}));});
test('reader rejects partial, malformed and oversized files',async()=>{for(const [text,size] of [['{}',2],['null',4],['{',1],['x',2097153]])await assert.rejects(()=>readSavedFile({name:'map.json',size,text:async()=>text}));assert.equal((await readSavedFile({name:'guide.txt',size:5,text:async()=>'Guide'})).text,'Guide');});
test('directions require exact safety boundaries',()=>{assert.throws(()=>validateDirectionsCopy({...backup,schemaVersion:'start-here-v1'}));});
test('deletion references are random portable status-only receipts',()=>{const a=createDeletionReference(),b=createDeletionReference();assert.notEqual(a.receipt,b.receipt);assert.match(a.receipt,/^[A-Za-z0-9_-]{43}$/);assert.equal(validateDeletionReference(JSON.parse(JSON.stringify(a))).receipt,a.receipt);assert.throws(()=>validateDeletionReference({...a,receipt:'account-token'}));});
