/* Authenticated Kennels dashboard adapter. */
(function(){
  'use strict';
  let client=null;
  const esc=(x)=>window.GUI&&window.GUI.esc?window.GUI.esc(x==null?'':String(x)):String(x==null?'':x);
  const badge=(label,state)=>window.GUI&&window.GUI.badge?window.GUI.badge(label,state):'<span>'+esc(label)+'</span>';
  const fmt=(x)=>window.GUI&&window.GUI.fmt?window.GUI.fmt(x):esc(x);
  const time=(x)=>window.GUI&&window.GUI.time?window.GUI.time(x):esc(x);
  const connected=()=>Boolean(client&&client.hasToken());

  function statePanel(alerts){
    const open=alerts.filter(a=>a.status==='open');
    const red=open.some(a=>a.severity==='red');
    const amber=open.some(a=>a.severity==='amber'||a.severity==='hold');
    const state=red?'red':amber?'amber':'green';
    const label=red?'RED — URGENT ACTION':amber?'AMBER — CONTROLLED ATTENTION':'GREEN — NORMAL OPERATIONS';
    const reason=red?'A critical authenticated alert requires immediate ownership':amber?'Authenticated alerts require active management':'No open authenticated alerts requiring escalation';
    return '<div class="state-card"><div class="state-icon">'+(red?'!':'✓')+'</div><div><p class="eyebrow">Authenticated facility state</p><h2>'+label+'</h2><p>'+reason+'</p></div><div class="traffic"><div class="light"><span class="bulb g '+(state==='green'?'active':'')+'"></span>GREEN<br>NORMAL</div><div class="light"><span class="bulb a '+(state==='amber'?'active':'')+'"></span>AMBER<br>CAUTION</div><div class="light"><span class="bulb r '+(state==='red'?'active':'')+'"></span>RED<br>EMERGENCY</div></div></div>';
  }
  async function render(){
    if(!connected())return false;
    try{
      const [summary,animals,bookings,rounds,alerts,staff]=await Promise.all([
        client.dashboard(),client.animals(),client.bookings(),client.rounds(),client.alerts(),client.staff()
      ]);
      const byAnimal=new Map(animals.map(a=>[a.id,a])),byStaff=new Map(staff.map(s=>[s.subject,s]));
      const facilityState=document.getElementById('facilityState');if(facilityState)facilityState.innerHTML=statePanel(alerts);
      const stats=document.getElementById('dashboardStats');
      if(stats)stats.innerHTML=[
        ['🐾','Animals in care',summary.animals,'active records'],
        ['♥','Open care tasks',summary.openTasks,'requires ownership'],
        ['⚠','Open incidents',summary.openIncidents,'review status'],
        ['⌂','Active kennels/suites',summary.kennels,'facility spaces'],
        ['▦','Expired stock',summary.expiredStock,summary.expiredStock?'action required':'none detected'],
        ['♟','Staff on duty',staff.filter(x=>x.on_shift).length,'authenticated roster']
      ].map(x=>'<div class="stat"><span class="mini-icon">'+x[0]+'</span><small>'+x[1]+'</small><b>'+esc(x[2])+'</b><small>'+esc(x[3])+'</small></div>').join('');

      const bookingList=document.getElementById('bookingList');
      if(bookingList)bookingList.innerHTML=bookings.slice().sort((a,b)=>new Date(a.due_at)-new Date(b.due_at)).slice(0,8).map(b=>{
        const a=byAnimal.get(b.animal_id)||{};
        return '<div class="row"><div class="species-icon">'+(a.species==='Cat'?'🐈':'🐕')+'</div><div class="row-grow"><b>'+esc(a.name||'Unknown')+' · '+esc(b.booking_type==='drop_off'?'Drop-off':'Pick-up')+'</b><small>'+esc(a.breed||'')+' · '+fmt(b.due_at)+'</small></div>'+badge(String(b.status||'').toUpperCase(),b.status==='completed'?'green':'yellow')+'</div>';
      }).join('')||'<p class="small">No scheduled bookings.</p>';

      const roundList=document.getElementById('roundList');
      if(roundList)roundList.innerHTML=rounds.slice(0,8).map(r=>{
        const st=byStaff.get(r.assigned_subject)||{};
        return '<div class="row"><div class="species-icon">'+(r.status==='completed'?'✓':'◷')+'</div><div class="row-grow"><b>'+esc(r.zone)+'</b><small>'+esc(r.species)+' · '+esc(st.name||r.assigned_subject||'Unassigned')+' · due '+time(r.due_at)+'</small><div class="progress"><span style="width:'+Number(r.progress||0)+'%"></span></div></div>'+badge(String(r.status||'').toUpperCase(),r.status==='completed'?'green':r.status==='in_progress'?'amber':'outline')+'</div>';
      }).join('')||'<p class="small">No active rounds.</p>';

      const alertList=document.getElementById('alertList');
      if(alertList)alertList.innerHTML=alerts.filter(a=>a.status==='open').slice(0,10).map(a=>'<div class="row"><div class="species-icon">'+(a.severity==='red'?'!':'⚠')+'</div><div class="row-grow"><b>'+esc(a.title)+'</b><small>'+esc(a.detail)+' · owner: '+esc(a.owner_subject||'unassigned')+'</small></div>'+badge(String(a.severity||'').toUpperCase(),a.severity||'outline')+'</div>').join('')||'<div class="alert-box green"><h3>All clear</h3><p>No open authenticated alerts.</p></div>';
      return true;
    }catch(e){
      if(e&&e.status===401)client.disconnect();
      const facilityState=document.getElementById('facilityState');
      if(facilityState)facilityState.innerHTML='<div class="alert-box red"><h3>Dashboard backend unavailable</h3><p>'+esc(e&&e.message||'Connection failed')+'</p></div>';
      return false;
    }
  }
  function init(){
    if(!window.KennelAPI)return;
    client=window.KennelAPI.sharedClient();
    if(connected())render();
  }
  window.KennelDashboardBackend={connected,render};
  document.addEventListener('DOMContentLoaded',init);
})();
