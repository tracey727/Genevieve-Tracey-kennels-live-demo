/* Kennel Weather & Hazard Safety — browser-only simulated operations.
 * Training exercises; does not fetch BOM, Nature Has No Borders or live warnings.
 */
(function(){
 'use strict';
 const Engine=window.KennelHazard,Store=window.GStore,UI=window.GUI;
 if(!Engine||!Store||!UI)return;
 const element=id=>document.getElementById(id);
 const esc=v=>UI.esc(v==null?'':String(v));
 const stamp=()=>new Date().toISOString();
 const areas={areaCodes:['QLD-SE-DEMO']}; // No GPS or real address inference.
 function ensure(){
   const s=Store.get();
   if(s.opsHub&&s.opsHub.weatherHub&&Array.isArray(s.opsHub.weatherHub.events))return;
   Store.update(st=>{
     st.opsHub ||= {version:1,mode:'SYNTHETIC_BROWSER_ONLY',services:[],invoices:[],payments:[],handovers:[],stockUsage:[],reviews:[]};
     st.opsHub.weatherHub={mode:'SYNTHETIC_ONLY',liveFeed:'NOT_CONNECTED',events:[],reviews:[]};
   },'System','Kennel hazard training panel initialised','No external weather data');
 }
 function riskAnimals(st,event){
   const all=Array.isArray(st.animals)?st.animals.filter(a=>a.status!=='Departed'):[];
   const check=event.hazardType==='heat'?
      all.filter(a=>a.medicalPriority||/senior|heat|respirat/i.test(String(a.behaviour||'')+' '+String(a.room||''))):
      event.hazardType==='severe_storm'?all.filter(a=>/storm|escape|reactive/i.test(String(a.behaviour||''))):
      event.hazardType==='flood'||event.hazardType==='cyclone'||event.hazardType==='bushfire'?all:[];
   return check.slice(0,15).map(x=>'<div class="row"><div class="row-grow"><b>'+esc(x.name)+'</b><small>Review that animal’s individual care, environment and safe-handling plan; this is not a veterinary risk score.</small></div></div>').join('');
 }
 function render(){
   const root=element('kennel-weather');
   if(!root)return;
   ensure();
   const s=Store.get(),data=s.opsHub.weatherHub;
   const result=Engine.summary(data.events,areas,stamp());
   const overview=element('kennelWeatherOverview');
   if(overview)overview.innerHTML=
     '<div class="alert-box red" role="status"><h3>LIVE FEED NOT CONNECTED — NO WEATHER ALL-CLEAR</h3>'+
     '<p>This kennel demonstration cannot tell you whether a real warning exists. Check current official weather and emergency information independently. Source licensing and approved, secure bridge verification are still required.</p></div>'+
     '<div class="grid three"><div class="stat"><small>Official live warnings received</small><b>Not connected</b></div>'+
     '<div class="stat"><small>Current synthetic exercises</small><b>'+result.simulatedEvents+'</b></div>'+
     '<div class="stat"><small>Approved live weather integration</small><b>HOLD</b></div></div>';
   const list=element('kennelWeatherScenarios');
   if(list)list.innerHTML=result.events.length?result.events.slice().reverse().map(({event:e,result:r})=>{
     const staff=s.staff||[],review=data.reviews.find(x=>x.eventId===e.id),person=staff.find(x=>x.id===review?.staffId);
     const route=(s.transports||[]).filter(x=>!['Completed','Cancelled'].includes(x.status)).length;
     const reloc=(s.opsHub.relocations||[]).filter(x=>x.status!=='COMPLETED').length;
     return '<article class="card"><div class="card-head"><h3>'+esc(e.title)+' — SIMULATION</h3>'+UI.badge(r.state,r.state==='RED'?'red':r.state==='AMBER'?'amber':'outline')+'</div>'+
       '<p class="small"><b>Source: GEN-DEMO only; not an official warning.</b> Internal exercise signal: '+esc(e.internalLevel.toUpperCase())+
       '. Official warning level: not supplied. Checked: '+esc(new Date(e.observedAt).toLocaleString('en-AU'))+
       '. Valid until: '+esc(new Date(e.expiresAt).toLocaleString('en-AU'))+'.</p>'+
       '<p class="small">'+esc(r.reason)+'</p>'+
       '<h3>Suggested checks — staff and manager decide</h3><div class="list">'+(r.checks||[]).map(c=>
         '<div class="row"><div class="row-grow"><small>'+esc(c)+'</small></div></div>').join('')+'</div>'+
       (riskAnimals(s,e)?'<details><summary>Animals to review in the existing demo</summary>'+riskAnimals(s,e)+'</details>':'')+
       '<p class="small">Open transport jobs: '+route+' · Open relocation journeys: '+reloc+'. Review with driver and caretaker before travel; no trip is automatically cancelled or rerouted.</p>'+
       (review?'<div class="alert-box green"><b>Training acknowledgement recorded</b><p>'+esc(person?.name||'Demo staff')+' · '+esc(review.note)+
         '. This does not certify real-world action or close an official warning.</p></div>':
         '<form data-weather-review="'+esc(e.id)+'"><label>Training reviewer<select name="staffId">'+staff.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name)+'</option>').join('')+'</select></label>'+
         '<label>Exercise review notes<input name="note" maxlength="240" required placeholder="Example: manager reviewed evacuation carrier checklist"></label>'+
         '<button class="btn secondary" type="submit">Record demo acknowledgement</button></form>')+
       '</article>';
   }).join(''):'<p class="small">No training scenarios added. This does not mean there are no official warnings.</p>';
 }
 function init(){
   if(!element('kennel-weather'))return;
   ensure();render();
   document.body.addEventListener('click',e=>{
     const btn=e.target.closest('[data-hazard-scenario]');
     if(!btn)return;
     const type=btn.dataset.hazardScenario;
     const scenario=Engine.scenario(type,stamp());
     if(!scenario)return UI.toast('Unsupported hazard scenario');
     Store.update(st=>{st.opsHub.weatherHub.events.unshift(scenario);
       st.opsHub.weatherHub.events=st.opsHub.weatherHub.events.slice(0,12);},
       'Synthetic simulator','Fictional hazard exercise loaded',scenario.title);
     UI.toast('Fictional weather exercise only — NOT a real warning.');
   });
   document.body.addEventListener('submit',e=>{
     const form=e.target.closest('form[data-weather-review]');if(!form)return;
     e.preventDefault();
     const f=new FormData(form),eventId=form.dataset.weatherReview,staffId=String(f.get('staffId')||''),note=String(f.get('note')||'').trim();
     const s=Store.get();
     if(!s.opsHub.weatherHub.events.some(x=>x.id===eventId)||!s.staff.some(x=>x.id===staffId)||!note||note.length>240)
       return UI.toast('Choose demo reviewer and record a factual exercise note.');
     Store.update(st=>st.opsHub.weatherHub.reviews.unshift({eventId,staffId,note,recordedAt:stamp()}),
       'Synthetic staff','Weather exercise acknowledged','SIMULATED '+eventId);
     UI.toast('Demo acknowledgement recorded — no official alert was acknowledged.');
   });
   window.addEventListener('genevieve:state',render);
 }
 document.addEventListener('DOMContentLoaded',init);
})();