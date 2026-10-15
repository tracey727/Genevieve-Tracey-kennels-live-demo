/* Authenticated Kennels & Suites manager view. */
(function(){
  'use strict';
  let client=null;
  const esc=(x)=>window.GUI&&window.GUI.esc?window.GUI.esc(x==null?'':String(x)):String(x==null?'':x);
  const badge=(label,state)=>window.GUI&&window.GUI.badge?window.GUI.badge(label,state):'<span>'+esc(label)+'</span>';
  const connected=()=>Boolean(client&&client.hasToken());
  async function render(){
    if(!connected())return false;
    const target=document.getElementById('roomCards');if(!target)return false;
    try{
      const [rooms,animals]=await Promise.all([client.kennels(),client.animals()]);
      const byId=new Map(animals.map(a=>[a.id,a]));
      target.innerHTML=rooms.map(r=>{
        const a=byId.get(r.occupied_animal_id)||{};
        return '<article class="card"><div class="card-head"><h2>'+esc(r.name)+'</h2>'+badge(String(r.state||'').toUpperCase(),r.state||'outline')+'</div><p class="small">'+esc(r.species)+' · '+esc(r.type||'')+'</p><div class="grid two small"><p><b>Occupant</b><br>'+esc(a.name||'Available')+'</p><p><b>Gate / door</b><br>'+esc(r.gate_status||'Not entered')+'</p><p><b>Temperature</b><br>'+esc(r.temperature==null?'Not entered':r.temperature+'°C')+'</p><p><b>Humidity</b><br>'+esc(r.humidity==null?'Not entered':r.humidity+'%')+'</p></div>'+(r.state!=='green'?'<div class="alert-box"><h3>Control required</h3><p>Read authenticated room and animal instructions before entry or transfer.</p></div>':'')+'</article>';
      }).join('')||'<p class="small">No active kennel or suite records.</p>';
      return true;
    }catch(e){
      if(e&&e.status===401)client.disconnect();
      target.innerHTML='<div class="alert-box red"><h3>Kennel-room backend unavailable</h3><p>'+esc(e&&e.message||'Connection failed')+'</p></div>';
      return false;
    }
  }
  function init(){
    if(!window.KennelAPI)return;
    client=window.KennelAPI.sharedClient();
    if(connected())render();
  }
  window.KennelRoomsBackend={connected,render};
  document.addEventListener('DOMContentLoaded',init);
})();
