/* Authenticated Emergency Command adapter.
 * Records human decisions only. It does not dispatch responders, order evacuation,
 * override official warnings or make animal-care decisions.
 */
(function(){
  'use strict';
  let client=null,current=null;
  const esc=(x)=>window.GUI&&window.GUI.esc?window.GUI.esc(x==null?'':String(x)):String(x==null?'':x);
  const badge=(label,state)=>window.GUI&&window.GUI.badge?window.GUI.badge(label,state):'<span>'+esc(label)+'</span>';
  const fmt=(x)=>window.GUI&&window.GUI.fmt?window.GUI.fmt(x):esc(x);
  const connected=()=>Boolean(client&&client.hasToken());
  const steps=[
    'Follow 000 and current official emergency directions where required',
    'Manager confirms staff roles and human decision owner',
    'Complete animal register headcount',
    'Prepare species-appropriate leads, carriers, medication and identification',
    'Prioritise animals with documented welfare or mobility needs',
    'Confirm staff and visitor headcount',
    'Record owner, veterinarian and emergency communications',
    'Preserve incident evidence where safe and lawful'
  ];

  async function render(){
    if(!connected())return false;
    try{
      const [state,animals]=await Promise.all([client.emergency(),client.animals()]);
      current=state;
      const status=document.getElementById('emergencyStatus');
      if(status)status.innerHTML=badge(state.active?'ACTIVE — '+esc(state.type||'Emergency'):'READY',state.active?'red':'green');
      const head=document.getElementById('headcountTable');
      if(head)head.innerHTML='<div class="table-wrap"><table><thead><tr><th>Animal</th><th>Species</th><th>Vaccination</th><th>Priority information</th></tr></thead><tbody>'+
        animals.map(a=>'<tr><td>'+esc(a.name)+'</td><td>'+esc(a.species)+'</td><td>'+esc(a.vaccination_status||'Not entered')+'</td><td>'+esc([a.medication_plan?'Medication plan':'',a.heat_risk?'Heat risk':'',a.escape_risk?'Escape risk':'',a.handling_notes||a.behaviour_notes||''].filter(Boolean).join(' · '))+'</td></tr>').join('')+
        '</tbody></table></div>';
      const plan=document.getElementById('emergencyPlan');
      if(plan){
        if(state.active){
          const checks=state.checks||{};
          plan.innerHTML='<div class="alert-box red"><h3>'+esc(state.type)+' — RECORDED ACTIVE</h3><p>Owner: '+esc(state.owner_subject||'Authenticated staff')+' · started '+fmt(state.started_at)+'</p><p><b>Recording only:</b> follow official emergency directions and human command. GENEVIEVE does not dispatch responders or issue an all-clear.</p></div><div class="round-checks" style="margin-top:10px">'+
            steps.map((x,i)=>'<label class="round-check"><input type="checkbox" data-emergency-check="'+i+'" '+(checks[i]?'checked':'')+'><span class="grow">'+esc(x)+'</span></label>').join('')+
            '</div>';
        }else{
          plan.innerHTML='<div class="alert-box green"><h3>No authenticated emergency active</h3><p>Scenario buttons record a human-initiated emergency state and audit event only.</p></div>';
        }
      }
      return true;
    }catch(e){
      if(e&&e.status===401)client.disconnect();
      const plan=document.getElementById('emergencyPlan');
      if(plan)plan.innerHTML='<div class="alert-box red"><h3>Emergency record backend unavailable</h3><p>'+esc(e&&e.message||'Connection failed')+'</p></div>';
      return false;
    }
  }
  async function action(body,msg){
    try{await client.emergencyAction(body);window.GUI?.toast(msg);await render()}
    catch(e){if(e&&e.status===401)client.disconnect();window.GUI?.toast('Emergency record was not updated: '+(e&&e.message||'backend error'))}
  }
  function init(){
    if(!window.KennelAPI)return;
    client=window.KennelAPI.sharedClient();
    document.body.addEventListener('click',e=>{
      if(!connected())return;
      const scenario=e.target&&e.target.dataset?e.target.dataset.emergency:null;
      if(scenario){
        e.preventDefault();e.stopImmediatePropagation();
        action({action:'activate',type:scenario},'Emergency state recorded and audited');
        return;
      }
      if(e.target&&e.target.id==='standDownEmergency'){
        e.preventDefault();e.stopImmediatePropagation();
        if(!current||!current.active){window.GUI?.toast('No authenticated emergency is active');return}
        action({action:'stand_down'},'Emergency stand-down recorded and audited');
      }
    },true);
    document.body.addEventListener('change',e=>{
      if(!connected()||!current||!current.active||!e.target||e.target.dataset.emergencyCheck===undefined)return;
      e.preventDefault();e.stopImmediatePropagation();
      const checks={...(current.checks||{})};
      checks[e.target.dataset.emergencyCheck]=Boolean(e.target.checked);
      action({action:'check',checks},'Emergency checklist evidence updated');
    },true);
    if(connected())render();
  }
  window.KennelEmergencyBackend={connected,render};
  document.addEventListener('DOMContentLoaded',init);
})();
