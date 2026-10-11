import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {committedStartHereJSON} from '../src/startHereCommitment.js';

const original={schemaVersion:'start-here-v1',audience:{kind:'owner',connectionPublicId:null,name:null,version:null},
  planner:{display_name:'中文 / "quoted"\n\u2028',locale:'zh-CN',time_zone:'Asia/Hong_Kong'},plan:{status:'active'},
  matters:[{publicId:'11111111-1111-4111-8111-111111111111',category:'account',title:'An account',institutionName:null,
    locationHint:'An official page',desiredOutcome:'notify',status:null}],trustedContacts:[{displayName:'A person',relationshipLabel:null}],
  directionsNotPasswords:true,legalAuthorityNotGranted:true};
test('reconstructs the exact server byte order, including native omitted nulls',()=>{
  const native=structuredClone(original);delete native.audience.connectionPublicId;delete native.audience.name;delete native.audience.version;
  delete native.matters[0].institutionName;delete native.matters[0].status;delete native.trustedContacts[0].relationshipLabel;
  assert.equal(committedStartHereJSON(native),JSON.stringify(original));
  assert.equal(committedStartHereJSON(JSON.parse(JSON.stringify(original))),JSON.stringify(original));
});
test('a substituted field changes the commitment and extra fields are rejected',()=>{
  const changed=structuredClone(original);changed.matters[0].title='Substituted account';
  const hash=value=>createHash('sha256').update(committedStartHereJSON(value)).digest('hex');
  assert.notEqual(hash(changed),hash(original));
  changed.matters[0].privateNotes='Not in the reviewed projection';assert.throws(()=>committedStartHereJSON(changed));
});
