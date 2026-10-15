/* GENEVIEVE Kennels — synthetic integrated operations demonstration.
   All values stored in this browser only. NO Revenue Rescue, Stock Sense or FAIR BREAK
   backend connection; only independently implemented, applicable design patterns.
*/
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const engine=window.KennelIntelligence,store=window.GStore;
  if(!engine||!store)return;
  const esc=(x)=>window.GUI.esc(x==null?'':String(x));
  const badge=(x)=>window.GUI.badge(x,x==='RED'?'red':x==='AMBER'?'amber':x==='GREEN'?'green':'outline');
  const stamp=()=>new Date().toISOString();
  const id=(prefix)=>prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
  const today=()=>new Date().toISOString().slice(0,10);
  const options=(items,key='id',label='name')=>items.map(x=>'<option value="'+esc(x[key])+'">'+esc(x[label])+'</option>').join('');
  function amountToCents(input){
    const x=String(input).trim();
    if(!/^(0|[1-9]\d{0,6})(\.\d{1,2})?$/.test(x))return null;
    const parts=x.split('.');return Number(parts[0])*100+Number((parts[1]||'').padEnd(2,'0'));
  }
  function ensure(){
    const s=store.get();
    if(s.opsHub)return;
    store.update(st=>{st.opsHub={version:1,mode:'SYNTHETIC_BROWSER_ONLY',services:[],invoices:[],payments:[],handovers:[],stockUsage:[],reviews:[]};},
      'System','Kennels integrated workflows enabled','Isolated synthetic-only data; no external systems');
  }
  function fail(msg){window.GUI.toast(msg)}
  function resetForm(form){form.reset(); render();}
  function record(fn,action,detail){
    store.update(st=>{if(!st.opsHub)st.opsHub={version:1,mode:'SYNTHETIC_BROWSER_ONLY',services:[],invoices:[],payments:[],handovers:[],stockUsage:[],reviews:[]};fn(st);},'Demo manager',action,detail);
  }
  function seed(){
    ensure();
    const s=store.get(),hub=s.opsHub;
    if(hub.services.length||hub.invoices.length||hub.payments.length)return fail('Example evidence can only be loaded into an empty financial demo. Reset the demo to start over.');
    const a=s.animals.find(x=>x.species==='Dog')||s.animals[0];
    if(!a)return fail('Create a fictional animal first.');
    const yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10);
    const overdue=new Date(Date.now()-4*86400000).toISOString().slice(0,10);
    record(st=>{
      st.opsHub.services=[
        {ref:'DEMO-BOARD-001',animalId:a.id,kind:'Boarding stay',status:'completed',evidence:'verified',chargeCents:7800,completedAt:yesterday},
        {ref:'DEMO-BOARD-002',animalId:a.id,kind:'Day care',status:'completed',evidence:'verified',chargeCents:10500,completedAt:overdue},
        {ref:'DEMO-BOARD-003',animalId:a.id,kind:'Care add-on',status:'completed',evidence:'hold',chargeCents:null,completedAt:yesterday}
      ];
      st.opsHub.invoices=[{id:'DEMO-INV-002',serviceRef:'DEMO-BOARD-002',status:'issued',evidence:'verified',amountCents:10500,dueDate:overdue,paymentsReconciled:true}];
      st.opsHub.payments=[];
      st.opsHub.handovers=[{id:'DEMO-HAND-01',from:'s2',to:'s3',subject:'Confirm Cat Suite 6 escape-control check',status:'offered',dueAt:new Date(Date.now()+3600000).toISOString(),offeredAt:stamp(),acceptedAt:null}];
    },'Fictional commercial demonstration loaded','No real invoices, payments or messages sent');
    fail('Fictional examples loaded: findings are potential, not recovered revenue.');
  }
  function financialTable(s,assessment){
    const h=s.opsHub;
    const fs=assessment.findings.filter(x=>x.rule.indexOf('KEN-REV')===0);
    const byRef=(ref)=>{const a=s.animals.find(x=>x.id===ref);return a?a.name:'Unknown / demo'};
    let html='<div class="grid three"><div class="stat"><small>Verified unbilled (potential)</small><b>'+engine.money(assessment.unbilledCents)+'</b><small>Not collected or recovered</small></div>'+
      '<div class="stat"><small>Verified overdue balance</small><b>'+engine.money(assessment.outstandingCents)+'</b><small>Not new revenue</small></div>'+
      '<div class="stat"><small>Evidence on HOLD</small><b>'+assessment.findings.filter(x=>x.rule.indexOf('KEN-REV')===0&&x.state==='HOLD').length+'</b><small>Excluded from financial totals</small></div></div>';
    html+='<h3 style="margin:15px 0 6px">Revenue and follow-up queue</h3><div class="list">'+(fs.length?fs.map(x=>
      '<div class="row"><div class="row-grow"><b>'+esc(x.title)+'</b><small>'+esc(x.detail)+' · '+esc(x.action)+'</small></div><span>'+badge(x.state)+'</span>'+(x.amountCents!==null?'<strong>'+engine.money(x.amountCents)+'</strong>':'')+'</div>').join(''):'<p class="small">No financial findings. Enter verified records or load fictional examples.</p>')+'</div>';
    html+='<h3 style="margin-top:15px">Evidence register</h3><div class="table-wrap"><table><thead><tr><th>Service</th><th>Animal</th><th>Type</th><th>Evidence</th><th>Charge</th></tr></thead><tbody>'+
      (h.services.length?h.services.map(x=>'<tr><td>'+esc(x.ref)+'</td><td>'+esc(byRef(x.animalId))+'</td><td>'+esc(x.kind)+'</td><td>'+badge(x.evidence==='verified'?'GREEN':'HOLD')+'</td><td>'+engine.money(x.chargeCents)+'</td></tr>').join(''):'<tr><td colspan="5">No completed service records</td></tr>')+
      '</tbody></table></div><p class="small">Independent kennel-specific rules inspired by Revenue Rescue. No access to Revenue Rescue tenants, billing systems, Xero, or customer payment records.</p>';
    return html;
  }
  function render(){
    if(!$('kennel-business'))return;
    ensure();
    const s=store.get(),h=s.opsHub,a=engine.assess(s),open=a.findings.filter(f=>f.state!=='GREEN');
    const cash=$('kennelRevenue');if(cash)cash.innerHTML=financialTable(s,a);
    const overview=$('kennelOverview');
    if(overview)overview.innerHTML=
      '<div class="grid four"><div class="stat"><small>RED — urgent</small><b>'+a.red+'</b></div><div class="stat"><small>AMBER — action</small><b>'+a.amber+'</b></div><div class="stat"><small>HOLD — verify</small><b>'+a.hold+'</b></div><div class="stat"><small>Unaccepted handovers</small><b>'+h.handovers.filter(x=>x.status!=='accepted').length+'</b></div></div>'+
      '<p class="small"><b>Single kennel manager view:</b> animal welfare, inventory, finance, site upkeep and staff cover remain separated by their own evidence. No combined fictional “savings total”.</p>';
    const selectAnimals=options(s.animals), selectStaff=options(s.staff);
    for(const [element,values] of [
      ['kennelServiceAnimal',selectAnimals],['kennelHandoverFrom',selectStaff],['kennelHandoverTo',selectStaff],
      ['kennelStockSelect',options(s.stock,'id','item')],['kennelReviewStaff',selectStaff]
    ]){const el=$(element);if(el){const prev=el.value;el.innerHTML=values;if(prev&&[...el.options].some(o=>o.value===prev))el.value=prev;}}
    const invoiceService=$('kennelInvoiceService');
    if(invoiceService){const prev=invoiceService.value;invoiceService.innerHTML=options(h.services,'ref','ref');if(prev&&[...invoiceService.options].some(o=>o.value===prev))invoiceService.value=prev;}
    const paymentInvoice=$('kennelPaymentInvoice');
    const reconcile=$('kennelReconcileInvoice');
    if(reconcile){const prev=reconcile.value;reconcile.innerHTML=options(h.invoices,'id','id');if(prev&&[...reconcile.options].some(o=>o.value===prev))reconcile.value=prev;}
    if(paymentInvoice){const prev=paymentInvoice.value;paymentInvoice.innerHTML=options(h.invoices,'id','id');if(prev&&[...paymentInvoice.options].some(o=>o.value===prev))paymentInvoice.value=prev;}
    const stock=$('kennelSupply');
    if(stock)stock.innerHTML='<div class="list">'+(s.stock.length?s.stock.map(item=>{
      const a0=a.findings.filter(x=>x.rule==='KEN-STOCK'&&x.id.endsWith(':'+item.id));
      const rate=h.stockUsage.find(x=>x.stockId===item.id);
      return '<div class="row"><div class="row-grow"><b>'+esc(item.item)+'</b><small>Qty '+esc(item.quantity)+' · Minimum '+esc(item.minimum)+' · '+(rate?'Verified usage: '+esc(rate.unitsPerDay)+' / day · lead '+esc(rate.leadDays)+' days':'Demand estimate not entered; no automatic orders')+'</small></div>'+badge(a0[0]?.state||'GREEN')+'</div>';
    }).join(''):'<p>No stock records found.</p>')+'</div>'+
      '<p class="small">Stock Sense pattern: minimums, manually evidenced consumption and supplier lead time. No POS/supplier connection or automatic purchasing.</p>';
    const hand=$('kennelHandovers');
    if(hand)hand.innerHTML='<div class="list">'+(h.handovers.length?h.handovers.map(x=>{
      const from=s.staff.find(y=>y.id===x.from),to=s.staff.find(y=>y.id===x.to);
      return '<div class="row"><div class="row-grow"><b>'+esc(x.subject)+'</b><small>'+esc(from?.name||'Unassigned')+' → '+esc(to?.name||'Unassigned')+' · '+esc(x.status)+' · due '+esc(new Date(x.dueAt).toLocaleString('en-AU'))+'</small></div>'+
        (x.status==='accepted'?badge('GREEN'):'<button type="button" class="btn sm" data-accept-handover="'+esc(x.id)+'">Demo accept</button>')+'</div>';
    }).join(''):'<p class="small">No handovers offered yet.</p>')+'</div><p class="small">Accepted handover design inspired by Shared Core and Nature Has No Borders. Demo acceptance is not verified worker identity.</p>';
    const operations=$('kennelActionQueue');
    if(operations)operations.innerHTML='<div class="list">'+(open.length?open.map(x=>{
      const review=h.reviews.find(v=>v.findingId===x.id);
      const who=review&&s.staff.find(y=>y.id===review.assignedTo);
      return '<div class="row"><div class="row-grow"><b>'+esc(x.title)+'</b><small>'+esc(x.rule)+' · '+esc(x.detail)+'</small>'+
        (review?'<small>Review assigned to '+esc(who?.name||'Manager')+': '+esc(review.note)+' — still open until evidence changes</small>':'')+'</div>'+badge(x.state)+'</div>';
    }).join(''):'<p class="small">No open findings from these rules.</p>')+'</div>';
    const choices=$('kennelReviewFinding');
    if(choices){const prev=choices.value;choices.innerHTML=open.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.title)+' ['+esc(x.state)+']</option>').join('');if(prev&&[...choices.options].some(o=>o.value===prev))choices.value=prev;}
    const staffSummary=$('kennelWorkforce');
    if(staffSummary){
      const br=s.safety?.breaks||[];
      staffSummary.innerHTML='<p><b>'+s.staff.filter(x=>x.onShift).length+' staff on shift.</b> '+br.length+' break events recorded in the current demonstration day.</p>'+
      '<p class="small">FAIR BREAK pattern: protect genuine rest; do not rank people by speed or turn recovered minutes into extra automatic work. Formal breaks, award rules and safe staffing remain human-governed.</p>'+
      '<button type="button" class="btn secondary" data-screen-link="safety-command">Open existing staff breaks and safety module</button>';
    }
  }
  function readForm(event){event.preventDefault();return new FormData(event.target)}
  function attach(){
    if(!$('kennel-business'))return;
    ensure();
    document.addEventListener('submit',e=>{
      const f=e.target;if(!f.id||!f.id.startsWith('kennelForm'))return;
      const d=readForm(e),h=store.get().opsHub;
      if(f.id==='kennelFormService'){
        const ref=String(d.get('ref')||'').trim().toUpperCase();
        const val=amountToCents(d.get('amount'));
        if(!/^[A-Z0-9][A-Z0-9_-]{2,39}$/.test(ref)||h.services.some(x=>x.ref===ref))return fail('Use a unique service reference (3–40 letters/numbers, underscore or dash).');
        if(val===null||val===0)return fail('Enter a valid exact charge above $0.');
        const animalId=String(d.get('animalId'));
        if(!store.get().animals.some(x=>x.id===animalId))return fail('Select a valid animal.');
        record(s=>s.opsHub.services.push({ref,animalId,kind:String(d.get('kind')),status:'completed',chargeCents:val,evidence:d.has('verified')?'verified':'hold',completedAt:today()}),'Completed kennel service recorded',ref);
      }else if(f.id==='kennelFormInvoice'){
        const id0=String(d.get('id')||'').trim().toUpperCase(),amount=amountToCents(d.get('amount'));
        if(!/^[A-Z0-9][A-Z0-9_-]{2,39}$/.test(id0)||h.invoices.some(x=>x.id===id0))return fail('Use a new valid invoice ID.');
        if(!h.services.some(x=>x.ref===d.get('serviceRef'))||amount===null||amount===0||!engine.isoDate(String(d.get('dueDate'))))return fail('Choose an existing service, exact amount and valid due date.');
        record(s=>s.opsHub.invoices.push({id:id0,serviceRef:d.get('serviceRef'),status:'issued',amountCents:amount,dueDate:String(d.get('dueDate')),evidence:d.has('verified')?'verified':'hold',paymentsReconciled:d.has('reconciled')}),'Invoice evidence recorded',id0);
      }else if(f.id==='kennelFormPayment'){
        const id0=String(d.get('id')||'').trim().toUpperCase(),amount=amountToCents(d.get('amount'));
        if(!/^[A-Z0-9][A-Z0-9_-]{2,39}$/.test(id0)||h.payments.some(x=>x.id===id0)||amount===null||amount===0)return fail('Enter a unique payment ID and valid amount.');
        if(!d.get('invoiceId'))return fail('Choose a linked invoice.');
        record(s=>{s.opsHub.payments.push({id:id0,invoiceId:d.get('invoiceId'),amountCents:amount,evidence:d.has('verified')?'verified':'hold'});const inv=s.opsHub.invoices.find(x=>x.id===d.get('invoiceId'));if(inv)inv.paymentsReconciled=false;},'Payment evidence recorded; reconciliation reset',id0);
      }else if(f.id==='kennelFormReconcile'){
        const invoiceId=d.get('invoiceId');
        if(!d.has('verified')||!h.invoices.some(x=>x.id===invoiceId))return fail('A manager must verify and select the invoice for reconciliation.');
        record(s=>{s.opsHub.invoices.find(x=>x.id===invoiceId).paymentsReconciled=true;},
          'Invoice payment reconciliation verified',String(invoiceId));
      }else if(f.id==='kennelFormHandover'){
        const from=d.get('from'),to=d.get('to'),subject=String(d.get('subject')||'').trim(),dueAt=String(d.get('dueAt')||'');
        if(!subject||subject.length>240||from===to||!Number.isFinite(Date.parse(dueAt)))return fail('Enter a handover, different staff members and valid due date.');
        record(s=>s.opsHub.handovers.unshift({id:id('HAND'),from,to,subject,dueAt:new Date(dueAt).toISOString(),status:'offered',offeredAt:stamp(),acceptedAt:null}),'Handover offered',subject);
      }else if(f.id==='kennelFormStock'){
        const stockId=d.get('stockId'),rate=Number(d.get('rate')),lead=Number(d.get('lead'));
        if(!store.get().stock.some(x=>x.id===stockId)||!Number.isFinite(rate)||rate<=0||rate>100000||!Number.isInteger(lead)||lead<0||lead>365)return fail('Use a listed stock item, positive daily usage and reasonable supplier lead time.');
        if(!d.has('verified'))return fail('Confirm the usage estimate is evidenced; otherwise leave it on HOLD.');
        record(s=>{s.opsHub.stockUsage=s.opsHub.stockUsage.filter(x=>x.stockId!==stockId);s.opsHub.stockUsage.push({stockId,unitsPerDay:rate,leadDays:lead,verified:true,updatedAt:stamp()});},'Stock demand estimate recorded',String(stockId));
      }else if(f.id==='kennelFormReview'){
        const fid=d.get('findingId'),assignee=d.get('assignedTo'),note=String(d.get('note')||'').trim();
        if(!engine.assess(store.get()).findings.some(x=>x.id===fid)||!note||note.length>500||!store.get().staff.some(x=>x.id===assignee))return fail('Select a current finding, assigned person and review note (up to 500 characters).');
        record(s=>{s.opsHub.reviews=s.opsHub.reviews.filter(x=>x.findingId!==fid);s.opsHub.reviews.push({findingId:fid,assignedTo:assignee,note,time:stamp(),status:'under_review'});},'Finding allocated for human review',String(fid));
      }else return;
      resetForm(f);window.GUI.toast('Saved in synthetic browser demo only.');
    });
    document.addEventListener('click',e=>{
      const target=e.target.closest('[data-accept-handover],[data-load-kennel-examples]');if(!target)return;
      if(target.dataset.loadKennelExamples!==undefined){seed();return;}
      const hid=target.dataset.acceptHandover;
      if(!hid)return;
      const h=store.get().opsHub.handovers.find(x=>x.id===hid);
      if(!h||h.status==='accepted')return;
      record(s=>{const x=s.opsHub.handovers.find(v=>v.id===hid);x.status='accepted';x.acceptedAt=stamp();x.acceptedBy=x.to;},'Synthetic handover accepted',h.subject);
      window.GUI.toast('Demo accepted; live staff identity must be verified separately.');
    });
    window.addEventListener('genevieve:state',render);
    render();
  }
  document.addEventListener('DOMContentLoaded',attach);
})();