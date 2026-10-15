/* Authenticated Drop-off / Pick-up custody adapter. */
(function(){
  'use strict';
  let client=null;
  const esc=(x)=>window.GUI&&window.GUI.esc?window.GUI.esc(x==null?'':String(x)):String(x==null?'':x);
  const fmt=(x)=>window.GUI&&window.GUI.fmt?window.GUI.fmt(x):esc(x);
  const connected=()=>Boolean(client&&client.hasToken());

  async function data(){
    const [animals,custody,session]=await Promise.all([client.animals(),client.custody(),client.session()]);
    return {animals,custody,session};
  }
  function configureForms(d){
    const options=d.animals.map(a=>'<option value="'+esc(a.id)+'">'+esc(a.name)+' · '+esc(a.species)+'</option>').join('');
    for(const formId of ['dropoffForm','pickupForm']){
      const form=document.getElementById(formId);if(!form)continue;
      const animal=form.querySelector('[name=animalId]');
      if(animal){const v=animal.value;animal.innerHTML=options;if(v)animal.value=v}
      const staff=form.querySelector('[name=staffId]');
      if(staff){
        staff.innerHTML='<option value="'+esc(d.session.subject||'current-user')+'">'+esc(d.session.displayName||d.session.subject||'Authenticated staff')+' · '+esc(d.session.role||'')+'</option>';
        staff.disabled=true;
        staff.title='Authenticated operator is recorded by the backend';
      }
    }
  }
  function renderLog(d){
    const target=document.getElementById('custodyLog');if(!target)return;
    const byId=new Map(d.animals.map(a=>[a.id,a]));
    target.innerHTML=d.custody.length?'<div class="table-wrap"><table><thead><tr><th>Time</th><th>Employee</th><th>Movement</th><th>Animal</th><th>Condition</th></tr></thead><tbody>'+
      d.custody.map(x=>{const a=byId.get(x.animal_id)||{};return '<tr><td>'+fmt(x.occurred_at)+'</td><td>'+esc(x.staff_subject)+'</td><td>'+esc(x.direction==='drop_off'?'Drop-off':'Pick-up')+'</td><td>'+esc(a.name||'Unknown')+'</td><td>'+esc(x.condition_note||'')+'</td></tr>'}).join('')+
      '</tbody></table></div>':'<p class="small">No authenticated custody records yet.</p>';
  }
  async function render(){
    if(!connected())return false;
    try{const d=await data();configureForms(d);renderLog(d);return true}
    catch(e){
      if(e&&e.status===401)client.disconnect();
      const target=document.getElementById('custodyLog');
      if(target)target.innerHTML='<div class="alert-box red"><h3>Custody backend unavailable</h3><p>'+esc(e&&e.message||'Connection failed')+'</p></div>';
      return false;
    }
  }
  async function submit(form,event,direction){
    if(!connected())return;
    event.preventDefault();event.stopImmediatePropagation();
    const f=new FormData(form);
    const isDrop=direction==='drop_off';
    if(isDrop&&String(f.get('identity')||'').startsWith('No')){
      window.GUI?.toast('Custody not accepted: identity must be confirmed');return;
    }
    const body={
      animal_id:f.get('animalId'),
      direction,
      condition_note:String(f.get('condition')||'').trim(),
      identity_status:isDrop?String(f.get('identity')||'').trim():'Confirmed',
      authority_detail:isDrop?null:('Collector: '+String(f.get('collector')||'').trim()+'; authority: '+String(f.get('authority')||'').trim()),
      vaccination_status:isDrop?String(f.get('vaccination')||'').trim():null,
      medication_detail:isDrop?String(f.get('medicationCount')||'').trim():String(f.get('medicationReturn')||'').trim(),
      belongings:String(f.get('belongings')||'').trim()||null
    };
    try{
      await client.createCustody(body);
      form.reset();
      window.GUI?.toast(direction==='drop_off'?'Drop-off custody recorded securely':'Pick-up custody recorded securely');
      await render();
    }catch(e){
      if(e&&e.status===401)client.disconnect();
      window.GUI?.toast('Custody was not recorded: '+(e&&e.message||'backend error'));
    }
  }
  function init(){
    if(!window.KennelAPI)return;
    client=window.KennelAPI.sharedClient();
    const drop=document.getElementById('dropoffForm');
    const pick=document.getElementById('pickupForm');
    if(drop)drop.addEventListener('submit',e=>{if(connected())submit(drop,e,'drop_off')},true);
    if(pick)pick.addEventListener('submit',e=>{if(connected())submit(pick,e,'pick_up')},true);
    if(connected())render();
  }
  window.KennelCustodyBackend={connected,render};
  document.addEventListener('DOMContentLoaded',init);
})();
