/* Kennel Care Continuity — synthetic role checks only; no real login or data transfer. */
(function(){
  'use strict';
  const E=window.KennelContinuity,S=window.GStore,G=window.GUI;
  if(!E||!S||!G)return;
  const el=id=>document.getElementById(id), esc=v=>G.esc(v==null?'':String(v)), now=()=>new Date().toISOString();
  const id=prefix=>prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
  const status=v=>G.badge(v,v==='GREEN'?'green':v==='RED'?'red':v==='AMBER'?'amber':'outline');
  const assign=(element,rows,key='id',title='name')=>{
    const e=el(element);if(!e)return;const value=e.value;
    e.innerHTML=rows.map(x=>'<option value="'+esc(x[key])+'">'+esc(x[title])+'</option>').join('');
    if(value&&[...e.options].some(x=>x.value===value))e.value=value;
  };
  function ensure(){
    const state=S.get();if(state.opsHub?.careContinuity)return;
    S.update(s=>{
      s.opsHub ||= {version:1,mode:'SYNTHETIC_BROWSER_ONLY',services:[],invoices:[],payments:[],handovers:[],stockUsage:[],reviews:[]};
      s.opsHub.careContinuity ||= {planReviews:[],training:[],followups:[],coverProposals:[]};
    },'System','Care Continuity panel initialised','Only fictional training records');
  }
  const change=(fn,action)=>S.update(s=>fn(s.opsHub.careContinuity),'Demo manager',action,'Fictional sample data only');
  const today=()=>now().slice(0,10);
  function render(){
    if(!el('kennel-continuity'))return;
    ensure();
    const st=S.get(),c=st.opsHub.careContinuity,view=E.overview(st,now());
    const staffs=st.staff||[],animals=st.animals||[],mgr=staffs.filter(x=>/manager|senior attendant/i.test(x.role));
    assign('continuityAnimal',animals);assign('continuityCollectorAnimal',animals);
    assign('continuityStaff',staffs);assign('continuityManager',mgr);assign('continuityCallbackStaff',staffs);
    assign('continuityCallbackAnimal',animals);assign('continuityCoverStaff',staffs);assign('continuityCoverManager',mgr);
    assign('continuityCallbackDoneBy',staffs);assign('continuityCallbackManager',mgr);
    assign('continuityCallbackClose',c.followups.filter(x=>x.state==='OPEN').map(x=>({id:x.id,name:x.message+' · '+x.id})));
    assign('continuityTrainingManager',mgr);
    assign('continuityCareTask',(st.tasks||[]).filter(x=>!['Completed','Cancelled'].includes(x.status)).map(t=>{
      const a=animals.find(x=>x.id===t.animalId);
      return {id:t.id,name:(a?a.name+' · ':'')+t.type+' · '+t.id};
    }));
    const codes=el('continuityTrainingCode');
    if(codes&&codes.options.length===0)codes.innerHTML=Object.entries(E.TRAINING_LABELS).map(([code,name])=>'<option value="'+esc(code)+'">'+esc(name)+'</option>').join('');
    const overview=el('continuityOverview');
    if(overview)overview.innerHTML='<div class="grid four">'+[
      ['Animal plans needing review',view.plans.filter(x=>x.state!=='GREEN').length],
      ['Staff evidence needing review',view.training.filter(x=>x.state!=='GREEN').length],
      ['Owner follow-ups open',view.followups.length],
      ['Pending care cover',view.unacceptedCover]
    ].map(x=>'<div class="stat"><small>'+esc(x[0])+'</small><b>'+x[1]+'</b></div>').join('')+'</div>'+
    '<p class="small">Counts mean demo evidence needs checking, not that staff are unqualified, an animal has received unsafe care, or an owner has a complaint. Training is not live verification.</p>';
    const plans=el('continuityPlans');
    if(plans)plans.innerHTML='<div class="list">'+view.plans.map(x=>'<div class="row"><div class="row-grow"><b>'+esc(x.animalName)+'</b><small>'+esc(x.reason)+(x.reviewDueAt?' · next review '+esc(x.reviewDueAt):'')+'</small></div>'+status(x.state)+'</div>').join('')+'</div>';
    const readiness=el('continuityReadiness');
    if(readiness)readiness.innerHTML='<div class="list">'+view.training.map(x=>'<div class="row"><div class="row-grow"><b>'+esc(x.name)+'</b><small>'+esc(x.reason)+'</small>'+
      (x.missing.length?'<small>Missing records: '+esc(x.missing.map(code=>E.TRAINING_LABELS[code]||code).join(', '))+'</small>':'')+'</div>'+status(x.state)+'</div>').join('')+'</div>';
    const followups=el('continuityFollowups');
    if(followups)followups.innerHTML='<div class="list">'+(view.followups.length?view.followups.map(x=>{
      const f=c.followups.find(y=>y.id===x.id),a=animals.find(y=>y.id===x.animalId),staff=staffs.find(y=>y.id===x.assignedTo);
      return '<div class="row"><div class="row-grow"><b>'+esc(a?.name||'Animal')+' · '+esc(f?.message||'Owner follow-up')+'</b><small>'+esc(staff?.name||'Unassigned')+' · '+esc(x.reason)+'</small></div>'+status(x.state)+'</div>';
    }).join(''):'<p class="small">No follow-up requests awaiting response.</p>')+'</div>';
    const cover=el('continuityCoverage');
    if(cover)cover.innerHTML='<div class="list">'+(c.coverProposals.length?c.coverProposals.map(x=>{
      const task=st.tasks.find(y=>y.id===x.taskId),receiver=staffs.find(y=>y.id===x.receiverId);
      const test=E.handoverCoverage(task,x,staffs,now());
      return '<div class="row"><div class="row-grow"><b>'+esc(task?.type||'Task')+' → '+esc(receiver?.name||'Unknown')+'</b><small>'+esc(test.reason)+'</small></div>'+
        status(test.state)+(x.status!=='ACCEPTED'?'<button type="button" class="btn sm secondary" data-continuity-accept="'+esc(x.id)+'">Demo accept cover</button>':'')+'</div>';
    }).join(''):'<p class="small">No proposed absence/shift coverage.</p>')+'</div>';
  }
  function submit(e){
    const form=e.target;if(!form.id?.startsWith('continuityForm'))return;
    e.preventDefault();const d=new FormData(form),st=S.get(),c=st.opsHub.careContinuity;
    const staffId=String(d.get('staffId')||''),managerId=String(d.get('managerId')||'');
    if(form.id==='continuityFormReview'){
      const animalId=String(d.get('animalId')||''),dueAt=String(d.get('dueAt')||'');
      if(!st.animals.some(x=>x.id===animalId)||!E.validDate(dueAt)||!st.staff.some(x=>x.id===managerId&&/manager|senior attendant/i.test(x.role)))return G.toast('Select an animal, valid date and demo manager.');
      change(x=>x.planReviews.push({animalId,reviewedAt:today(),reviewDueAt:dueAt,reviewedBy:managerId}),
        'Animal care-plan review recorded'); 
    }else if(form.id==='continuityFormTraining'){
      const code=String(d.get('code')),completed=String(d.get('completedAt')||''),expires=String(d.get('expiresAt')||'');
      if(!st.staff.some(x=>x.id===staffId)||!st.staff.some(x=>x.id===managerId&&/manager|senior attendant/i.test(x.role))||staffId===managerId||
        !E.TRAINING_LABELS[code]||!E.validDate(completed)||!E.validDate(expires)||completed>expires||completed>today()||!d.has('attested'))return G.toast('Training must be dated, current and attested by a separate fictional manager.');
      change(x=>x.training.push({staffId,code,completedAt:completed,expiresAt:expires,attestedBy:managerId,attestedByRole:'manager',verified:true}),
        'Training evidence recorded for synthetic worker');
    }else if(form.id==='continuityFormPickup'){
      const animal=st.animals.find(x=>x.id===d.get('animalId'));
      const result=E.collectionPreflight({animal,collector:d.get('collector'),
        identityEvidence:d.has('identity'),authorityConfirmed:d.has('authority'),
        conditionRecorded:d.has('condition'),managerReview:d.has('manager')});
      const box=el('continuityCollectionResult');
      if(box){box.textContent=result.state+' — '+result.reason;box.className='alert-box '+(result.state==='RED'?'red':'');}
      return; // Do not save collector name or change custody.
    }else if(form.id==='continuityFormCallback'){
      const animalId=d.get('animalId'),assignedTo=d.get('assignedTo'),message=String(d.get('message')||'').trim(),dueAt=String(d.get('dueAt')||'');
      if(!st.animals.some(x=>x.id===animalId)||!st.staff.some(x=>x.id===assignedTo)||message.length<3||message.length>160||
        !Number.isFinite(Date.parse(dueAt)))return G.toast('Select a valid animal, staff owner, due time and follow-up reason.');
      change(x=>x.followups.push({id:id('CALL'),animalId,assignedTo,message,dueAt:new Date(dueAt).toISOString(),state:'OPEN'}),
        'Owner callback placed in named follow-up queue');
    }else if(form.id==='continuityFormCallbackClose'){
      const callbackId=String(d.get('callbackId')||''),record=c.followups.find(x=>x.id===callbackId);
      const completedBy=String(d.get('completedBy')||''),reviewer=String(d.get('managerId')||'');
      if(!st.staff.some(x=>x.id===completedBy)||!st.staff.some(x=>x.id===reviewer&&/manager|senior attendant/i.test(x.role)))return G.toast('Choose a fictional staff member and separate manager reviewer.');
      const result=E.closeFollowup(record,{completedBy,managerReviewedBy:reviewer,
        outcomeNote:String(d.get('outcomeNote')||''),contactActuallyCompleted:d.has('completed')},now());
      if(!result.valid)return G.toast(result.reason);
      change(x=>Object.assign(x.followups.find(y=>y.id===callbackId),result.closure),
        'Fictional owner follow-up completed with response evidence');
    }else if(form.id==='continuityFormCover'){
      const task=st.tasks.find(x=>x.id===d.get('taskId')),receiverId=String(d.get('receiverId')||'');
      if(!task?.assignedTo||receiverId===task.assignedTo||!st.staff.some(x=>x.id===receiverId&&x.onShift)||
         !st.staff.some(x=>x.id===managerId&&/manager|senior attendant/i.test(x.role)&&x.id!==receiverId))return G.toast('Choose an assigned task, active different receiver and independent demo manager.');
      if(c.coverProposals.some(x=>x.taskId===task.id&&x.status!=='ACCEPTED'))return G.toast('A cover proposal is already pending for this task.');
      change(x=>x.coverProposals.push({id:id('COVER'),taskId:task.id,senderId:task.assignedTo,receiverId,reviewedBy:managerId,status:'PENDING',offeredAt:now()}),
        'Care coverage proposed: original task owner retained');
    }else return;
    form.reset();render();G.toast('Fictional evidence saved in this browser only.');
  }
  function init(){
    if(!el('kennel-continuity'))return;
    ensure();render();
    document.addEventListener('submit',submit);
    document.body.addEventListener('click',e=>{
      const b=e.target.closest('[data-continuity-accept]');
      if(!b)return;
      const st=S.get(),x=st.opsHub.careContinuity.coverProposals.find(a=>a.id===b.dataset.continuityAccept);
      const task=st.tasks.find(a=>a.id===x?.taskId),person=st.staff.find(a=>a.id===x?.receiverId);
      if(!x||!person?.onShift||!task||task.assignedTo!==x.senderId||x.status==='ACCEPTED')return G.toast('Coverage cannot be accepted: task/staff state has changed.');
      change(c=>{const row=c.coverProposals.find(a=>a.id===x.id);row.status='ACCEPTED';row.acceptedAt=now();},'Fictional worker accepted cover; original task owner NOT changed');
      G.toast('Cover accepted in demonstration; original task remains owned until authenticated server transfer.');
    });
    window.addEventListener('genevieve:state',render);
  }
  document.addEventListener('DOMContentLoaded',init);
})();