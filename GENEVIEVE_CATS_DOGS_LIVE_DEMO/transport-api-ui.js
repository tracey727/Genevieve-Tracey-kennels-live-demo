/* Authenticated driver transport adapter.
 * Driver tokens only receive and update transport jobs assigned to that driver.
 */
(function(){
  'use strict';
  let client=null,panel=null,statusEl=null,input=null,currentJob=null,currentSession=null;
  const checks=[['identity','Animal identity and booking confirmed'],['authority','Owner / collector authority confirmed'],['equipment','Assigned crate or restraint checked and secured'],['separation','Cat and dog separation / individual separation confirmed'],['vehicle','Vehicle safety, ventilation and cleanliness checked'],['water','Water and comfort supplies ready'],['medication','Medication and emergency information travelling with animal'],['loaded','Loading completed without escape or injury'],['transit','Transit welfare and temperature check recorded'],['handover','Arrival identity and custody handover completed'],['sweep','Final no-animal-left-in-vehicle sweep completed']];
  const esc=(x)=>window.GUI&&window.GUI.esc?window.GUI.esc(x==null?'':String(x)):String(x==null?'':x);
  const badge=(label,state)=>window.GUI&&window.GUI.badge?window.GUI.badge(label,state):'<span>'+esc(label)+'</span>';
  const fmt=(x)=>window.GUI&&window.GUI.fmt?window.GUI.fmt(x):esc(x);
  const connected=()=>Boolean(client&&client.hasToken());
  function setStatus(text,state='outline'){if(statusEl)statusEl.innerHTML=badge(text,state)}
  function collect(){const o={};document.querySelectorAll('[data-tcheck]').forEach(x=>o[x.dataset.tcheck]=x.checked);return o}
  async function load(){
    const [session,jobs,animals,alerts]=await Promise.all([client.session(),client.transports(),client.animals(),client.alerts()]);
    if(session.role!=='driver'){client.disconnect();throw Object.assign(new Error('driver token required'),{status:403})}
    return {session,jobs,animals,alerts};
  }
  function renderData(d){
    currentSession=d.session;
    const open=d.alerts.filter(a=>a.status==='open'),red=open.some(a=>a.severity==='red'),amber=open.some(a=>a.severity==='amber'||a.severity==='hold');
    const state=document.getElementById('driverState');
    if(state)state.innerHTML='<div class="mobile-state"><div class="state-icon">'+(red?'!':'✓')+'</div><div><p class="eyebrow">Authenticated facility state</p><h2>'+(red?'RED — URGENT ACTION':amber?'AMBER — CONTROLLED ATTENTION':'GREEN — NORMAL OPERATIONS')+'</h2><p class="small">Transport remains under human driver and manager control. Follow road rules and official emergency directions.</p></div></div>';

    const select=document.getElementById('transportSelect');
    const previous=currentJob&&currentJob.id;
    currentJob=d.jobs.find(j=>j.id===previous)||d.jobs.find(j=>j.status==='in_progress')||d.jobs.find(j=>j.status!=='completed')||d.jobs[0]||null;
    if(select){
      select.innerHTML=d.jobs.map(j=>{const a=d.animals.find(x=>x.id===j.animal_id)||{};return '<option value="'+esc(j.id)+'" '+(currentJob&&j.id===currentJob.id?'selected':'')+'>'+esc(j.direction)+' · '+esc(a.name||'Animal')+' · '+fmt(j.due_at)+'</option>'}).join('');
      select.disabled=d.jobs.length===0;
    }
    const card=document.getElementById('jobCard'),checksEl=document.getElementById('transportChecks');
    if(!currentJob){
      if(card)card.innerHTML='<p>No authenticated transport jobs are assigned to this driver.</p>';
      if(checksEl)checksEl.innerHTML='';
      return;
    }
    const a=d.animals.find(x=>x.id===currentJob.animal_id)||{};
    if(card)card.innerHTML='<div class="row"><div class="species-icon">'+(a.species==='Cat'?'🐈':'🐕')+'</div><div class="row-grow"><h2 style="margin:0">'+esc(currentJob.direction)+' · '+esc(a.name||'Animal')+'</h2><small>'+esc(a.species||'')+' · '+esc(a.breed||'')+' · '+fmt(currentJob.due_at)+'</small></div>'+badge(String(currentJob.status||'').toUpperCase(),currentJob.status==='completed'?'green':'yellow')+'</div><p class="small"><b>Driver:</b> '+esc(d.session.displayName||d.session.subject)+'<br><b>Vehicle:</b> '+esc(currentJob.vehicle||'Not entered')+'<br><b>Equipment:</b> '+esc(currentJob.crate||'Not entered')+'<br><b>Address:</b> '+esc(currentJob.address||'Not entered')+'</p><div class="alert-box"><h3>Animal instructions</h3><p>'+esc(a.handling_notes||a.behaviour_notes||'No special behaviour instruction')+'<br><b>Allergy:</b> '+esc(a.allergies||'None entered')+' · <b>Medication:</b> '+esc(a.medication_plan||'None entered')+'</p></div>';
    if(checksEl)checksEl.innerHTML=checks.map(([k,l])=>'<label class="round-check"><input type="checkbox" data-tcheck="'+k+'" '+(currentJob.checklist&&currentJob.checklist[k]?'checked':'')+'><span class="grow">'+esc(l)+'</span></label>').join('');
    const temp=document.getElementById('vehicleTemp');if(temp)temp.value=currentJob.temperature??'';
    const note=document.getElementById('driverNote');if(note)note.value=currentJob.note||'';
    const strip=document.querySelector('[data-sync-strip]');if(strip)strip.textContent='AUTHENTICATED BACKEND · assigned driver jobs only · session-only credential';
    setStatus('DRIVER VERIFIED','green');
  }
  async function render(){
    if(!connected())return false;
    try{renderData(await load());return true}
    catch(e){setStatus(e&&e.status===401?'TOKEN REJECTED':'DRIVER ACCESS HOLD','red');return false}
  }
  function build(){
    const main=document.querySelector('.mobile-content');if(!main||panel)return;
    panel=document.createElement('section');panel.className='mobile-card';
    panel.innerHTML='<div class="card-head"><div><p class="eyebrow">Secure driver access</p><h2>Driver sign-in</h2></div><span data-driver-api-status></span></div><label>Driver access token<input type="password" autocomplete="off" data-driver-api-token placeholder="Synthetic driver token"></label><div class="button-row"><button type="button" class="btn" data-driver-api-connect>Connect</button><button type="button" class="btn secondary" data-driver-api-disconnect>Disconnect</button></div><p class="small">The backend returns only transport jobs assigned to this authenticated driver.</p>';
    main.insertBefore(panel,main.firstChild);
    statusEl=panel.querySelector('[data-driver-api-status]');input=panel.querySelector('[data-driver-api-token]');
    panel.querySelector('[data-driver-api-connect]').addEventListener('click',async()=>{
      const btn=panel.querySelector('[data-driver-api-connect]');btn.disabled=true;setStatus('VERIFYING…','amber');
      try{
        const s=await client.connect(input.value);
        if(s.role!=='driver'){client.disconnect();throw Object.assign(new Error('driver token required'),{status:403})}
        input.value='';await render();
      }catch(e){setStatus(e&&e.status===401?'TOKEN REJECTED':'DRIVER TOKEN REQUIRED','red')}
      finally{btn.disabled=false}
    });
    panel.querySelector('[data-driver-api-disconnect]').addEventListener('click',()=>{client.disconnect();location.reload()});
  }
  async function save(done,event){
    if(!connected()||!currentJob)return;
    event.preventDefault();event.stopImmediatePropagation();
    const tempEl=document.getElementById('vehicleTemp'),noteEl=document.getElementById('driverNote');
    const raw=tempEl?tempEl.value:'',temp=Number(raw),list=collect(),note=noteEl?noteEl.value.trim():'';
    if(raw===''||!Number.isFinite(temp)||temp<5||temp>40){window.GUI?.toast('Record a realistic vehicle temperature before saving');return}
    if(done&&Object.values(list).some(v=>!v)){window.GUI?.toast('Complete every transport and handover check before closing the job');return}
    try{
      await client.updateTransport(currentJob.id,{status:done?'completed':'in_progress',temperature:temp,checklist:list,note:note||null});
      window.GUI?.toast(done?'Transport handover completed and audited':'Transport progress saved securely');await render();
    }catch(e){if(e&&e.status===401)client.disconnect();window.GUI?.toast('Transport was not updated: '+(e&&e.message||'backend error'))}
  }
  function init(){
    if(!window.KennelAPI)return;
    client=window.KennelAPI.sharedClient();build();
    document.getElementById('transportSelect')?.addEventListener('change',e=>{if(connected()){currentJob={id:e.target.value};render()}},true);
    document.getElementById('saveTransport')?.addEventListener('click',e=>{if(connected())save(false,e)},true);
    document.getElementById('completeTransport')?.addEventListener('click',e=>{if(connected())save(true,e)},true);
    if(connected())render();else setStatus('DEMO MODE','outline');
  }
  window.KennelDriverBackend={connected,render};
  document.addEventListener('DOMContentLoaded',init);
})();
