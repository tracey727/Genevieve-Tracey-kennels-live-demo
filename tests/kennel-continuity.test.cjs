const test=require('node:test');
const assert=require('node:assert/strict');
const C=require('../GENEVIEVE_CATS_DOGS_LIVE_DEMO/kennel-continuity.js');
const at='2026-10-15T10:00:00.000Z';
const staff={id:'s1',name:'Staff One',role:'Attendant',onShift:true};
const manager={id:'m1',role:'Manager',onShift:true};
const current=(code)=>({staffId:'s1',code,completedAt:'2026-01-01',expiresAt:'2027-01-01',attestedBy:'m1',attestedByRole:'manager',verified:true});
test('staff readiness stays HOLD without separate current evidence',()=>{
 const r=C.assessReadiness(staff,[],at);
 assert.equal(r.state,'HOLD');
 assert.equal(r.missing.length,3);
});
test('staff readiness can be recorded current only with exact role evidence',()=>{
 const r=C.assessReadiness(staff,['animal_handling','animal_welfare','emergency_safety'].map(current),at);
 assert.equal(r.state,'GREEN');assert.equal(r.missing.length,0);
});
test('self attestations and expired qualifications never infer readiness',()=>{
 let records=['animal_handling','animal_welfare','emergency_safety'].map(current);
 records[0].attestedBy='s1';assert.equal(C.assessReadiness(staff,records,at).state,'HOLD');
 records=['animal_handling','animal_welfare','emergency_safety'].map(current);
 records[1].expiresAt='2026-02-01';
 assert(C.assessReadiness(staff,records,at).expired.includes('animal_welfare'));
});
test('animal care-plan review expiry creates attention without clinical scoring',()=>{
 const a=[{id:'a1',name:'Cat One',status:'In care'}];
 assert.equal(C.assessPlans(a,[],at)[0].state,'HOLD');
 const record=[{animalId:'a1',reviewedAt:'2026-09-01',reviewDueAt:'2026-10-14',reviewedBy:'m1'}];
 assert.equal(C.assessPlans(a,record,at)[0].state,'AMBER');
 record[0].reviewDueAt='2026-10-20';
 assert.equal(C.assessPlans(a,record,at)[0].state,'GREEN');
});
test('collection requires exact name match, not substring, and cannot release automatically',()=>{
 const animal={id:'a1',status:'In care',pickupAuthorised:'Anna Smith; Robert Smith'};
 const pre={animal,identityEvidence:true,authorityConfirmed:true,conditionRecorded:true,managerReview:true};
 assert.equal(C.collectionPreflight({...pre,collector:'Ann'}).state,'RED');
 const ok=C.collectionPreflight({...pre,collector:'Anna Smith'});
 assert.equal(ok.state,'GREEN');
 assert.equal(ok.permitted,false);
 assert.equal(C.collectionPreflight({...pre,collector:'Robert Smith',identityEvidence:false}).state,'HOLD');
});
test('cover proposal keeps predecessor owner until receiver acceptance',()=>{
 const task={id:'t1',assignedTo:'s1'};
 const receiver={id:'s2',role:'Attendant',onShift:true};
 const p={taskId:'t1',senderId:'s1',receiverId:'s2',reviewedBy:'m1',status:'PENDING'};
 const r=C.handoverCoverage(task,p,[staff,receiver],at);
 assert.equal(r.state,'AMBER');assert.equal(r.ownershipChanged,false);
});
test('even accepted demo coverage cannot mutate task ownership',()=>{
 const task={id:'t1',assignedTo:'s1'};
 const receiver={id:'s2',role:'Attendant',onShift:true};
 const p={taskId:'t1',senderId:'s1',receiverId:'s2',reviewedBy:'m1',status:'ACCEPTED',acceptedAt:'2026-10-15T09:00:00Z'};
 const r=C.handoverCoverage(task,p,[staff,receiver],at);
 assert.equal(r.state,'GREEN');assert.equal(r.ownershipChanged,false);assert.equal(task.assignedTo,'s1');
});
test('inactive receiver and invalid provenance fail closed',()=>{
 const p={taskId:'t1',senderId:'s1',receiverId:'s2',reviewedBy:'m1',status:'ACCEPTED',acceptedAt:'2026-10-15T09:00:00Z'};
 assert.equal(C.handoverCoverage({id:'t1',assignedTo:'s1'},p,[{id:'s2',onShift:false}],at).state,'HOLD');
 assert.equal(C.handoverCoverage({id:'t1',assignedTo:'s3'},p,[{id:'s2',onShift:true}],at).state,'HOLD');
});
test('overdue callback remains visible, missing owner is HOLD',()=>{
 const out=C.callbacks([{id:'cb1',animalId:'a1',assignedTo:'s1',message:'Return call',dueAt:'2026-10-14T12:00:00Z',state:'OPEN'},
 {id:'cb2',animalId:'a1',assignedTo:'s1',message:'Completed',dueAt:'2026-10-14T12:00:00Z',state:'CLOSED'},
 {id:'cb3',animalId:'a1',assignedTo:'',message:'Missing owner',dueAt:'2026-10-16T12:00:00Z',state:'OPEN'}],at);
 assert.equal(out.length,2);assert.equal(out[0].state,'AMBER');assert.equal(out[1].state,'HOLD');
});
test('invalid dates never become evidence',()=>{
 assert.equal(C.validDate('2026-02-30'),false);
 assert.equal(C.validDate('2026-10-15'),true);
});
