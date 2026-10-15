/* Authenticated Care & Health screen adapter. */
(function(){
  'use strict';
  let client=null;
  const esc=(x)=>window.GUI&&window.GUI.esc?window.GUI.esc(x==null?'':String(x)):String(x==null?'':x);
  const badge=(label,state)=>window.GUI&&window.GUI.badge?window.GUI.badge(label,state):'<span>'+esc(label)+'</span>';
  const fmt=(x)=>window.GUI&&window.GUI.fmt?window.GUI.fmt(x):esc(x);
  const connected=()=>Boolean(client&&client.hasToken());

  async function load(){
    const [animals,tasks,staff]=await Promise.all([client.animals(),client.tasks(),client.staff()]);
    return {animals,tasks,staff};
  }
  function fillForm(data){
    const form=document.getElementById('careForm');if(!form)return;
    const a=form.querySelector('[name=animalId]');
    const st=form.querySelector('[name=assignedTo]');
    if(a){
      const v=a.value;
      a.innerHTML=data.animals.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name)+' · '+esc(x.species)+'</option>').join('');
      if(v)a.value=v;
    }
    if(st){
      const v=st.value;
      st.innerHTML=data.staff.filter(x=>x.on_shift).map(x=>'<option value="'+esc(x.subject)+'">'+esc(x.name)+' · '+esc(x.role)+'</option>').join('');
      if(v)st.value=v;
    }
  }
  function renderData(data){
    const animals=new Map(data.animals.map(a=>[a.id,a]));
    const staff=new Map(data.staff.map(s=>[s.subject,s]));
    const list=document.getElementById('taskList');
    if(list)list.innerHTML=data.tasks.map(t=>{
      const a=animals.get(t.animal_id)||{},st=staff.get(t.assigned_subject)||{};
      const done=t.status==='completed';
      return '<div class="row"><div class="species-icon">'+(a.species==='Cat'?'🐈':a.species==='Dog'?'🐕':'⌂')+'</div><div class="row-grow"><b>'+esc(t.type)+(a.name?' — '+esc(a.name):'')+'</b><small>'+esc(t.detail||'')+' · '+fmt(t.due_at)+' · '+esc(st.name||t.assigned_subject||'Unassigned')+'</small></div>'+badge(String(t.status||'').toUpperCase(),done?'green':t.severity||'outline')+(done?'':'<button class="btn sm secondary" data-complete-task="'+esc(t.id)+'">Complete</button>')+'</div>';
    }).join('')||'<p class="small">No care tasks.</p>';

    const health=document.getElementById('healthTable');
    if(health)health.innerHTML='<div class="table-wrap"><table><thead><tr><th>Animal</th><th>Species</th><th>Medication</th><th>Diet / allergy</th><th>Behaviour / handling</th></tr></thead><tbody>'+
      data.animals.map(a=>'<tr><td>'+esc(a.name)+'</td><td>'+esc(a.species)+'</td><td>'+esc(a.medication_plan||'None')+'</td><td>'+esc(a.diet||'')+'<br><small>'+esc(a.allergies||'')+'</small></td><td>'+esc(a.behaviour_notes||a.handling_notes||'')+'</td></tr>').join('')+
      '</tbody></table></div>';
    fillForm(data);
  }
  async function render(){
    if(!connected())return false;
    try{renderData(await load());return true}
    catch(e){
      if(e&&e.status===401)client.disconnect();
      const list=document.getElementById('taskList');
      if(list)list.innerHTML='<div class="alert-box red"><h3>Care backend unavailable</h3><p>'+esc(e&&e.message||'Connection failed')+'</p></div>';
      return false;
    }
  }
  async function submit(form,event){
    if(!connected())return;
    event.preventDefault();event.stopImmediatePropagation();
    const f=new FormData(form);
    const due=new Date(String(f.get('due')||''));
    if(!Number.isFinite(due.getTime())){window.GUI?.toast('Enter a valid due date and time');return}
    try{
      await client.createTask({
        animal_id:f.get('animalId')||null,
        type:String(f.get('type')||'').trim(),
        detail:String(f.get('detail')||'').trim(),
        due_at:due.toISOString(),
        severity:String(f.get('severity')||'green'),
        assigned_subject:f.get('assignedTo')||null
      });
      form.reset();window.GUI?.toast('Care task saved securely');await render();
    }catch(e){
      if(e&&e.status===401)client.disconnect();
      window.GUI?.toast('Care task was not saved: '+(e&&e.message||'backend error'));
    }
  }
  async function complete(id,event){
    if(!connected())return;
    event.preventDefault();event.stopImmediatePropagation();
    try{await client.updateTask(id,{status:'completed'});window.GUI?.toast('Care task completed and audited');await render()}
    catch(e){if(e&&e.status===401)client.disconnect();window.GUI?.toast('Task was not updated: '+(e&&e.message||'backend error'))}
  }
  function init(){
    if(!window.KennelAPI)return;
    client=window.KennelAPI.sharedClient();
    const form=document.getElementById('careForm');
    if(form)form.addEventListener('submit',e=>{if(connected())submit(form,e)},true);
    document.body.addEventListener('click',e=>{const id=e.target&&e.target.dataset?e.target.dataset.completeTask:null;if(id&&connected())complete(id,e)},true);
    if(connected())render();
  }
  window.KennelCareBackend={connected,render};
  document.addEventListener('DOMContentLoaded',init);
})();
