/* Authenticated employee rounds/tasks adapter.
 * Requires an attendant token. Server-side assignment scoping prevents staff
 * from reading or updating another attendant's rounds/tasks.
 */
(function(){
  'use strict';
  let client=null,panel=null,statusEl=null,input=null,currentRound=null,currentSession=null;
  const common=[['sighted','Animal physically sighted'],['breathing','Breathing and movement observed'],['water','Fresh water checked'],['food','Food / appetite checked'],['cleanliness','Cleanliness, bedding and waste checked'],['behaviour','Behaviour and stress observed'],['temperature','Temperature / ventilation checked'],['security','Gate, latch or suite door checked'],['medication','Medication status checked'],['notes','Notes or authorised photo considered']];
  const dog=[['toileting','Toileting recorded'],['exercise','Exercise / enrichment reviewed'],['dogTransfer','Dog movement and gate crowding risk checked']];
  const cat=[['litter','Litter tray, urine and faeces checked'],['hiding','Hiding, withdrawal and handling tolerance checked'],['catEscape','Carrier, suite door and escape-control checked']];
  const esc=(x)=>window.GUI&&window.GUI.esc?window.GUI.esc(x==null?'':String(x)):String(x==null?'':x);
  const badge=(label,state)=>window.GUI&&window.GUI.badge?window.GUI.badge(label,state):'<span>'+esc(label)+'</span>';
  const time=(x)=>window.GUI&&window.GUI.time?window.GUI.time(x):esc(x);
  const connected=()=>Boolean(client&&client.hasToken());
  function setStatus(text,state='outline'){if(statusEl)statusEl.innerHTML=badge(text,state)}
  function collectChecks(){const out={};document.querySelectorAll('[data-check]').forEach(x=>out[x.dataset.check]=x.checked);return out}

  async function load(){
    const [session,rounds,tasks,animals,alerts]=await Promise.all([client.session(),client.rounds(),client.tasks(),client.animals(),client.alerts()]);
    if(session.role!=='attendant'){client.disconnect();throw Object.assign(new Error('attendant token required'),{status:403})}
    return {session,rounds,tasks,animals,alerts};
  }
  function renderData(d){
    currentSession=d.session;
    const employee=document.getElementById('employeeSelect');
    if(employee){employee.innerHTML='<option>'+esc(d.session.displayName||d.session.subject)+' · attendant</option>';employee.disabled=true}

    const openAlerts=d.alerts.filter(a=>a.status==='open');
    const red=openAlerts.some(a=>a.severity==='red');
    const amber=openAlerts.some(a=>a.severity==='amber'||a.severity==='hold');
    const state=document.getElementById('employeeState');
    if(state)state.innerHTML='<div class="mobile-state"><div class="state-icon">'+(red?'!':'✓')+'</div><div><p class="eyebrow">Authenticated facility state</p><h2>'+(red?'RED — URGENT ACTION':amber?'AMBER — CONTROLLED ATTENTION':'GREEN — NORMAL OPERATIONS')+'</h2><p class="small">Facility alerts are evidence for staff awareness; follow manager and official emergency instructions.</p></div></div>';

    currentRound=d.rounds.find(r=>r.status==='in_progress')||d.rounds.find(r=>r.status!=='completed')||null;
    const title=document.getElementById('roundTitle'),status=document.getElementById('roundStatus'),meta=document.getElementById('roundMeta'),progress=document.getElementById('roundProgress'),checksEl=document.getElementById('roundChecks'),animalsEl=document.getElementById('roundAnimals');
    if(!currentRound){
      if(title)title.textContent='No round assigned';
      if(status)status.innerHTML=badge('NONE','outline');
      if(meta)meta.textContent='No active round assigned to this authenticated employee.';
      if(progress)progress.style.width='0%';
      if(checksEl)checksEl.innerHTML='';
      if(animalsEl)animalsEl.innerHTML='';
    }else{
      if(title)title.textContent=currentRound.zone;
      if(status)status.innerHTML=badge(String(currentRound.status||'').toUpperCase(),currentRound.status==='in_progress'?'amber':currentRound.status==='completed'?'green':'outline');
      if(meta)meta.textContent=(currentRound.species||'Facility')+' round · due '+time(currentRound.due_at)+' · '+(d.session.displayName||d.session.subject);
      if(progress)progress.style.width=Number(currentRound.progress||0)+'%';
      const relevant=d.animals.filter(a=>currentRound.species==='Both'||currentRound.species==='Facility'||a.species===currentRound.species).slice(0,6);
      if(animalsEl)animalsEl.innerHTML=relevant.map(a=>'<div class="row"><div class="species-icon">'+(a.species==='Cat'?'🐈':'🐕')+'</div><div class="row-grow"><b>'+esc(a.name)+'</b><small>'+esc(a.handling_notes||a.behaviour_notes||'No special handling note')+'</small></div></div>').join('')||'<p class="small">This is a facility round.</p>';
      let checks=[...common];if(currentRound.species==='Dog')checks=checks.concat(dog);if(currentRound.species==='Cat')checks=checks.concat(cat);if(currentRound.species==='Both')checks=checks.concat(dog,cat);
      if(checksEl)checksEl.innerHTML=checks.map(([k,label])=>'<label class="round-check"><input type="checkbox" data-check="'+k+'" '+(currentRound.checks&&currentRound.checks[k]?'checked':'')+'><span class="grow">'+esc(label)+'</span></label>').join('');
      const note=document.getElementById('roundNote');if(note)note.value=currentRound.note||'';
      const sev=document.querySelector('input[name=roundSeverity][value="'+esc(currentRound.severity||'green')+'"]');if(sev)sev.checked=true;
    }

    const taskCount=document.getElementById('taskCount'),taskList=document.getElementById('employeeTasks');
    const openTasks=d.tasks.filter(t=>!['completed','cancelled'].includes(t.status));
    if(taskCount)taskCount.textContent=openTasks.length;
    if(taskList)taskList.innerHTML=openTasks.map(t=>{
      const a=d.animals.find(x=>x.id===t.animal_id)||{};
      return '<div class="row"><div class="species-icon">'+(a.species==='Cat'?'🐈':a.species==='Dog'?'🐕':'⌂')+'</div><div class="row-grow"><b>'+esc(t.type)+(a.name?' — '+esc(a.name):'')+'</b><small>'+esc(t.detail||'')+' · '+time(t.due_at)+'</small></div>'+badge(String(t.severity||'').toUpperCase(),t.severity||'outline')+'<button class="btn sm secondary" data-task="'+esc(t.id)+'">Done</button></div>';
    }).join('')||'<p class="small">No open tasks assigned.</p>';

    const ai=document.querySelector('#employeeIncidentForm [name=animalId]');
    if(ai)ai.innerHTML='<option value="">Facility / no animal</option>'+d.animals.map(a=>'<option value="'+esc(a.id)+'">'+esc(a.name)+' · '+esc(a.species)+'</option>').join('');
    const incidentButton=document.querySelector('#employeeIncidentForm button[type="submit"]');
    if(incidentButton)incidentButton.textContent='Log incident securely';
    const strip=document.querySelector('[data-sync-strip]');
    if(strip)strip.textContent='AUTHENTICATED BACKEND · facility-scoped records · session-only credential';
    setStatus('ATTENDANT VERIFIED','green');
  }
  async function render(){
    if(!connected())return false;
    try{renderData(await load());return true}
    catch(e){setStatus(e&&e.status===401?'TOKEN REJECTED':'ATTENDANT ACCESS HOLD','red');return false}
  }
  function build(){
    const main=document.querySelector('.mobile-content');if(!main||panel)return;
    panel=document.createElement('section');panel.className='mobile-card';
    panel.innerHTML='<div class="card-head"><div><p class="eyebrow">Secure employee access</p><h2>Attendant sign-in</h2></div><span data-employee-api-status></span></div><label>Employee access token<input type="password" autocomplete="off" data-employee-api-token placeholder="Synthetic attendant token"></label><div class="button-row"><button type="button" class="btn" data-employee-api-connect>Connect</button><button type="button" class="btn secondary" data-employee-api-disconnect>Disconnect</button></div><p class="small">The server records the authenticated employee identity. A staff member cannot select somebody else and act as them.</p>';
    main.insertBefore(panel,main.firstChild);
    statusEl=panel.querySelector('[data-employee-api-status]');input=panel.querySelector('[data-employee-api-token]');
    panel.querySelector('[data-employee-api-connect]').addEventListener('click',async()=>{
      const btn=panel.querySelector('[data-employee-api-connect]');btn.disabled=true;setStatus('VERIFYING…','amber');
      try{
        const s=await client.connect(input.value);
        if(s.role!=='attendant'){client.disconnect();throw Object.assign(new Error('attendant token required'),{status:403})}
        input.value='';await render();
      }catch(e){setStatus(e&&e.status===401?'TOKEN REJECTED':'ATTENDANT TOKEN REQUIRED','red')}
      finally{btn.disabled=false}
    });
    panel.querySelector('[data-employee-api-disconnect]').addEventListener('click',()=>{client.disconnect();location.reload()});
  }
  async function saveRound(complete,event){
    if(!connected()||!currentRound)return;
    event.preventDefault();event.stopImmediatePropagation();
    const sev=(document.querySelector('input[name=roundSeverity]:checked')||{}).value||'green';
    const note=(document.getElementById('roundNote')||{}).value?.trim()||'';
    const checks=collectChecks(),values=Object.values(checks),done=values.filter(Boolean).length,total=values.length,progress=total?Math.round(done/total*100):0;
    if((sev==='amber'||sev==='red')&&!note){window.GUI?.toast('Add an observation note for amber or red');return}
    if(complete&&done<total){window.GUI?.toast('Complete every required check before closing the round');return}
    try{
      await client.updateRound(currentRound.id,{status:complete?'completed':'in_progress',progress:complete?100:progress,checks,severity:sev,note:note||null});
      window.GUI?.toast(complete?'Round completed and audited':'Round progress saved securely');await render();
    }catch(e){if(e&&e.status===401)client.disconnect();window.GUI?.toast('Round was not updated: '+(e&&e.message||'backend error'))}
  }
  async function completeTask(id,event){
    if(!connected())return;
    event.preventDefault();event.stopImmediatePropagation();
    try{await client.updateTask(id,{status:'completed'});window.GUI?.toast('Task completed and audited');await render()}
    catch(e){if(e&&e.status===401)client.disconnect();window.GUI?.toast('Task was not updated: '+(e&&e.message||'backend error'))}
  }
  async function incidentSubmit(form,event){
    if(!connected())return;
    event.preventDefault();event.stopImmediatePropagation();
    const f=new FormData(form);
    try{
      await client.createIncident({animal_id:f.get('animalId')||null,type:String(f.get('type')||'').trim(),severity:String(f.get('severity')||'amber'),detail:String(f.get('detail')||'').trim(),controls:'Employee immediate action recorded; manager review required'});
      form.reset();document.getElementById('employeeIncident')?.classList.remove('open');window.GUI?.toast('Incident recorded for manager review');await render();
    }catch(e){if(e&&e.status===401)client.disconnect();window.GUI?.toast('Incident was not saved: '+(e&&e.message||'backend error'))}
  }
  async function sos(event){
    if(!connected())return;
    event.preventDefault();event.stopImmediatePropagation();
    if(!confirm('Record an urgent internal SOS incident? This does not call 000.'))return;
    try{
      await client.createIncident({animal_id:null,type:'Employee SOS',severity:'red',detail:'Urgent internal assistance requested by authenticated attendant.',controls:'Manager to establish facts and external response needs. Call 000 separately for a life-threatening emergency.'});
      window.GUI?.toast('SOS incident recorded. Call 000 separately if life-threatening.');await render();
    }catch(e){if(e&&e.status===401)client.disconnect();window.GUI?.toast('SOS record failed: '+(e&&e.message||'backend error'))}
  }
  function init(){
    if(!window.KennelAPI)return;
    client=window.KennelAPI.sharedClient();build();
    document.getElementById('saveRound')?.addEventListener('click',e=>{if(connected())saveRound(false,e)},true);
    document.getElementById('completeRound')?.addEventListener('click',e=>{if(connected())saveRound(true,e)},true);
    document.body.addEventListener('click',e=>{const id=e.target&&e.target.dataset?e.target.dataset.task:null;if(id&&connected())completeTask(id,e)},true);
    document.getElementById('employeeIncidentForm')?.addEventListener('submit',e=>{if(connected())incidentSubmit(e.currentTarget,e)},true);
    document.getElementById('sosBtn')?.addEventListener('click',e=>{if(connected())sos(e)},true);
    if(connected())render();else setStatus('DEMO MODE','outline');
  }
  window.KennelEmployeeBackend={connected,render};
  document.addEventListener('DOMContentLoaded',init);
})();
