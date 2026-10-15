/* First authenticated screen connection: Staff & WHS.
 * Falls back to the existing synthetic browser demo when disconnected.
 */
(function(){
  'use strict';
  let client=null,panel=null,statusEl=null,input=null;
  const esc=(x)=>window.GUI&&window.GUI.esc?window.GUI.esc(x==null?'':String(x)):String(x==null?'':x);
  const badge=(label,state)=>window.GUI&&window.GUI.badge?window.GUI.badge(label,state):'<span>'+esc(label)+'</span>';

  function connected(){return Boolean(client&&client.hasToken())}
  function setStatus(text,state='outline'){
    if(statusEl)statusEl.innerHTML=badge(text,state);
  }
  function localMessage(){
    setStatus('DEMO STORAGE','outline');
  }
  async function render(){
    if(!client||!client.hasToken()){localMessage();return false}
    const target=document.getElementById('staffList');
    if(!target)return false;
    setStatus('CONNECTING…','amber');
    try{
      const [session,staff]=await Promise.all([client.session(),client.staff()]);
      target.innerHTML=staff.map(x=>'<div class="row"><div class="species-icon">♟</div><div class="row-grow"><b>'+esc(x.name)+'</b><small>'+esc(x.role)+' · '+(x.first_aid?'Human first aid · ':'')+(x.animal_first_aid?'Animal first aid':'')+'</small></div>'+badge(x.on_shift?'ON SHIFT':'OFF SHIFT',x.on_shift?'green':'outline')+'</div>').join('')||'<p class="small">No active staff records.</p>';
      setStatus('AUTHENTICATED · '+String(session.role||'').toUpperCase(),'green');
      return true;
    }catch(e){
      if(e&&e.status===401)client.disconnect();
      setStatus(e&&e.status===401?'SESSION EXPIRED':'BACKEND HOLD','red');
      return false;
    }
  }
  function init(){
    if(!window.KennelAPI)return;
    client=window.KennelAPI.sharedClient();
    const section=document.getElementById('staff');
    if(!section)return;
    panel=document.createElement('div');
    panel.className='card';
    panel.innerHTML='<div class="card-head"><div><p class="eyebrow">Secure backend session</p><h2>Staff API connection</h2><p class="small">Synthetic/testing token only until production onboarding is approved. Token is kept for this browser session only.</p></div><span data-kennel-api-status></span></div><div class="form-grid"><label>Bearer token<input type="password" autocomplete="off" data-kennel-api-token placeholder="Paste synthetic staff token"></label><div style="display:flex;gap:8px;align-items:end"><button type="button" class="btn" data-kennel-api-connect>Connect</button><button type="button" class="btn secondary" data-kennel-api-disconnect>Disconnect</button></div></div>';
    section.insertBefore(panel,section.firstChild);
    statusEl=panel.querySelector('[data-kennel-api-status]');
    input=panel.querySelector('[data-kennel-api-token]');
    panel.querySelector('[data-kennel-api-connect]').addEventListener('click',async()=>{
      const button=panel.querySelector('[data-kennel-api-connect]');
      button.disabled=true;setStatus('VERIFYING…','amber');
      try{
        await client.connect(input.value);
        input.value='';
        await render();
      }catch(e){
        setStatus(e&&e.status===401?'TOKEN REJECTED':'CONNECTION FAILED','red');
      }finally{button.disabled=false}
    });
    panel.querySelector('[data-kennel-api-disconnect]').addEventListener('click',()=>{
      client.disconnect();input.value='';localMessage();
      if(window.GStore&&typeof window.GStore.get==='function'&&typeof window.renderKennelsApp==='function')window.renderKennelsApp();
      else location.reload();
    });
    if(client.hasToken())render();else localMessage();
  }

  window.KennelStaffBackend={connected,render};
  document.addEventListener('DOMContentLoaded',init);
})();
