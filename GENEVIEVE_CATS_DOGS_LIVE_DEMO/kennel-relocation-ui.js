/* Pet Relocation & Travel Budget — fictional same-browser kennel demonstration.
 * Independent kennel records, no connection to Traveller Budget accounts or real routes.
 */
(function(){
  'use strict';
  const K=window.KennelRelocation,S=window.GStore,G=window.GUI;
  if(!K||!S||!G)return;
  const el=id=>document.getElementById(id);
  const esc=x=>G.esc(x==null?'':String(x));
  const iso=()=>new Date().toISOString();
  const newId=p=>p+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6);
  const select=(id,rows,key='id',display='name')=>{
    const e=el(id);if(!e)return;
    const selected=e.value;
    e.innerHTML=rows.map(x=>'<option value="'+esc(x[key])+'">'+esc(x[display])+'</option>').join('');
    if(selected&&[...e.options].some(x=>x.value===selected))e.value=selected;
  };
  function prepare(){
    const st=S.get();
    if(st.opsHub&&Array.isArray(st.opsHub.relocations)&&Array.isArray(st.opsHub.relocationExpenses)&&Array.isArray(st.opsHub.relocationChecks)&&Array.isArray(st.opsHub.relocationStages))return;
    S.update(s=>{
      if(!s.opsHub)s.opsHub={version:1,mode:'SYNTHETIC_BROWSER_ONLY',services:[],invoices:[],payments:[],handovers:[],stockUsage:[],reviews:[]};
      s.opsHub.relocations ||= [];
      s.opsHub.relocationExpenses ||= [];
      s.opsHub.relocationChecks ||= [];
      s.opsHub.relocationStages ||= [];
    },'System','Relocation demo initialised','Synthetic travel budgets; no external travel or personal data');
  }
  function record(fn,label,detail){
    S.update(s=>fn(s.opsHub),'Demo operator',label,detail);
  }
  function toast(s){G.toast(s)}
  function moneyForm(v){return K.toCents(v)}
  function list(){
    if(!el('kennel-relocation'))return;
    prepare();
    const st=S.get(),h=st.opsHub,now=iso(),summaries=K.all(h.relocations,h.relocationExpenses,h.relocationChecks,now);
    select('relocateAnimal',st.animals);
    select('relocateDriver',st.staff);
    select('relocateTripCost',h.relocations,'id','name');
    select('relocateTripCheck',h.relocations,'id','name');
    select('relocateTripStage',h.relocations,'id','name');
    select('relocateTripStatus',h.relocations,'id','name');
    select('relocateExistingTransport',[{id:'',name:'Standalone relocation (no linked job)'},...st.transports.map(t=>({
       id:t.id,name:(st.animals.find(x=>x.id===t.animalId)?.name||'Animal')+' · '+t.direction+' · '+t.id
    }))]);
    const categories=el('relocateCostCategory');
    if(categories&&!categories.options.length)categories.innerHTML=K.CATEGORIES.map(x=>'<option>'+esc(x)+'</option>').join('');
    const check=el('relocateCheckType');
    if(check&&!check.options.length)check.innerHTML=K.REQUIRED_CHECKS.map(x=>'<option value="'+esc(x.code)+'">'+esc(x.label)+'</option>').join('');
    const cards=el('relocateTripList');
    if(!cards)return;
    cards.innerHTML=summaries.length?summaries.map(({trip:t,...v})=>{
      const animal=st.animals.find(a=>a.id===t.animalId);
      const staff=st.staff.find(a=>a.id===t.driverId);
      const checks=K.evidenceFor(t,h.relocationChecks);
      const stages=h.relocationStages.filter(x=>x.tripId===t.id);
      const paid=h.relocationExpenses.filter(x=>x.tripId===t.id);
      return '<article class="card" style="margin-bottom:12px">'+
        '<div class="card-head"><h3>'+esc(t.name)+'</h3>'+G.badge(v.state,v.state==='RED'?'red':v.state==='AMBER'?'amber':v.state==='GREEN'?'green':'outline')+'</div>'+
        '<p class="small"><b>'+esc(animal?.name||'Animal')+'</b> · Driver: '+esc(staff?.name||'unassigned')+' · '+esc(t.status)+'</p>'+
        '<p class="small">Origin: '+esc(t.origin)+' → New home/destination: '+esc(t.destination)+'</p>'+
        '<div class="grid three"><div class="stat"><small>Budget</small><b>'+K.money(v.budgetCents)+'</b></div>'+
        '<div class="stat"><small>Evidenced expenses</small><b>'+K.money(v.verifiedSpentCents)+'</b></div>'+
        '<div class="stat"><small>Remaining / over</small><b>'+ (v.remainingCents===null?'—':(v.remainingCents<0?'-':'')+K.money(Math.abs(v.remainingCents)))+'</b></div></div>'+
        '<p class="small">'+esc(v.reason)+'</p>'+
        '<details><summary><b>Welfare and receiving-home checks — '+(checks.length-v.missingChecks.length)+'/'+checks.length+'</b></summary>'+
        '<div class="list">'+checks.map(c=>'<div class="row"><div class="row-grow"><small>'+esc(c.label)+'</small></div>'+G.badge(c.done?'RECORDED':'HOLD',c.done?'green':'outline')+'</div>').join('')+'</div></details>'+
        '<details><summary><b>Stops, route stages and recorded expenses</b></summary>'+
        '<div class="list">'+(stages.length?stages.map(x=>'<div class="row"><div class="row-grow"><b>'+esc(x.phase)+' · '+esc(x.location)+'</b><small>'+esc(x.note)+' · '+esc(new Date(x.time).toLocaleString('en-AU'))+'</small></div></div>').join(''):'<p class="small">No route milestones recorded yet.</p>')+
        (paid.length?paid.map(x=>'<div class="row"><div class="row-grow"><b>'+esc(x.category)+'</b><small>'+esc(x.note||'No comment')+'</small></div><b>'+K.money(x.amountCents)+'</b> '+G.badge(x.verified?'VERIFIED':'HOLD',x.verified?'green':'outline')+'</div>').join(''):'<p class="small">No expenses recorded yet.</p>')+'</div></details>'+
        '<p class="small">Linked driver job: '+esc(t.transportJobId||'Not linked')+'. Link is a demo reference; it does not modify the driver job automatically.</p></article>';
    }).join(''):'<div class="alert-box"><h3>No relocation plans yet</h3><p>Create a fictional delivery or rehoming journey. This is different from a routine kennel pickup.</p></div>';
    const s1=el('relocateSummary');
    if(s1)s1.innerHTML='<div class="grid three"><div class="stat"><small>Planned / active journeys</small><b>'+summaries.filter(x=>x.status!=='COMPLETED').length+'</b></div>'+
      '<div class="stat"><small>Urgent trips</small><b>'+summaries.filter(x=>x.state==='RED').length+'</b></div>'+
      '<div class="stat"><small>Handover completed with evidence</small><b>'+summaries.filter(x=>x.complete).length+'</b></div></div>';
  }
  function stageTrip(event,formId){
    const f=event.target;event.preventDefault();
    const d=new FormData(f),h=S.get().opsHub,st=S.get();
    if(formId==='relocateFormPlan'){
      const animalId=String(d.get('animalId')||''), driverId=String(d.get('driverId')||'');
      const origin=String(d.get('origin')||'').trim(),destination=String(d.get('destination')||'').trim();
      const name=String(d.get('name')||'').trim(), budget=moneyForm(d.get('budget')),dueAt=String(d.get('dueAt')||'');
      const linked=String(d.get('transportJobId')||'');
      if(name.length<3||name.length>100||origin.length<2||destination.length<2||origin.length>160||destination.length>160)return toast('Add a route title, origin and destination using fictional labels only.');
      if(!st.animals.some(x=>x.id===animalId)||!st.staff.some(x=>x.id===driverId)||budget===null||!Number.isFinite(Date.parse(dueAt)))return toast('Choose a valid animal, staff member, budget and target arrival time.');
      const t=st.transports.find(x=>x.id===linked);
      if(linked&&(!t||t.animalId!==animalId||t.driverId!==driverId))return toast('Linked driver job must match the animal and assigned driver.');
      const newTrip={id:newId('REHOME'),name,animalId,driverId,origin,destination,transportJobId:linked||null,budgetCents:budget,
        dueAt:new Date(dueAt).toISOString(),status:'PLANNED',createdAt:iso()};
      record(x=>x.relocations.push(newTrip),'Pet relocation journey planned',newTrip.name);
    }else if(formId==='relocateFormExpense'){
      const tripId=d.get('tripId'),amount=moneyForm(d.get('amount')),category=String(d.get('category')),note=String(d.get('note')||'').trim();
      if(!h.relocations.some(x=>x.id===tripId)||!K.CATEGORIES.includes(category)||amount===null||note.length>240)return toast('Choose a trip/category and enter a valid cost and short note.');
      record(x=>x.relocationExpenses.push({id:newId('COST'),tripId,amountCents:amount,category,verified:d.has('verified'),note,time:iso()}),
        'Travel expense evidence added',category);
    }else if(formId==='relocateFormCheck'){
      const tripId=d.get('tripId'),code=String(d.get('code')),note=String(d.get('note')||'').trim();
      if(!h.relocations.some(x=>x.id===tripId)||!K.REQUIRED_CHECKS.some(x=>x.code===code)||!d.has('verified')||!note||note.length>240)
        return toast('Select the trip, confirm the actual check and record a factual note.');
      record(x=>x.relocationChecks.push({id:newId('CHECK'),tripId,code,note,verified:true,time:iso()}),'Manual animal/transport check recorded',code);
    }else if(formId==='relocateFormStage'){
      const tripId=d.get('tripId'),phase=String(d.get('phase')),location=String(d.get('location')||'').trim(),note=String(d.get('note')||'').trim();
      if(!h.relocations.some(x=>x.id===tripId)||!['Departed','En route stop','Arrived'].includes(phase)||!location||location.length>160||note.length>240)
        return toast('Choose a valid journey stage and a fictional location label.');
      record(x=>x.relocationStages.push({id:newId('STAGE'),tripId,phase,location,note,time:iso()}),'Relocation stage recorded',phase);
    }else if(formId==='relocateFormStatus'){
      const tripId=d.get('tripId'),status=String(d.get('status')),trip=h.relocations.find(x=>x.id===tripId);
      if(!trip||!['IN_TRANSIT','ARRIVED','COMPLETED'].includes(status))return toast('Select a valid trip and state.');
      const stages=h.relocationStages.filter(x=>x.tripId===tripId);
      const checks=K.evidenceFor(trip,h.relocationChecks);
      const has=x=>checks.some(y=>y.code===x&&y.done);
      if(status==='IN_TRANSIT'&&!['identity','containment','welfare'].every(has))return toast('Pre-departure welfare, ID and containment checks are required.');
      if(status==='ARRIVED'&&(!has('arrival')||!stages.some(x=>x.phase==='Arrived')))return toast('Record animal arrival condition and an arrival milestone first.');
      if(status==='COMPLETED'&&(!checks.every(x=>x.done)||!stages.some(x=>x.phase==='Arrived')))return toast('Complete all animal, receiver and custody checks and record arrival before closing.');
      if(status==='COMPLETED'&&trip.status!=='ARRIVED')return toast('Set the trip to ARRIVED before final home handover.');
      if(status==='ARRIVED'&&trip.status==='PLANNED')return toast('Record IN TRANSIT after pre-departure checks first.');
      if(status==='IN_TRANSIT'&&trip.status!=='PLANNED')return toast('The journey can depart only once from PLANNED.');
      if(trip.status==='COMPLETED')return toast('Completed trip records cannot be reopened in this demo.');
      record(x=>x.relocations.find(y=>y.id===tripId).status=status,'Pet relocation stage accepted',status);
    }else return;
    f.reset();list();toast('Saved in fictional travel demo only — no real animal or customer data.');
  }
  function init(){
    if(!el('kennel-relocation'))return;
    prepare();
    document.addEventListener('submit',e=>{
      if(e.target?.id?.startsWith('relocateForm'))stageTrip(e,e.target.id);
    });
    window.addEventListener('genevieve:state',list);
    list();
  }
  document.addEventListener('DOMContentLoaded',init);
})();