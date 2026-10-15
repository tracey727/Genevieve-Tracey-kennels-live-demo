const test=require('node:test');
const assert=require('node:assert/strict');
const P=require('../GENEVIEVE_CATS_DOGS_LIVE_DEMO/kennel-relocation.js');
const trip=()=>({id:'t1',animalId:'a1',driverId:'s1',origin:'Fictional kennel',destination:'Fictional new home',budgetCents:25000,dueAt:'2026-10-15T18:00:00Z',status:'PLANNED'});
const at='2026-10-15T10:00:00Z';
test('cost inputs are exact AUD cents, no guessed floating values',()=>{
 assert.equal(P.toCents('12.34'),1234);
 assert.equal(P.toCents('0.01'),1);
 assert.equal(P.toCents('0'),0);
 assert.equal(P.toCents('1.234'),null);
 assert.equal(P.toCents('abc'),null);
 assert.equal(P.money(1234),'$12.34');
});
test('travel budget totals only sourced verified cost evidence',()=>{
 const t=trip(),expenses=[
  {tripId:'t1',category:'Fuel',amountCents:12000,verified:true},
  {tripId:'t1',category:'Tolls',amountCents:900,verified:false},
  {tripId:'wrong',category:'Fuel',amountCents:500000,verified:true}
 ];
 const a=P.summarise(t,expenses,[],at);
 assert.equal(a.verifiedSpentCents,12000);
 assert.equal(a.remainingCents,13000);
 assert.equal(a.unverifiedExpenseCount,1);
 assert.equal(a.state,'HOLD');
});
test('over budget triggers warning, never invents quote, travel time or distance',()=>{
 const t=trip();
 const a=P.summarise(t,[{tripId:'t1',category:'Accommodation',amountCents:32000,verified:true}],[],at);
 assert.equal(a.state,'AMBER');
 assert.equal(a.remainingCents,-7000);
 assert.equal(a.verifiedSpentCents,32000);
});
test('future planned trip is not declared unsafe without departure evidence',()=>{
 const a=P.summarise(trip(),[],[],at);
 assert.equal(a.state,'GREEN');
 assert.equal(a.complete,false);
 assert.equal(a.missingChecks.length,P.REQUIRED_CHECKS.length);
});
test('in transit without predeparture checks is RED, manager must inspect',()=>{
 const t=trip();t.status='IN_TRANSIT';
 const a=P.summarise(t,[],[],at);
 assert.equal(a.state,'RED');
});
test('overdue, unaccepted home handover is RED',()=>{
 const t=trip();t.status='ARRIVED';t.dueAt='2026-10-14T12:00:00Z';
 const checks=P.REQUIRED_CHECKS.filter(x=>!['receiver','receipt'].includes(x.code)).map(x=>({tripId:'t1',code:x.code,verified:true}));
 const a=P.summarise(t,[],checks,at);
 assert.equal(a.state,'RED');
 assert(a.missingChecks.some(x=>x.code==='receipt'));
});
test('arrival is not delivery: completion requires all receiver/custody evidence',()=>{
 const t=trip();t.status='ARRIVED';
 const checks=P.REQUIRED_CHECKS.filter(x=>x.code!=='receipt').map(x=>({tripId:'t1',code:x.code,verified:true}));
 const a=P.summarise(t,[],checks,at);
 assert.equal(a.complete,false);
 assert(a.missingChecks.some(x=>x.code==='receipt'));
});
test('fully recorded completed handover is distinct from identity verification',()=>{
 const t=trip();t.status='COMPLETED';
 const checks=P.REQUIRED_CHECKS.map(x=>({tripId:'t1',code:x.code,verified:true}));
 const a=P.summarise(t,[],checks,at);
 assert.equal(a.complete,true);
 assert.equal(a.missingChecks.length,0);
});
test('a completed journey with missing check must remain HOLD',()=>{
 const t=trip();t.status='COMPLETED';
 const a=P.summarise(t,[],[],at);
 assert.equal(a.complete,false);
 assert.equal(a.state,'HOLD');
});
test('trip budgets and costs stay separate by trip ID',()=>{
 const a=P.all([trip(),{...trip(),id:'t2',budgetCents:90000}],
  [{tripId:'t2',category:'Fuel',amountCents:7000,verified:true}],[],at);
 assert.equal(a.length,2);
 assert.equal(a[0].verifiedSpentCents,0);
 assert.equal(a[1].verifiedSpentCents,7000);
});
