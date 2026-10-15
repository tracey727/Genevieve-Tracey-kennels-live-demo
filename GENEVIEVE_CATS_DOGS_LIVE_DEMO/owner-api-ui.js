/* Authenticated owner portal adapter.
 * Owner tokens are server-scoped to one animal.
 */
(function(){
  'use strict';
  let client=null,panel=null,statusEl=null,input=null;
  const esc=(x)=>window.GUI&&window.GUI.esc?window.GUI.esc(x==null?'':String(x)):String(x==null?'':x);
  const badge=(label,state)=>window.GUI&&window.GUI.badge?window.GUI.badge(label,state):'<span>'+esc(label)+'</span>';
  const fmt=(x)=>window.GUI&&window.GUI.fmt?window.GUI.fmt(x):esc(x);
  const connected=()=>Boolean(client&&client.hasToken());
  function setStatus(text,state='outline'){if(statusEl)statusEl.innerHTML=badge(text,state)}
  function renderPickupRequests(data){
    const pickup=document.getElementById('pickupPeople');if(!pickup)return;
    pickup.textContent='Existing authority details are not exposed here. Requests below are review records only; even an approved request does not release the animal.';
    let holder=document.getElementById('ownerPickupRequestStatus');
    if(!holder){
      holder=document.createElement('div');holder.id='ownerPickupRequestStatus';holder.className='list';
      pickup.insertAdjacentElement('afterend',holder);
    }
    const rows=data.pickup_requests||[];
    holder.innerHTML=rows.map(r=>{
      const state=r.status==='approved'?'green':r.status==='declined'?'red':r.status==='pending'?'amber':'outline';
      return '<div class="row"><div class="species-icon">⇧</div><div class="row-grow"><b>'+esc(r.collector)+'</b><small>'+fmt(r.created_at)+' · '+esc(r.note||'No note')+'<br>'+(r.status==='approved'?'Authority request approved for staff use; physical pickup still requires identity and custody-release checks.':r.status==='declined'?'Authority request declined.':'Waiting for manager/reception review.')+'</small></div>'+badge(String(r.status||'').toUpperCase(),state)+'</div>';
    }).join('')||'<p class="small">No pickup-authority change requests yet.</p>';
  }
  async function render(){
    if(!connected())return false;
    try{
      const session=await client.session();
      if(session.role!=='owner'){client.disconnect();throw Object.assign(new Error('owner token required'),{status:403})}
      const data=await client.ownerMe(),a=data.animal||{};
      const select=document.getElementById('ownerAnimal');
      if(select){select.innerHTML='<option value="'+esc(a.id||'')+'">'+esc(a.name||'Animal')+' · '+esc(a.species||'')+'</option>';select.disabled=true}
      const profile=document.getElementById('ownerProfile');
      if(profile)profile.innerHTML='<section class="mobile-card"><div class="row"><div class="species-icon">'+(a.species==='Cat'?'🐈':'🐕')+'</div><div class="row-grow"><p class="eyebrow">Verified owner view</p><h2 style="margin:0">'+esc(a.name||'Animal')+'</h2><small>'+esc(a.species||'')+' · '+esc(a.breed||'')+'</small></div>'+badge('PRIVATE','green')+'</div><div class="grid two small"><p><b>Vaccination</b><br>'+esc(a.vaccination_status||'Not entered')+'</p><p><b>Diet</b><br>'+esc(a.diet||'Not entered')+'</p><p><b>Medication</b><br>'+esc(a.medication_plan||'None entered')+'</p><p><b>Care note</b><br>'+esc(a.behaviour_notes||'No approved note')+'</p></div></section>';
      const updates=document.getElementById('ownerUpdates');
      if(updates)updates.innerHTML=(data.updates||[]).map(u=>'<div class="row"><div class="species-icon">♥</div><div class="row-grow"><b>'+fmt(u.created_at)+'</b><small>'+esc(u.message)+'</small></div></div>').join('')||'<p class="small">No approved updates yet.</p>';
      renderPickupRequests(data);
      setStatus('OWNER VERIFIED','green');
      return true;
    }catch(e){
      setStatus(e&&e.status===401?'TOKEN REJECTED':'OWNER ACCESS HOLD','red');
      return false;
    }
  }
  function build(){
    const main=document.querySelector('.mobile-content');if(!main||panel)return;
    panel=document.createElement('section');panel.className='mobile-card';
    panel.innerHTML='<div class="card-head"><div><p class="eyebrow">Secure owner access</p><h2>Owner sign-in</h2></div><span data-owner-api-status></span></div><label>Owner access token<input type="password" autocomplete="off" data-owner-api-token placeholder="Synthetic owner token"></label><div class="button-row"><button type="button" class="btn" data-owner-api-connect>Connect</button><button type="button" class="btn secondary" data-owner-api-disconnect>Disconnect</button></div><p class="small">Token is kept only for this browser session. Production onboarding still requires approved identity-verification workflow.</p>';
    main.insertBefore(panel,main.firstChild);
    statusEl=panel.querySelector('[data-owner-api-status]');input=panel.querySelector('[data-owner-api-token]');
    panel.querySelector('[data-owner-api-connect]').addEventListener('click',async()=>{
      const btn=panel.querySelector('[data-owner-api-connect]');btn.disabled=true;setStatus('VERIFYING…','amber');
      try{
        const s=await client.connect(input.value);
        if(s.role!=='owner'){client.disconnect();throw Object.assign(new Error('owner token required'),{status:403})}
        input.value='';await render();
      }catch(e){setStatus(e&&e.status===401?'TOKEN REJECTED':'OWNER TOKEN REQUIRED','red')}
      finally{btn.disabled=false}
    });
    panel.querySelector('[data-owner-api-disconnect]').addEventListener('click',()=>{client.disconnect();location.reload()});
  }
  async function pickupSubmit(form,event){
    if(!connected())return;
    event.preventDefault();event.stopImmediatePropagation();
    const f=new FormData(form);
    try{
      await client.ownerPickupRequest({collector:String(f.get('collector')||'').trim(),note:String(f.get('note')||'').trim()||null});
      form.reset();window.GUI?.toast('Pickup authority request sent securely for staff review. This is not a release authorisation.');
      await render();
    }catch(e){
      if(e&&e.status===401)client.disconnect();
      window.GUI?.toast('Request was not sent: '+(e&&e.message||'backend error'));
    }
  }
  function init(){
    if(!window.KennelAPI)return;
    client=window.KennelAPI.sharedClient();build();
    const form=document.getElementById('pickupRequest');
    if(form)form.addEventListener('submit',e=>{if(connected())pickupSubmit(form,e)},true);
    if(connected())render();else setStatus('DEMO MODE','outline');
  }
  window.KennelOwnerBackend={connected,render};
  document.addEventListener('DOMContentLoaded',init);
})();
