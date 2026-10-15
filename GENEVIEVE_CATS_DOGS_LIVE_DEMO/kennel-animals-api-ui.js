/* Authenticated Animals screen adapter.
 * Reads and creates animals only inside the signed-in kennel facility.
 * Existing browser demo remains available while disconnected.
 */
(function(){
  'use strict';
  let client=null;
  const esc=(x)=>window.GUI&&window.GUI.esc?window.GUI.esc(x==null?'':String(x)):String(x==null?'':x);
  const badge=(label,state)=>window.GUI&&window.GUI.badge?window.GUI.badge(label,state):'<span>'+esc(label)+'</span>';
  const connected=()=>Boolean(client&&client.hasToken());

  function lightFor(a){
    const status=String(a.vaccination_status||'').toLowerCase();
    if(status==='current')return 'green';
    if(status.includes('expired'))return 'red';
    return 'amber';
  }
  function animalCard(a){
    const light=lightFor(a);
    return '<article class="card watermark"><div class="row"><div class="species-icon">'+(a.species==='Cat'?'🐈':'🐕')+'</div><div class="row-grow"><h2 style="margin:0">'+esc(a.name)+'</h2><small>'+esc(a.species)+' · '+esc(a.breed||'')+' · '+esc(a.sex||'')+'</small></div>'+badge(light.toUpperCase(),light)+'</div><div class="grid two small"><p><b>Owner:</b><br>'+esc(a.owner_name||'Not entered')+'</p><p><b>Vaccination:</b><br>'+esc(a.vaccination_status||'Not entered')+'</p><p><b>Allergies:</b><br>'+esc(a.allergies||'None entered')+'</p><p><b>Diet:</b><br>'+esc(a.diet||'Not entered')+'</p><p><b>Medication:</b><br>'+esc(a.medication_plan||'None entered')+'</p><p><b>Handling:</b><br>'+esc(a.handling_notes||a.behaviour_notes||'No special instruction entered')+'</p></div></article>';
  }
  async function render(){
    if(!connected())return false;
    const intake=document.getElementById('intakeForm');
    const save=intake&&intake.querySelector('button[type="submit"]');
    if(save)save.textContent='Save animal securely';
    const target=document.getElementById('animalCards');
    if(!target)return false;
    try{
      const animals=await client.animals();
      target.innerHTML=animals.map(animalCard).join('')||'<p class="small">No active animals for this facility.</p>';
      return true;
    }catch(e){
      if(e&&e.status===401)client.disconnect();
      target.innerHTML='<div class="alert-box red"><h3>Animals backend unavailable</h3><p>'+esc(e&&e.message||'Connection failed')+'</p></div>';
      return false;
    }
  }
  async function submitAuthenticated(form,event){
    if(!connected())return false;
    event.preventDefault();
    event.stopImmediatePropagation();
    const f=new FormData(form);
    const body={
      name:String(f.get('name')||'').trim(),
      species:String(f.get('species')||'').trim(),
      breed:String(f.get('breed')||'').trim()||null,
      sex:String(f.get('sex')||'').trim()||null,
      owner_name:String(f.get('owner')||'').trim()||null,
      vaccination_status:String(f.get('vaccination')||'').trim()||null,
      diet:String(f.get('diet')||'').trim()||null,
      medication_plan:String(f.get('medication')||'').trim()||null,
      allergies:String(f.get('allergies')||'').trim()||null,
      behaviour_notes:String(f.get('behaviour')||'').trim()||null,
      handling_notes:String(f.get('behaviour')||'').trim()||null
    };
    try{
      await client.createAnimal(body);
      form.reset();
      document.getElementById('intakeModal')?.classList.remove('open');
      if(window.GUI&&window.GUI.toast)window.GUI.toast('Animal saved securely. Booking connection is the next screen.');
      await render();
    }catch(e){
      if(e&&e.status===401)client.disconnect();
      if(window.GUI&&window.GUI.toast)window.GUI.toast('Animal was not saved: '+(e&&e.message||'backend error'));
    }
    return true;
  }
  function init(){
    if(!window.KennelAPI)return;
    client=window.KennelAPI.sharedClient();
    const form=document.getElementById('intakeForm');
    if(form)form.addEventListener('submit',e=>{if(connected())submitAuthenticated(form,e)},true);
    if(connected())render();
  }
  window.KennelAnimalsBackend={connected,render};
  document.addEventListener('DOMContentLoaded',init);
})();
