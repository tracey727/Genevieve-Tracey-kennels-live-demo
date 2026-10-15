/* Authenticated Incidents & Audit adapter. */
(function(){
  'use strict';
  let client=null;
  const esc=(x)=>window.GUI&&window.GUI.esc?window.GUI.esc(x==null?'':String(x)):String(x==null?'':x);
  const badge=(label,state)=>window.GUI&&window.GUI.badge?window.GUI.badge(label,state):'<span>'+esc(label)+'</span>';
  const fmt=(x)=>window.GUI&&window.GUI.fmt?window.GUI.fmt(x):esc(x);
  const connected=()=>Boolean(client&&client.hasToken());

  async function load(){
    const [incidents,audit,animals,session]=await Promise.all([client.incidents(),client.audit(),client.animals(),client.session()]);
    return {incidents,audit,animals,session};
  }
  function configureForm(d){
    const form=document.getElementById('incidentForm');if(!form)return;
    const animal=form.querySelector('[name=animalId]');
    if(animal){
      const v=animal.value;
      animal.innerHTML='<option value="">Facility / no animal</option>'+d.animals.map(a=>'<option value="'+esc(a.id)+'">'+esc(a.name)+' · '+esc(a.species)+'</option>').join('');
      if(v)animal.value=v;
    }
    const manager=form.querySelector('[name=managerId]');
    if(manager){
      manager.innerHTML='<option value="'+esc(d.session.subject||'current-user')+'">'+esc(d.session.displayName||d.session.subject||'Authenticated reporter')+' · '+esc(d.session.role||'')+'</option>';
      manager.disabled=true;
      const label=manager.closest('label');
      if(label&&label.firstChild)label.firstChild.textContent='Authenticated reporter';
    }
  }
  function renderData(d){
    const byId=new Map(d.animals.map(a=>[a.id,a]));
    const incidentList=document.getElementById('incidentList');
    if(incidentList)incidentList.innerHTML=d.incidents.map(i=>{
      const a=byId.get(i.animal_id)||{};
      return '<div class="row"><div class="species-icon">⚠</div><div class="row-grow"><b>'+esc(i.type)+(a.name?' — '+esc(a.name):'')+'</b><small>'+esc(i.detail)+' · '+fmt(i.occurred_at)+' · '+esc(i.status)+' · reported by '+esc(i.reported_by)+'</small></div>'+badge(String(i.severity||'').toUpperCase(),i.severity||'outline')+'</div>';
    }).join('')||'<p class="small">No incidents recorded.</p>';

    const auditList=document.getElementById('auditList');
    if(auditList)auditList.innerHTML=d.audit.map(a=>{
      let detail='';try{detail=typeof a.detail==='string'?a.detail:JSON.stringify(a.detail)}catch{detail=''}
      return '<div class="row"><div class="row-grow"><b>'+esc(a.event_type)+'</b><small>'+fmt(a.occurred_at)+' · '+esc(a.actor_subject)+' · '+esc(a.actor_role)+'<br>'+esc(detail)+'</small></div></div>';
    }).join('')||'<p class="small">No audit events.</p>';

    configureForm(d);
    const exportBtn=document.getElementById('exportData'),resetBtn=document.getElementById('resetDemo');
    if(exportBtn){exportBtn.disabled=true;exportBtn.title='Demo export is disabled while authenticated backend data is displayed'}
    if(resetBtn){resetBtn.disabled=true;resetBtn.title='Authenticated backend data cannot be reset from the demo button'}
  }
  async function render(){
    if(!connected())return false;
    try{renderData(await load());return true}
    catch(e){
      if(e&&e.status===401)client.disconnect();
      const incidentList=document.getElementById('incidentList');
      if(incidentList)incidentList.innerHTML='<div class="alert-box red"><h3>Incident backend unavailable</h3><p>'+esc(e&&e.message||'Connection failed')+'</p></div>';
      return false;
    }
  }
  async function submit(form,event){
    if(!connected())return;
    event.preventDefault();event.stopImmediatePropagation();
    const f=new FormData(form);
    try{
      await client.createIncident({
        animal_id:f.get('animalId')||null,
        type:String(f.get('type')||'').trim(),
        severity:String(f.get('severity')||'amber'),
        detail:String(f.get('detail')||'').trim(),
        controls:String(f.get('controls')||'').trim()
      });
      form.reset();
      document.getElementById('incidentModal')?.classList.remove('open');
      window.GUI?.toast('Incident saved securely and audited');
      await render();
    }catch(e){
      if(e&&e.status===401)client.disconnect();
      window.GUI?.toast('Incident was not saved: '+(e&&e.message||'backend error'));
    }
  }
  function init(){
    if(!window.KennelAPI)return;
    client=window.KennelAPI.sharedClient();
    const form=document.getElementById('incidentForm');
    if(form)form.addEventListener('submit',e=>{if(connected())submit(form,e)},true);
    if(connected())render();
  }
  window.KennelIncidentBackend={connected,render};
  document.addEventListener('DOMContentLoaded',init);
})();
