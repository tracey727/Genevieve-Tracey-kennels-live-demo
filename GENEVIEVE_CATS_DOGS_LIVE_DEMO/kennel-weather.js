/* GENEVIEVE Kennels x Nature Has No Borders: scoped weather and hazard assurance.
 * Synthetic-only weather training source. An official feed MUST be authorised,
 * provenance-checked, location-matched and fresh before any customer-facing alert.
 * No weather API calls, user location tracking, emergency warnings or dispatch.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.KennelHazard=api;
})(typeof globalThis!=='undefined'?globalThis:null,function(){
 'use strict';
 const VERSION='KENNELS-HAZARD-1.0';
 const SUPPORTED=new Set(['heat','severe_storm','flood','bushfire','cyclone','coastal_inundation','infrastructure']);
 const LEVELS=new Set(['green','amber','red','critical']);
 const LOCAL_AREAS=new Set(['QLD-SE-DEMO']); // Synthetic region IDs only; no geo-inference.
 const CHECKS={
   heat:[
     'Review shade, ventilation, water and temperature observations for each animal and room',
     'Check senior, short-nosed, unwell and heat-sensitive animals against individual care plans',
     'Review indoor/outdoor activity and staff breaks with qualified coverage',
     'Review pet transport temperature, ventilation, water stops and travel timing'
   ],
   severe_storm:[
     'Secure gates, enclosures, loose equipment and safe shelter areas',
     'Review storm-sensitive animals, safe indoor spaces and calm handling plans',
     'Check roof, power, lighting, communications and backup readiness',
     'Review vehicle collection routes and driver welfare; confirm authorised handovers'
   ],
   flood:[
     'Review flood exposure of rooms, yards, access roads and designated animal-safe shelter',
     'Check animal headcount, carriers, medications and authorised receiving locations',
     'Review staff access, shifts, contact trees and emergency equipment',
     'Pause/review non-essential pickup and rehoming travel subject to manager decision'
   ],
   bushfire:[
     'Review smoke/air-quality exposure and animal respiratory welfare',
     'Check escape-safe carriers, medications and staff/animal headcount',
     'Confirm authorised emergency plan, transport equipment and safe receiving site',
     'Check staff protection, contingency communications and relevant official instructions'
   ],
   cyclone:[
     'Review strong-wind exposure, structural safety, gates and shelter',
     'Check supplies, food/water, power backup and medication refrigeration',
     'Reconcile headcount, carriers and human-approved relocation contingencies',
     'Review staff cover and avoid unsafe travel; follow official advice'
   ],
   coastal_inundation:[
     'Inspect low-lying kennel, cattery, storage and access routes',
     'Review safe animal shelter, carriers and staff access',
     'Check driver routes, tides/road information using official sources',
     'Escalate potential movement of animals to authorised manager'
   ],
   infrastructure:[
     'Check electricity, water, climate control and medication fridge status',
     'Plan animal care with safe manual fallback if essential services fail',
     'Confirm staff communications, lighting and transport restrictions',
     'Escalate maintenance/utility support; do not assume systems are operational'
   ]
 };
 function parseDate(v){const n=Date.parse(v);return typeof v==='string'&&Number.isFinite(n)?n:null;}
 function matches(event,facility){
   return Boolean(event&&facility&&typeof event.areaCode==='string'&&
     Array.isArray(facility.areaCodes)&&facility.areaCodes.includes(event.areaCode));
 }
 function evaluate(event,facility,now=new Date().toISOString()){
   const at=parseDate(now);
   if(!event||!SUPPORTED.has(event.hazardType)||!LEVELS.has(event.internalLevel)){
     return {state:'HOLD',reason:'Unknown or incomplete hazard type or internal signal; do not act on unverified information.',relevant:false,official:false,checks:[]};
   }
   const relevant=matches(event,facility);
   if(!relevant)return {state:'HOLD',reason:'Hazard area does not match the verified facility/service area. Manual area review required.',relevant:false,official:false,checks:[]};
   const from=parseDate(event.observedAt),expires=parseDate(event.expiresAt);
   if(at===null||from===null||expires===null||expires<=from||expires<=at||from>at+5*60000){
     return {state:'HOLD',reason:'Hazard timestamp is missing, future-dated or expired. Refresh authoritative source and review.',relevant:true,official:false,checks:CHECKS[event.hazardType]};
   }
   const simulated=event.sourceId==='GEN-DEMO'&&event.sourceStatus==='synthetic';
   if(simulated){
     return {state:event.internalLevel==='critical'?'RED':event.internalLevel.toUpperCase(),
       reason:'SIMULATED TRAINING SCENARIO — no actual warning, forecast or live weather connection.',
       relevant:true,official:false,simulated:true,checks:CHECKS[event.hazardType],ageMinutes:Math.floor((at-from)/60000)};
   }
   // Fail closed on ALL other sources until an approved feed bridge exists, with
   // explicit source verification and a true area authority.
   const approved=event.productionUse==='approved'&&event.verifiedByAuthority===true&&
     event.receivedViaApprovedAdapter===true&&typeof event.officialWarningLevel==='string'&&event.officialWarningLevel.trim();
   if(!approved) return {state:'HOLD',reason:'Feed is not approved or the official warning and location evidence cannot be verified.',relevant:true,official:false,checks:CHECKS[event.hazardType]};
   // Future approved-adapter contract only; no live adapter wired in this app.
   return {state:event.internalLevel==='critical'?'RED':event.internalLevel.toUpperCase(),
     reason:'Source and timestamp verified; confirm current official instructions from the original issuer.',
     relevant:true,official:true,simulated:false,officialWarningLevel:event.officialWarningLevel,
     checks:CHECKS[event.hazardType],ageMinutes:Math.floor((at-from)/60000)};
 }
 function scenario(type,now=new Date().toISOString()){
   if(!SUPPORTED.has(type))return null;
   const n=parseDate(now);if(n===null)return null;
   const names={heat:'Extreme heat exercise',severe_storm:'Severe thunderstorm exercise',
     flood:'Heavy rain and local flooding exercise',bushfire:'Bushfire / smoke exercise',
     cyclone:'Cyclone approach exercise',coastal_inundation:'Coastal inundation exercise',
     infrastructure:'Power / water disruption exercise'};
   return {id:'SIM-'+type.toUpperCase()+'-'+n,sourceId:'GEN-DEMO',sourceStatus:'synthetic',
     hazardType:type,title:names[type],areaCode:'QLD-SE-DEMO',
     internalLevel:['bushfire','cyclone','flood'].includes(type)?'red':'amber',
     officialWarningLevel:null,productionUse:'prohibited',verifiedByAuthority:false,
     receivedViaApprovedAdapter:false,observedAt:new Date(n).toISOString(),
     expiresAt:new Date(n+2*60*60*1000).toISOString()};
 }
 function summary(events,facility,now){
   const a=(Array.isArray(events)?events:[]).map(e=>({event:e,result:evaluate(e,facility,now)}));
   return {liveFeed:'NOT_CONNECTED',productionStatus:'HOLD',
     simulatedEvents:a.filter(v=>v.result.simulated).length,
     actionableLiveEvents:a.filter(v=>v.result.official).length,events:a,
     note:'No verified real-time weather feed is connected. This is not a live weather warning or an all-clear.'};
 }
 return {VERSION,SUPPORTED,CHECKS,LOCAL_AREAS,evaluate,scenario,summary};
});