/* GENEVIEVE Kennels — aged-care / childcare / psychology design-pattern reuse.
 * Pure, synthetic-only decision support. No real identities, medical decisions or release authority.
 * No imports from childcare/aged-care/patient systems and no cross-product data access.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.KennelContinuity=api;
})(typeof globalThis!=='undefined'?globalThis:null,function(){
  'use strict';
  const VERSION='KENNELS-CARE-CONTINUITY-1.0';
  const REQUIRED_TRAINING=Object.freeze({
    attendant:['animal_handling','animal_welfare','emergency_safety'],
    driver:['animal_handling','transport_safety','emergency_safety'],
    manager:['animal_welfare','emergency_safety','handover_governance'],
    reception:['collection_authority','animal_welfare']
  });
  const TRAINING_LABELS=Object.freeze({
    animal_handling:'Animal handling',
    animal_welfare:'Animal welfare & care-plan reading',
    emergency_safety:'Emergency procedures',
    transport_safety:'Transport & carrier safety',
    handover_governance:'Handover/backup accountability',
    collection_authority:'Collection and identification checks'
  });
  function validDate(x){if(typeof x!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(x))return false;
    const t=new Date(x+'T00:00:00.000Z');return Number.isFinite(t.getTime())&&t.toISOString().slice(0,10)===x;}
  function isoDay(now){return typeof now==='string'&&validDate(now.slice(0,10))?now.slice(0,10):null;}
  function staffRole(value){const s=String(value||'').toLowerCase();
    if(s.includes('manager')||s.includes('senior attendant'))return 'manager';
    if(s.includes('driver'))return 'driver';
    if(s.includes('reception'))return 'reception';
    return 'attendant';}
  function assessReadiness(staff,training,now){
    const day=isoDay(now);
    if(!staff||!staff.id||!day)return {state:'HOLD',missing:[],expired:[],reason:'Worker identity or date not verified.'};
    const required=REQUIRED_TRAINING[staffRole(staff.role)];
    const evidence=Array.isArray(training)?training.filter(x=>x&&x.staffId===staff.id):[];
    const missing=[],expired=[];
    for(const code of required){
      const found=evidence.filter(x=>x.code===code&&x.verified===true&&x.attestedBy&&x.attestedBy!==staff.id&&x.attestedByRole==='manager');
      if(!found.length){missing.push(code);continue;}
      const current=found.some(x=>validDate(x.completedAt)&&validDate(x.expiresAt)&&x.completedAt<=day&&x.expiresAt>=day&&x.completedAt<=x.expiresAt);
      if(!current)expired.push(code);
    }
    if(missing.length||expired.length)return {state:'HOLD',missing,expired,reason:'Training evidence missing, lapsed or not independently attested. A manager must review assignment.'};
    return {state:'GREEN',missing:[],expired:[],reason:'Recorded training evidence is current in this simulation; actual competency still requires human confirmation.'};
  }
  function assessPlans(animals,plans,now){
    const day=isoDay(now);
    return (Array.isArray(animals)?animals:[]).filter(x=>x&&x.id&&x.status!=='Departed').map(a=>{
      const records=(Array.isArray(plans)?plans:[]).filter(x=>x&&x.animalId===a.id&&x.reviewedBy&&validDate(x.reviewedAt)&&validDate(x.reviewDueAt));
      const p=records.sort((x,y)=>y.reviewedAt.localeCompare(x.reviewedAt))[0];
      const state=!p||!day?'HOLD':p.reviewDueAt<day?'AMBER':p.reviewedAt>day?'HOLD':'GREEN';
      return {animalId:a.id,animalName:a.name||a.id,state,
        reason:!p?'No documented current kennel care-plan review':state==='AMBER'?'Care-plan review date has passed':state==='HOLD'?'Care-plan review evidence invalid':'Care-plan review date recorded',
        reviewedAt:p?.reviewedAt||null,reviewDueAt:p?.reviewDueAt||null};
    });
  }
  function authorisedCollectors(animal){
    // Existing kennel data models authorised contacts as a semicolon-delimited text field.
    // Never accept substring matches or aliases (e.g., Ann matching Anna).
    return typeof animal?.pickupAuthorised==='string'
      ?animal.pickupAuthorised.split(';').map(x=>x.trim().toLocaleLowerCase('en-AU')).filter(Boolean)
      :[];
  }
  function collectionPreflight(input){
    const animal=input?.animal;
    const collector=String(input?.collector||'').trim().toLocaleLowerCase('en-AU');
    if(!animal?.id||animal.status==='Departed')return {state:'HOLD',permitted:false,reason:'Animal unavailable or identity not confirmed.'};
    if(!collector||!authorisedCollectors(animal).includes(collector))
      return {state:'RED',permitted:false,reason:'Collector is not an exact match to the recorded authorised list; manager to contact owner using verified details.'};
    if(input.identityEvidence!==true||input.authorityConfirmed!==true||input.conditionRecorded!==true)
      return {state:'HOLD',permitted:false,reason:'Identity, authority and final animal welfare/custody checks are incomplete.'};
    if(input.managerReview!==true)
      return {state:'HOLD',permitted:false,reason:'Manager review of the receiving person and authorisation is required.'};
    return {state:'GREEN',permitted:false,
      reason:'Demo checklist complete. This is NOT permission to release an animal: actual identity, payment/terms, dispute and custody checks remain human-controlled.'};
  }
  function handoverCoverage(task,proposed,staff,now){
    if(!task?.id||!task.assignedTo)return {state:'HOLD',ownershipChanged:false,reason:'Task or original owner missing.'};
    const person=(Array.isArray(staff)?staff:[]).find(x=>x.id===proposed?.receiverId);
    if(!proposed||proposed.taskId!==task.id||proposed.senderId!==task.assignedTo||!person||!person.onShift)
      return {state:'HOLD',ownershipChanged:false,reason:'No active, eligible proposed receiver confirmed; predecessor remains recorded owner.'};
    if(proposed.status!=='ACCEPTED'||!proposed.acceptedAt||!Number.isFinite(Date.parse(proposed.acceptedAt))||Date.parse(proposed.acceptedAt)>Date.parse(now))
      return {state:'AMBER',ownershipChanged:false,reason:'Receiver has not accepted responsibility; original owner remains assigned.'};
    if(!proposed.reviewedBy||proposed.reviewedBy===proposed.receiverId)
      return {state:'HOLD',ownershipChanged:false,reason:'Manager review is missing or self-approved.'};
    return {state:'GREEN',ownershipChanged:false,reason:'Accepted coverage evidence is recorded in this demo. Live task ownership change requires authenticated atomic server action.'};
  }
  function callbacks(records,now){
    const current=Date.parse(now);
    return (Array.isArray(records)?records:[]).filter(x=>x&&x.id&&x.state!=='CLOSED').map(x=>{
      const due=Date.parse(x.dueAt);
      const state=!x.animalId||!x.assignedTo||!x.message||!Number.isFinite(due)||!Number.isFinite(current)?'HOLD':due<current?'AMBER':'GREEN';
      return {id:x.id,animalId:x.animalId,assignedTo:x.assignedTo,state,
        reason:state==='HOLD'?'Owner callback information incomplete':state==='AMBER'?'Owner update/follow-up overdue':'Owner follow-up waiting within agreed time'};
    });
  }
  function closeFollowup(record,input,now){
    const asOf=Date.parse(now);
    if(!record?.id||record.state!=='OPEN'||!Number.isFinite(asOf))
      return {valid:false,reason:'Unknown or already completed follow-up.'};
    const note=String(input?.outcomeNote||'').trim();
    if(!note||note.length>300)return {valid:false,reason:'A factual response or attempted-contact outcome is required.'};
    if(input?.completedBy!==record.assignedTo)return {valid:false,reason:'The assigned staff member must record their own outcome.'};
    if(!input?.managerReviewedBy||input.managerReviewedBy===input.completedBy)
      return {valid:false,reason:'A separate manager must review the follow-up evidence.'};
    if(input?.contactActuallyCompleted!==true)
      return {valid:false,reason:'An attempted contact does not count as a completed owner response.'};
    return {valid:true,reason:'Fictional response-and-review evidence is complete.',
      closure:{state:'CLOSED',closedAt:new Date(asOf).toISOString(),completedBy:input.completedBy,
        managerReviewedBy:input.managerReviewedBy,outcomeNote:note}};
  }
  function overview(st,now){
    const c=st?.opsHub?.careContinuity||{};
    const plans=assessPlans(st?.animals,c.planReviews,now);
    const training=(st?.staff||[]).filter(x=>x.onShift).map(x=>({staffId:x.id,name:x.name,...assessReadiness(x,c.training,now)}));
    const followups=callbacks(c.followups,now);
    const proposed=(c.coverProposals||[]).filter(x=>x.status!=='ACCEPTED');
    return {plans,training,followups,unacceptedCover:proposed.length,
      holds:plans.filter(x=>x.state==='HOLD').length+training.filter(x=>x.state==='HOLD').length+followups.filter(x=>x.state==='HOLD').length,
      attention:plans.filter(x=>x.state==='AMBER').length+followups.filter(x=>x.state==='AMBER').length+proposed.length};
  }
  return {VERSION,REQUIRED_TRAINING,TRAINING_LABELS,validDate,assessReadiness,assessPlans,authorisedCollectors,collectionPreflight,handoverCoverage,callbacks,closeFollowup,overview};
});