(function(){
  'use strict';
  const q=(s)=>document.querySelector(s);
  const esc=(v)=>window.GUI&&GUI.esc?GUI.esc(v):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const badge=(t,c)=>window.GUI&&GUI.badge?GUI.badge(t,c):'<span class="badge '+c+'">'+esc(t)+'</span>';
  const now=()=>new Date();
  const iso=()=>new Date().toISOString();
  const dayKey=()=>new Date().toISOString().slice(0,10);
  const DAY=86400000;

  const OPS={
    Morning:['Staff sign-on and role check','Animal headcount against register','Fresh water check','Food and allergy check','Medication fridge temperature','Morning care and medication rounds','Gate, fence and yard inspection','Weather and emergency readiness check'],
    Midday:['Water, heat and stress checks','Play / placement compatibility review','Cleaning and waste removal','Midday medication / physio','Noise and stress monitoring','Staff breaks and fatigue check','Owner updates due today'],
    Evening:['Evening animal headcount','Evening feeds, medication and toileting','Locks, gates and lights check','Cleaning, laundry and waste complete','Medication fridge temperature','Overnight heat / storm plan','Emergency kit and written handover']
  };
  const FILES=['Council / premises approvals','Animal welfare policy and Five Domains checks','Owner boarding / treatment authorities','Vaccination evidence','Medication authorities and administration records','Feeding, allergy and physio plans','Behaviour and placement decisions','Isolation / illness records','Vet and after-hours arrangements','WHS risk assessments and controls','Staff training / first aid / induction','Psychosocial, lone-worker and break controls','Incident and near-miss records','Workers compensation and insurance evidence','Cleaning schedules and chemical SDS','Maintenance, gate and fence checks','Stock and expiry records','Emergency drills and evacuation records','Shift rotation, overtime and duty fairness records','Privacy and owner-data handling statement'];

  function ensure(){
    const s=GStore.get();
    if(s.safety)return;
    GStore.update(st=>{st.safety={
      day:dayKey(),ops:{},breaks:[],shiftHistory:[],duties:[],physio:[],compliance:{},
      loneWorkerChecks:[],lastAssuranceSweep:null
    }},'System','Safety Command initialised','Clean consolidated safety controls enabled');
  }
  function state(){
    ensure();
    const s=GStore.get();
    if(s.safety.day!==dayKey()){
      GStore.update(st=>{st.safety.day=dayKey();st.safety.ops={};st.safety.breaks=[]},'System','Daily safety controls reset',dayKey());
      return GStore.get();
    }
    return s;
  }
  function stockFlag(x){
    const exp=x.expiry?new Date(x.expiry+'T23:59:59').getTime():null;
    const expired=exp!==null&&exp<Date.now();
    const expiring=exp!==null&&!expired&&exp<Date.now()+30*DAY;
    const low=Number(x.quantity)<Number(x.minimum);
    if(expired)return {sev:'red',label:'EXPIRED — REMOVE FROM USE'};
    if(expiring)return {sev:'amber',label:'EXPIRING ≤30 DAYS'};
    if(low)return {sev:'amber',label:'LOW STOCK'};
    return {sev:'green',label:'CURRENT'};
  }
  function assurance(s){
    const stock=s.stock.map(stockFlag);
    const redStock=stock.filter(x=>x.sev==='red').length;
    const amberStock=stock.filter(x=>x.sev==='amber').length;
    const openRed=s.alerts.filter(a=>a.status==='Open'&&a.severity==='red').length;
    const opsTotal=Object.values(OPS).reduce((n,a)=>n+a.length,0);
    const opsDone=Object.values(s.safety.ops||{}).filter(Boolean).length;
    const compliance=FILES.filter(x=>s.safety.compliance&&s.safety.compliance[x]).length;
    const sev=(openRed||redStock)?'red':(amberStock||opsDone<opsTotal)?'amber':'green';
    return {sev,openRed,redStock,amberStock,opsTotal,opsDone,compliance};
  }
  function renderStats(s){
    const a=assurance(s);
    q('#safetyOverall').innerHTML=badge(a.sev==='red'?'ACTION REQUIRED':a.sev==='amber'?'ATTENTION':'CLEAR',a.sev);
    q('#safetyStats').innerHTML=[
      ['✓','Daily checks',a.opsDone+'/'+a.opsTotal,a.opsDone===a.opsTotal?'complete':'in progress'],
      ['⚠','Open red alerts',a.openRed,a.openRed?'manager action':'none'],
      ['▦','Expired stock',a.redStock,a.redStock?'remove from use':'none'],
      ['♟','Staff on shift',s.staff.filter(x=>x.onShift).length,'live roster'],
      ['♥','Physio records',s.safety.physio.length,'audited observations'],
      ['▤','Evidence register',a.compliance+'/'+FILES.length,'items current']
    ].map(x=>'<div class="stat"><span class="mini-icon">'+x[0]+'</span><small>'+esc(x[1])+'</small><b>'+esc(x[2])+'</b><small>'+esc(x[3])+'</small></div>').join('');
  }
  function renderOps(s){
    q('#dailyOps').innerHTML=Object.entries(OPS).map(([period,items])=>{
      const done=items.filter(i=>s.safety.ops[i]).length;
      return '<details class="formStep" '+(done<items.length?'open':'')+'><summary><b>'+period+'</b> '+badge(done+'/'+items.length,done===items.length?'green':'amber')+'</summary>'+
        items.map(i=>'<label class="checkline"><input type="checkbox" data-safety-op="'+esc(i)+'" '+(s.safety.ops[i]?'checked':'')+'> '+esc(i)+'</label>').join('')+'</details>';
    }).join('');
  }
  function lastBreak(s,id){return s.safety.breaks.filter(b=>b.staffId===id).sort((a,b)=>new Date(b.time)-new Date(a.time))[0]}
  function renderWorkforce(s){
    const on=s.staff.filter(x=>x.onShift);
    q('#workforceSafety').innerHTML=on.map(st=>{
      const br=lastBreak(s,st.id);
      const closeCount=s.safety.shiftHistory.filter(h=>h.staffId===st.id&&h.type==='Close').length;
      return '<div class="row"><div class="species-icon">♟</div><div class="row-grow"><b>'+esc(st.name)+'</b><small>'+esc(st.role)+' · close rotation: '+closeCount+' · last break: '+esc(br?new Date(br.time).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}):'not logged')+'</small></div><button class="btn sm secondary" data-log-break="'+esc(st.id)+'">Log break</button><button class="btn sm secondary" data-log-close="'+esc(st.id)+'">Log close</button></div>';
    }).join('')+'<div class="alert-box green" style="margin-top:10px"><b>Fairness rule</b><p class="small">The system shows rotation evidence; managers remain responsible for lawful rostering, fatigue controls, overtime and reasonable adjustments.</p></div>';
  }
  function renderPhysio(s){
    const animals=s.animals.filter(a=>a.status!=='Departed');
    q('#physioPanel').innerHTML='<form id="physioEvidenceForm"><div class="form-grid"><label>Animal<select name="animalId">'+animals.map(a=>'<option value="'+esc(a.id)+'">'+esc(a.name)+' · '+esc(a.species)+'</option>').join('')+'</select></label><label>Mobility observation<select name="mobility"><option>Normal for this animal</option><option>Mild change observed</option><option>Marked change — escalate</option></select></label><label>Comfort / pain observation<select name="comfort"><option>Comfortable</option><option>Possible discomfort — monitor</option><option>Significant discomfort — escalate</option></select></label><label>Action<select name="action"><option>Record only</option><option>Supervisor review</option><option>Contact vet / follow care plan</option></select></label></div><label>Facts observed<textarea name="note" required placeholder="Record what was seen; do not diagnose."></textarea></label><button class="btn" type="submit">Save mobility evidence</button></form>'+
      '<div class="list" style="margin-top:12px">'+s.safety.physio.slice(0,6).map(p=>{const a=s.animals.find(x=>x.id===p.animalId)||{};return '<div class="row"><div class="species-icon">♥</div><div class="row-grow"><b>'+esc(a.name||'Animal')+'</b><small>'+esc(p.mobility)+' · '+esc(p.comfort)+' · '+esc(p.action)+'<br>'+esc(p.note)+'</small></div>'+badge(p.action.includes('vet')||p.mobility.includes('Marked')||p.comfort.includes('Significant')?'ESCALATE':'RECORDED',p.action.includes('vet')||p.mobility.includes('Marked')||p.comfort.includes('Significant')?'red':'green')+'</div>'}).join('')+'</div>';
  }
  function renderStock(s){
    q('#stockAssurance').innerHTML=s.stock.map(x=>{const f=stockFlag(x);return '<div class="row"><div class="species-icon">▦</div><div class="row-grow"><b>'+esc(x.item)+'</b><small>'+esc(x.category)+' · qty '+esc(x.quantity)+' / min '+esc(x.minimum)+(x.expiry?' · exp '+esc(x.expiry):'')+'</small></div>'+badge(f.label,f.sev)+'</div>'}).join('');
  }
  function renderCompliance(s){
    const c=s.safety.compliance||{};
    const done=FILES.filter(x=>c[x]).length;
    q('#complianceRegister').innerHTML='<div class="alert-box '+(done===FILES.length?'green':'')+'"><b>'+done+' / '+FILES.length+' evidence items marked current</b><p class="small">This register is operational evidence only; it does not certify legal or regulatory compliance.</p></div><div class="grid two">'+FILES.map(i=>'<label class="checkline"><input type="checkbox" data-compliance-item="'+esc(i)+'" '+(c[i]?'checked':'')+'> '+esc(i)+'</label>').join('')+'</div>';
  }
  function expirySweep(){
    const s=state();
    const expired=s.stock.filter(x=>stockFlag(x).sev==='red');
    expired.forEach(x=>{
      const key='Expired stock: '+x.item;
      const exists=s.alerts.some(a=>a.status==='Open'&&a.title===key);
      if(!exists)GStore.update(st=>st.alerts.unshift({id:'al_'+Date.now()+'_'+Math.random().toString(36).slice(2,5),severity:'red',title:key,detail:(x.category||'Stock')+' expired '+x.expiry+' — remove from use and manager to verify disposal / impact',owner:'Manager',status:'Open',createdAt:iso()}),'System','Expired stock escalated',x.item);
    });
  }
  function render(){
    if(!q('#safety-command'))return;
    const s=state();
    renderStats(s);renderOps(s);renderWorkforce(s);renderPhysio(s);renderStock(s);renderCompliance(s);
  }
  document.addEventListener('DOMContentLoaded',()=>{
    ensure();expirySweep();render();
    document.body.addEventListener('change',e=>{
      const op=e.target.getAttribute&&e.target.getAttribute('data-safety-op');
      if(op){GStore.update(s=>{s.safety.ops[op]=e.target.checked},'Staff','Daily operation '+(e.target.checked?'completed':'reopened'),op);return}
      const ci=e.target.getAttribute&&e.target.getAttribute('data-compliance-item');
      if(ci){GStore.update(s=>{s.safety.compliance[ci]=e.target.checked},'Manager','Compliance evidence register updated',(e.target.checked?'current: ':'not current: ')+ci);}
    });
    document.body.addEventListener('click',e=>{
      const br=e.target.getAttribute&&e.target.getAttribute('data-log-break');
      if(br){const st=GStore.get().staff.find(x=>x.id===br);GStore.update(s=>s.safety.breaks.unshift({id:'br_'+Date.now(),staffId:br,time:iso()}),st?st.name:'Staff','Break logged','Fatigue-control evidence');}
      const cl=e.target.getAttribute&&e.target.getAttribute('data-log-close');
      if(cl){const st=GStore.get().staff.find(x=>x.id===cl);GStore.update(s=>s.safety.shiftHistory.unshift({id:'sh_'+Date.now(),staffId:cl,type:'Close',time:iso()}),'Manager','Close shift logged',st?st.name:'Staff');}
    });
    document.body.addEventListener('submit',e=>{
      if(e.target.id!=='physioEvidenceForm')return;
      e.preventDefault();const f=new FormData(e.target);const rec={id:'ph_'+Date.now(),animalId:f.get('animalId'),mobility:f.get('mobility'),comfort:f.get('comfort'),action:f.get('action'),note:f.get('note'),time:iso()};
      const a=GStore.get().animals.find(x=>x.id===rec.animalId);
      GStore.update(s=>{s.safety.physio.unshift(rec);if(rec.action.includes('vet')||rec.mobility.includes('Marked')||rec.comfort.includes('Significant'))s.alerts.unshift({id:'al_'+Date.now(),severity:'red',title:'Mobility / comfort escalation: '+(a?a.name:'animal'),detail:rec.note,owner:'Manager',status:'Open',createdAt:iso()})},'Staff','Mobility evidence recorded',a?a.name:'Animal');
      e.target.reset();
    });
  });
  window.addEventListener('genevieve:state',render);
})();