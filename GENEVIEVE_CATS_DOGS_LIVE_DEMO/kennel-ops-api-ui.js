/* Authenticated manager views for rounds and transport. */
(function(){
  'use strict';
  let client=null;
  const esc=(x)=>window.GUI&&window.GUI.esc?window.GUI.esc(x==null?'':String(x)):String(x==null?'':x);
  const badge=(label,state)=>window.GUI&&window.GUI.badge?window.GUI.badge(label,state):'<span>'+esc(label)+'</span>';
  const fmt=(x)=>window.GUI&&window.GUI.fmt?window.GUI.fmt(x):esc(x);
  const connected=()=>Boolean(client&&client.hasToken());

  async function renderRounds(){
    if(!connected())return false;
    const target=document.getElementById('roundTable');if(!target)return false;
    try{
      const [rounds,staff]=await Promise.all([client.rounds(),client.staff()]);
      const bySubject=new Map(staff.map(s=>[s.subject,s]));
      target.innerHTML='<div class="table-wrap"><table><thead><tr><th>Zone</th><th>Species</th><th>Employee</th><th>Due</th><th>Progress</th><th>Status</th></tr></thead><tbody>'+
        rounds.map(r=>'<tr><td>'+esc(r.zone)+'</td><td>'+esc(r.species)+'</td><td>'+esc((bySubject.get(r.assigned_subject)||{}).name||r.assigned_subject||'Unassigned')+'</td><td>'+fmt(r.due_at)+'</td><td><div class="progress"><span style="width:'+Number(r.progress||0)+'%"></span></div><small>'+Number(r.progress||0)+'%</small></td><td>'+badge(String(r.status||'').toUpperCase(),r.status==='completed'?'green':r.status==='in_progress'?'amber':'outline')+'</td></tr>').join('')+
        '</tbody></table></div>';
      return true;
    }catch(e){
      if(e&&e.status===401)client.disconnect();
      target.innerHTML='<div class="alert-box red"><h3>Rounds backend unavailable</h3><p>'+esc(e&&e.message||'Connection failed')+'</p></div>';
      return false;
    }
  }

  async function renderTransport(){
    if(!connected())return false;
    const target=document.getElementById('transportList');if(!target)return false;
    try{
      const [jobs,animals,staff]=await Promise.all([client.transports(),client.animals(),client.staff()]);
      const byAnimal=new Map(animals.map(a=>[a.id,a])),bySubject=new Map(staff.map(s=>[s.subject,s]));
      target.innerHTML=jobs.map(t=>{
        const a=byAnimal.get(t.animal_id)||{},d=bySubject.get(t.driver_subject)||{};
        return '<div class="row"><div class="species-icon">'+(a.species==='Cat'?'🐈':'🐕')+'</div><div class="row-grow"><b>'+esc(t.direction)+' — '+esc(a.name||'Unknown')+'</b><small>'+fmt(t.due_at)+' · '+esc(d.name||t.driver_subject||'Unassigned')+' · '+esc(t.vehicle||'')+' · '+esc(t.crate||'')+'</small></div>'+badge(String(t.status||'').toUpperCase(),t.status==='completed'?'green':'yellow')+'</div>';
      }).join('')||'<p class="small">No transport jobs.</p>';
      return true;
    }catch(e){
      if(e&&e.status===401)client.disconnect();
      target.innerHTML='<div class="alert-box red"><h3>Transport backend unavailable</h3><p>'+esc(e&&e.message||'Connection failed')+'</p></div>';
      return false;
    }
  }
  function init(){
    if(!window.KennelAPI)return;
    client=window.KennelAPI.sharedClient();
    if(connected()){renderRounds();renderTransport()}
  }
  window.KennelOpsBackend={connected,renderRounds,renderTransport};
  document.addEventListener('DOMContentLoaded',init);
})();
