/* GENEVIEVE Pet Relocation & Travel Budget — kennel-specific, synthetic only.
 * Adapted design patterns, not a Traveller Budget runtime connection.
 * Pure functions can run in browser and Node; no external requests.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.KennelRelocation=api;
})(typeof globalThis!=='undefined'?globalThis:null,function(){
  'use strict';
  const REQUIRED_CHECKS=[
    {code:'identity',label:'Correct animal and authorised transfer documents checked'},
    {code:'containment',label:'Carrier, restraint, ventilation and vehicle safety checked'},
    {code:'welfare',label:'Water, food, rest and individual care instructions reviewed'},
    {code:'arrival',label:'Animal observed and condition recorded on arrival'},
    {code:'receiver',label:'Receiving person identity and authority checked'},
    {code:'receipt',label:'Receiving person accepted custody and handover recorded'}
  ];
  const CATEGORIES=['Fuel','Tolls','Driver travel','Accommodation','Animal food and water','Transport equipment','Veterinary contingency','Other'];
  const toCents=(text)=>{
    const v=String(text||'').trim();
    if(!/^(0|[1-9][0-9]{0,6})(\.[0-9]{1,2})?$/.test(v))return null;
    const pair=v.split('.');
    const amount=Number(pair[0])*100+Number((pair[1]||'').padEnd(2,'0'));
    return Number.isSafeInteger(amount)?amount:null;
  };
  const money=c=>!Number.isSafeInteger(c)||c<0?'—':new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(c/100);
  function evidenceFor(trip,checks){
    const own=Array.isArray(checks)?checks.filter(c=>c&&c.tripId===trip?.id&&c.verified===true):[];
    return REQUIRED_CHECKS.map(req=>({...req,done:own.some(c=>c.code===req.code)}));
  }
  function summarise(trip,expenses,checks,now=new Date().toISOString()){
    const related=(Array.isArray(expenses)?expenses:[]).filter(e=>e&&e.tripId===trip?.id);
    const invalid=related.some(e=>!Number.isSafeInteger(e.amountCents)||e.amountCents<0||!CATEGORIES.includes(e.category));
    const verified=related.filter(e=>e.verified===true);
    const spent=verified.reduce((sum,e)=>sum+e.amountCents,0);
    const unverified=related.filter(e=>e.verified!==true).length;
    const budget=Number.isSafeInteger(trip?.budgetCents)&&trip.budgetCents>=0?trip.budgetCents:null;
    const status=trip?.status||'HOLD';
    const required=evidenceFor(trip,checks);
    const missing=required.filter(c=>!c.done);
    const handoverPending=missing.some(c=>c.code==='receiver'||c.code==='receipt');
    const complete=missing.length===0&&status==='COMPLETED';
    const overdue=status!=='COMPLETED'&&Number.isFinite(Date.parse(trip?.dueAt))&&Number.isFinite(Date.parse(now))&&Date.parse(trip.dueAt)<Date.parse(now);
    let state='GREEN',reason='Travel plan recorded. Staff remain responsible for animal welfare and care decisions.';
    if(!trip?.id||!trip.animalId||!trip.driverId||!trip.origin||!trip.destination||budget===null||invalid){
      state='HOLD';reason='Trip details or cost evidence are incomplete or invalid.';
    }else if(status==='COMPLETED'&&missing.length){
      state='HOLD';reason='Trip marked completed without all required safety and custody evidence; cannot certify completion.';
    }else if(overdue&&handoverPending){
      state='RED';reason='Journey/handover overdue; manager must contact the driver and verify animal welfare.';
    }else if(overdue){
      state='AMBER';reason='Journey overdue; manager to verify animal welfare, status and responsible person.';
    }else if(status==='IN_TRANSIT'&&missing.some(c=>['identity','containment','welfare'].includes(c.code))){
      state='RED';reason='In-transit record lacks pre-departure animal and vehicle checks.';
    }else if(budget!==null&&spent>budget){
      state='AMBER';reason='Verified recorded expenses exceed the approved travel budget.';
    }else if(unverified>0){
      state='HOLD';reason='Travel expenses await evidence; actual totals exclude unverified amounts.';
    }else if(status==='ARRIVED'&&handoverPending){
      state='AMBER';reason='Animal arrived, but authorised receiving-custody handover is not fully recorded.';
    }else if(missing.length&&status!=='PLANNED'){
      state='AMBER';reason='Safety and custody evidence remains outstanding.';
    }
    return {tripId:trip?.id||null,status,state,reason,budgetCents:budget,verifiedSpentCents:spent,
      remainingCents:budget===null?null:budget-spent,unverifiedExpenseCount:unverified,
      missingChecks:missing,complete,tripExpenses:related.length,
      note:'Planned budget and recorded expenditure are not a mileage estimate, commercial quote or verified customer charge.'};
  }
  function all(trips,expenses,checks,now){
    return (Array.isArray(trips)?trips:[]).map(t=>({trip:t,...summarise(t,expenses,checks,now)}));
  }
  return {VERSION:'KENNEL-RELOCATION-1.0',REQUIRED_CHECKS,CATEGORIES,toCents,money,evidenceFor,summarise,all};
});