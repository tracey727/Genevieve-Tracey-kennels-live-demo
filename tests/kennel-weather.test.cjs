const test=require('node:test');
const assert=require('node:assert/strict');
const H=require('../GENEVIEVE_CATS_DOGS_LIVE_DEMO/kennel-weather.js');
const area={areaCodes:['QLD-SE-DEMO']},NOW='2026-10-15T08:00:00.000Z';
const seed=type=>H.scenario(type,NOW);
test('hazard engine includes critical kennel-specific hazards',()=>{
 for(const name of ['heat','severe_storm','flood','bushfire','cyclone','coastal_inundation','infrastructure']){
   assert(H.SUPPORTED.has(name));
   assert(H.CHECKS[name].length>=3);
 }
});
test('SIMULATED weather exercises never become official warning claims',()=>{
 const e=seed('flood');const r=H.evaluate(e,area,'2026-10-15T08:10:00Z');
 assert.equal(r.state,'RED');assert.equal(r.official,false);assert.equal(r.simulated,true);
 assert.match(r.reason,/SIMULATED/);
});
test('unmatched locations fail closed instead of notifying unrelated facilities',()=>{
 const r=H.evaluate(seed('heat'),{areaCodes:['NSW-SYDNEY']},'2026-10-15T08:10:00Z');
 assert.equal(r.state,'HOLD');assert.equal(r.relevant,false);assert.equal(r.official,false);
});
test('expired warnings and future timestamps never show active signals',()=>{
 let r=H.evaluate(seed('heat'),area,'2026-10-15T12:00:00Z');
 assert.equal(r.state,'HOLD');assert.equal(r.official,false);
 const e=seed('cyclone');e.observedAt='2026-10-16T08:00:00Z';
 r=H.evaluate(e,area,'2026-10-15T08:10:00Z');
 assert.equal(r.state,'HOLD');
});
test('non-demo spoofed official metadata cannot bypass blocked live feed',()=>{
 const e={...seed('bushfire'),sourceId:'BOM-PUBLIC',sourceStatus:'approved',
   productionUse:'approved',verifiedByAuthority:true,receivedViaApprovedAdapter:true,officialWarningLevel:'Emergency Warning'};
 const r=H.evaluate(e,area,'2026-10-15T08:10:00Z');
 assert.equal(r.state,'HOLD');assert.equal(r.official,false);
});
test('invalid hazard types cannot be treated as known conditions',()=>{
 const e={...seed('heat'),hazardType:'unknown'};
 const r=H.evaluate(e,area,'2026-10-15T08:10:00Z');
 assert.equal(r.state,'HOLD');
});
test('overview is never an all-clear when there is no approved weather source',()=>{
 const h=H.summary([],area,NOW);
 assert.equal(h.liveFeed,'NOT_CONNECTED');
 assert.equal(h.productionStatus,'HOLD');
 assert.equal(h.actionableLiveEvents,0);
 assert.match(h.note,/not a live weather warning or an all-clear/);
});
test('kennel heat guidance covers water, animals, staff and transport checks',()=>{
 const r=H.evaluate(seed('heat'),area,'2026-10-15T08:10:00Z');
 const text=r.checks.join(' ');
 for(const token of ['water','animals','staff','transport'])assert.match(text,new RegExp(token,'i'));
});
test('simulated source carries no officialWarningLevel even for critical event',()=>{
 const r=H.scenario('bushfire',NOW);
 assert.equal(r.officialWarningLevel,null);
 assert.equal(r.sourceId,'GEN-DEMO');
 assert.equal(r.productionUse,'prohibited');
});
