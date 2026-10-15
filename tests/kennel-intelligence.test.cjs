const test=require('node:test');
const assert=require('node:assert/strict');
const K=require('../GENEVIEVE_CATS_DOGS_LIVE_DEMO/kennel-intelligence.js');
const TODAY='2026-10-15';
const base=()=>({opsHub:{services:[],invoices:[],payments:[],handovers:[],stockUsage:[]},stock:[],rooms:[],staff:[{id:'s1',role:'Manager',onShift:true}]});
test('only completed evidenced services with exact amounts produce unbilled potential',()=>{
 const s=base();s.opsHub.services=[
  {ref:'A-01',status:'completed',evidence:'verified',chargeCents:7800},
  {ref:'A-02',status:'completed',evidence:'hold',chargeCents:100000},
  {ref:'A-03',status:'cancelled',evidence:'verified',chargeCents:9000}
 ];
 const a=K.assess(s,TODAY+'T08:00:00Z');
 assert.equal(a.unbilledCents,7800);
 assert.equal(a.outstandingCents,0);
 assert(a.findings.some(x=>x.state==='HOLD'&&x.id.includes('A-02')));
 assert(!a.findings.some(x=>x.id.includes('A-03')));
});
test('overdue outstanding balance requires completed service and payment reconciliation',()=>{
 const s=base();s.opsHub.services=[{ref:'BOARD-1',status:'completed',evidence:'verified',chargeCents:10500}];
 s.opsHub.invoices=[{id:'INV-1',serviceRef:'BOARD-1',status:'issued',evidence:'verified',amountCents:10500,dueDate:'2026-10-01',paymentsReconciled:true}];
 s.opsHub.payments=[{id:'PAY-1',invoiceId:'INV-1',evidence:'verified',amountCents:3000}];
 const a=K.assess(s,TODAY+'T08:00:00Z');
 assert.equal(a.unbilledCents,0);
 assert.equal(a.outstandingCents,7500);
 s.opsHub.invoices[0].paymentsReconciled=false;
 const b=K.assess(s,TODAY+'T08:00:00Z');
 assert.equal(b.outstandingCents,0);
 assert(b.findings.some(x=>x.id==='KEN-REV-OVERDUE-HOLD:INV-1'&&x.state==='HOLD'));
});
test('possible duplicate is HOLD and never added as claim',()=>{
 const s=base();s.opsHub.services=[{ref:'ONE',status:'completed',evidence:'verified',chargeCents:8000}];
 s.opsHub.invoices=[{id:'I1',serviceRef:'ONE',status:'issued',evidence:'verified',amountCents:8000,dueDate:'2026-11-01'},
 {id:'I2',serviceRef:'ONE',status:'issued',evidence:'verified',amountCents:8000,dueDate:'2026-11-01'}];
 assert.equal(K.assess(s,TODAY).unbilledCents,0);
 assert(K.assess(s,TODAY).findings.some(x=>x.rule==='KEN-REV-DUP'&&x.state==='HOLD'));
});
test('unmatched payment is a hold, not financial gain',()=>{
 const s=base();s.opsHub.payments=[{id:'P1',invoiceId:'UNKNOWN',evidence:'verified',amountCents:90000}];
 const a=K.assess(s,TODAY);
 assert.equal(a.unbilledCents+a.outstandingCents,0);
 assert(a.findings.some(x=>x.rule==='KEN-REV-PAYMENT-HOLD'));
});
test('expired supply red precedes forecast and low stock',()=>{
 const s=base();s.stock=[{id:'A',item:'Medication',quantity:30,minimum:10,expiry:'2026-10-01'},
 {id:'B',item:'Food',quantity:4,minimum:5,expiry:'2026-12-01'},
 {id:'C',item:'Gloves',quantity:12,minimum:3,expiry:''}];
 s.opsHub.stockUsage=[{stockId:'C',unitsPerDay:3,leadDays:4,verified:true}];
 const a=K.assess(s,TODAY);
 assert.equal(a.findings.find(x=>x.id==='KEN-STOCK-EXP:A').state,'RED');
 assert.equal(a.findings.find(x=>x.id==='KEN-STOCK-LOW:B').state,'AMBER');
 assert.equal(a.findings.find(x=>x.id==='KEN-STOCK-FORECAST:C').state,'AMBER');
});
test('missing or bad stock evidence stays on HOLD',()=>{
 const s=base();s.stock=[{id:'A',item:'Food',quantity:-1,minimum:4,expiry:'2026-02-30'}];
 assert(K.assess(s,TODAY).findings.some(x=>x.state==='HOLD'));
});
test('unaccepted, late handovers do not disappear until accepted',()=>{
 const s=base();s.opsHub.handovers=[{id:'A',from:'s1',to:'s2',subject:'Check doors',status:'offered',dueAt:'2026-10-14T12:00:00Z'}];
 assert.equal(K.assess(s,TODAY+'T08:00:00Z').findings.find(x=>x.id==='KEN-HANDOVER:A').state,'RED');
 s.opsHub.handovers[0].status='accepted';
 assert(!K.assess(s,TODAY+'T08:00:00Z').findings.some(x=>x.id==='KEN-HANDOVER:A'));
});
test('manager coverage and unsafe room flag actionable findings',()=>{
 const s=base();s.staff[0].onShift=false;s.rooms=[{id:'r1',name:'Cat airlock',gate:'Latch review',state:'amber'}];
 const a=K.assess(s,TODAY);
 assert(a.findings.some(x=>x.id==='KEN-COVERAGE:SUPERVISOR'&&x.state==='RED'));
 assert(a.findings.some(x=>x.id==='KEN-FACILITY:r1'&&x.state==='AMBER'));
});
test('invalid dates are not taken as verified invoice deadlines',()=>{
 const s=base();s.opsHub.services=[{ref:'S1',status:'completed',evidence:'verified',chargeCents:5000}];
 s.opsHub.invoices=[{id:'I1',serviceRef:'S1',status:'issued',evidence:'verified',amountCents:5000,dueDate:'2026-02-30',paymentsReconciled:true}];
 const a=K.assess(s,TODAY);
 assert.equal(a.outstandingCents,0);
 assert(a.findings.some(x=>x.id==='KEN-REV-INVOICE-HOLD:I1'));
});
test('AUD formatting and amount bounds',()=>{
 assert.equal(K.money(12345),'$123.45');
 assert.equal(K.money(-1),'—');
 assert.equal(K.cents(12.3),null);
 assert.equal(K.cents(100),100);
});