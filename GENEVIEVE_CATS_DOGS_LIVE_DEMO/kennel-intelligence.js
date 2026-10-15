/* GENEVIEVE Kennels | pure, synthetic-only reusable operational rules.
 * No network calls, cross-product data access, automated payments, or clinical decisions.
 * Browser: window.KennelIntelligence; Node tests: module.exports.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.KennelIntelligence=api;
})(typeof globalThis!=='undefined'?globalThis:null,function(){
  'use strict';
  const VERSION='KENNELS-CROSS-REUSE-1.0';
  const STATES=['GREEN','AMBER','RED','HOLD'];
  const isoDate=(value)=>{
    if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
    const d=new Date(value+'T00:00:00.000Z');
    return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value?value:null;
  };
  const cents=(v)=>Number.isSafeInteger(v)&&v>=0?v:null;
  const money=(v)=>cents(v)===null?'—':new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(v/100);
  const find=(id,rule,state,title,detail,valueBasis='none',amountCents=null,action='Review evidence')=>({
    id,rule,ruleVersion:VERSION,state,title,detail,valueBasis,amountCents,action
  });
  // No financial amount without exact source evidence; no clinical or welfare deductions.
  function revenueFindings(hub,today){
    if(!hub)return [];
    const services=Array.isArray(hub.services)?hub.services:[];
    const invoices=Array.isArray(hub.invoices)?hub.invoices:[];
    const payments=Array.isArray(hub.payments)?hub.payments:[];
    const output=[];
    const day=isoDate(today);
    const seen=new Set();
    const refCounts=new Map();
    for(const item of services)if(item&&typeof item.ref==='string'&&item.ref.trim())refCounts.set(item.ref,(refCounts.get(item.ref)||0)+1);
    for(const s of services){
      if(!s||typeof s.ref!=='string'||!s.ref.trim())continue;
      const id='svc:'+s.ref;
      if(seen.has(id))continue;
      seen.add(id);
      if(refCounts.get(s.ref)>1){
        output.push(find('KEN-REV-DATA:'+s.ref,'KEN-REV-DATA','HOLD','Duplicate service reference',s.ref+' requires data reconciliation.'));
        continue;
      }
      if(s.status!=='completed')continue;
      const related=invoices.filter(i=>i&&i.serviceRef===s.ref&&i.status!=='void');
      if(s.evidence!=='verified'||cents(s.chargeCents)===null||s.chargeCents===0){
        output.push(find('KEN-REV-HOLD:'+s.ref,'KEN-REV-HOLD','HOLD','Service needs verified charging evidence',s.ref+' cannot be valued until completion and agreed charge are verified.'));
      }else if(related.length===0){
        output.push(find('KEN-REV-UNBILLED:'+s.ref,'KEN-REV-UNBILLED','AMBER','Completed service with no invoice',s.ref+' has verified service and charge, but no linked invoice.','unbilled',s.chargeCents,'Manager to confirm an invoice was not issued elsewhere before preparing one.'));
      }else if(related.length>1){
        output.push(find('KEN-REV-DUP:'+s.ref,'KEN-REV-DUP','HOLD','Possible duplicate invoice',s.ref+' has more than one non-void invoice; check and reconcile before action.'));
      }
    }
    for(const i of invoices){
      if(!i||!i.id||i.status==='void'||i.status==='paid')continue;
      if(i.status!=='issued')continue;
      const service=services.find(s=>s&&s.ref===i.serviceRef);
      if(!service||refCounts.get(i.serviceRef)!==1||service.evidence!=='verified'||i.evidence!=='verified'||cents(i.amountCents)===null||cents(service.chargeCents)===null||i.amountCents!==service.chargeCents||invoices.filter(x=>x&&x.serviceRef===i.serviceRef&&x.status!=='void').length!==1||!isoDate(i.dueDate)||!day){
        output.push(find('KEN-REV-INVOICE-HOLD:'+i.id,'KEN-REV-INVOICE-HOLD','HOLD','Invoice evidence incomplete','Invoice '+i.id+' needs a verified linked service, total, due date and reconciled records.'));
        continue;
      }
      if(i.dueDate>=day)continue;
      const linked=payments.filter(p=>p&&p.invoiceId===i.id&&p.evidence==='verified');
      const paid=linked.reduce((v,p)=>v+(cents(p.amountCents)||0),0);
      const amountsValid=linked.every(p=>cents(p.amountCents)!==null);
      if(i.paymentsReconciled!==true||!amountsValid||paid>i.amountCents){
        output.push(find('KEN-REV-OVERDUE-HOLD:'+i.id,'KEN-REV-OVERDUE-HOLD','HOLD','Payment reconciliation required','Invoice '+i.id+' appears overdue but its outstanding balance cannot be verified.'));
        continue;
      }
      if(paid<i.amountCents){
        output.push(find('KEN-REV-OVERDUE:'+i.id,'KEN-REV-OVERDUE','AMBER','Verified overdue invoice','Invoice '+i.id+' has verified outstanding balance.','outstanding',i.amountCents-paid,'Manager to review agreed terms and authorise follow-up; do not send automatically.'));
      }
    }
    for(const p of payments){
      if(!p||!p.id)continue;
      if(!p.invoiceId||!invoices.some(i=>i.id===p.invoiceId)){
        output.push(find('KEN-REV-PAYMENT-HOLD:'+p.id,'KEN-REV-PAYMENT-HOLD','HOLD','Unmatched payment','Payment '+p.id+' requires reconciliation; received money is not new revenue.'));
      }
    }
    return output;
  }
  function stockFindings(stock,usage,today){
    const day=isoDate(today);
    const rows=Array.isArray(stock)?stock:[];
    const rates=Array.isArray(usage)?usage:[];
    return rows.map(item=>{
      if(!item||!item.id)return null;
      const qty=Number(item.quantity),min=Number(item.minimum),expiry=item.expiry||null;
      if(!Number.isFinite(qty)||qty<0||!Number.isFinite(min)||min<0|| (expiry&&!isoDate(expiry))){
        return find('KEN-STOCK-HOLD:'+item.id,'KEN-STOCK','HOLD','Stock needs data review',item.item+' has missing or invalid quantity/expiry evidence.');
      }
      if(day&&expiry&&expiry<day)return find('KEN-STOCK-EXP:'+item.id,'KEN-STOCK','RED','Expired stock — isolate',item.item+' is expired. Manager to remove it from use and check potential exposure.');
      if(qty<min)return find('KEN-STOCK-LOW:'+item.id,'KEN-STOCK','AMBER','Low stock',item.item+' is below its recorded minimum.','none',null,'Review upcoming demand; purchase only with authorised approval.');
      const rate=rates.find(r=>r.stockId===item.id);
      if(rate && rate.verified===true && Number.isFinite(Number(rate.unitsPerDay))&&Number(rate.unitsPerDay)>0){
        const days=qty/Number(rate.unitsPerDay);
        const lead=Number(rate.leadDays);
        if(Number.isFinite(lead)&&lead>=0 && days<=lead+2)return find('KEN-STOCK-FORECAST:'+item.id,'KEN-STOCK','AMBER','Stock replenishment window',item.item+' has approximately '+days.toFixed(1)+' days remaining at an approved usage estimate. Supplier lead time is '+lead+' days.','none',null,'Manager to verify forecast before placing an order.');
      }
      if(day&&expiry&&expiry<=new Date(Date.parse(day+'T00:00:00Z')+30*86400000).toISOString().slice(0,10)){
        return find('KEN-STOCK-SOON:'+item.id,'KEN-STOCK','AMBER','Stock approaching expiry',item.item+' expires within 30 days.');
      }
      return null;
    }).filter(Boolean);
  }
  function handoverFindings(handovers,now){
    return (Array.isArray(handovers)?handovers:[]).filter(h=>h&&h.id&&h.status!=='accepted').map(h=>{
      const overdue=Number.isFinite(Date.parse(h.dueAt))&&Number.isFinite(Date.parse(now))&&Date.parse(h.dueAt)<Date.parse(now);
      const invalid=!h.from||!h.to||!h.subject||!Number.isFinite(Date.parse(h.dueAt));
      return find('KEN-HANDOVER:'+h.id,'KEN-HANDOVER',invalid?'HOLD':overdue?'RED':'AMBER',
        invalid?'Handover details incomplete':overdue?'Overdue unaccepted handover':'Handover awaits acceptance',
        (h.subject||'Unspecified')+' — receiving person must explicitly accept responsibility.','none',null,'Verify safe coverage and seek named receiver acknowledgement.');
    });
  }
  function operationalFindings(state,now){
    const out=[];
    const rooms=Array.isArray(state?.rooms)?state.rooms:[];
    for(const room of rooms){
      if(room?.state==='red'||room?.state==='amber'||room?.state==='hold'){
        out.push(find('KEN-FACILITY:'+room.id,'KEN-FACILITY',String(room.state).toUpperCase(),
          'Room/facility inspection required',room.name+': '+(room.gate||'status requires verification'), 'none',null,'Manager to assign a repair/inspection and record evidence of closure.'));
      }
    }
    const staff=Array.isArray(state?.staff)?state.staff.filter(x=>x.onShift):[];
    if(!staff.some(x=>x.role==='Manager'||x.role==='Senior Attendant')){
      out.push(find('KEN-COVERAGE:SUPERVISOR','KEN-COVERAGE','RED','No recorded supervising cover','Confirm a competent responsible manager or delegate is available.'));
    }
    return out.concat(handoverFindings(state?.opsHub?.handovers,now));
  }
  function assess(state,now=new Date().toISOString()){
    const day=String(now).slice(0,10);
    const findings=[
      ...revenueFindings(state?.opsHub,day),
      ...stockFindings(state?.stock,state?.opsHub?.stockUsage,day),
      ...operationalFindings(state,now)
    ];
    const financial=findings.filter(x=>['unbilled','outstanding'].includes(x.valueBasis) && x.amountCents!==null && x.state!=='HOLD');
    const unbilled=financial.filter(x=>x.valueBasis==='unbilled').reduce((v,x)=>v+x.amountCents,0);
    const outstanding=financial.filter(x=>x.valueBasis==='outstanding').reduce((v,x)=>v+x.amountCents,0);
    return {ruleVersion:VERSION,findings,unbilledCents:unbilled,outstandingCents:outstanding,
      red:findings.filter(x=>x.state==='RED').length,amber:findings.filter(x=>x.state==='AMBER').length,hold:findings.filter(x=>x.state==='HOLD').length,
      notice:'Potential values are distinct: unbilled is not cash recovered; overdue balances are not new revenue. Only explicit payment evidence proves recovery.'};
  }
  return {VERSION,STATES,money,cents,isoDate,revenueFindings,stockFindings,handoverFindings,operationalFindings,assess};
});