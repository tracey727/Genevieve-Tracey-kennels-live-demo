const test=require('node:test');
const assert=require('node:assert/strict');
const {TOKEN_KEY,create}=require('../GENEVIEVE_CATS_DOGS_LIVE_DEMO/kennel-api.js');

function storage(){
  const m=new Map();
  return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};
}
function response(status,body){
  return {ok:status>=200&&status<300,status,async json(){return body}};
}

test('connect validates before storing and staff uses bearer token',async()=>{
  const seen=[],s=storage();
  const api=create({storage:s,fetchImpl:async(path,opts)=>{
    seen.push({path,opts});
    if(path==='/api/session')return response(200,{facilityId:'f1',role:'manager'});
    if(path==='/api/staff')return response(200,[{name:'Demo Manager'}]);
    return response(404,{error:'not found'});
  }});
  const session=await api.connect('synthetic-secret');
  assert.equal(session.role,'manager');
  assert.equal(s.getItem(TOKEN_KEY),'synthetic-secret');
  const staff=await api.staff();
  assert.equal(staff.length,1);
  assert.equal(seen[0].opts.headers.authorization,'Bearer synthetic-secret');
  assert.equal(seen[1].opts.headers.authorization,'Bearer synthetic-secret');
});

test('rejected connect clears session token',async()=>{
  const s=storage();s.setItem(TOKEN_KEY,'old-token');
  const api=create({storage:s,fetchImpl:async()=>response(401,{error:'invalid or expired token'})});
  await assert.rejects(()=>api.connect('bad-token'),e=>e.status===401);
  assert.equal(s.getItem(TOKEN_KEY),null);
});

test('disconnect removes token and unauthenticated request fails closed',async()=>{
  const s=storage();s.setItem(TOKEN_KEY,'synthetic');
  const api=create({storage:s,fetchImpl:async()=>response(200,{})});
  api.disconnect();
  assert.equal(api.hasToken(),false);
  await assert.rejects(()=>api.staff(),e=>e.status===401);
});


test('animal methods stay on authenticated same-origin API routes',async()=>{
  const seen=[],s=storage();s.setItem(TOKEN_KEY,'synthetic');
  const api=create({storage:s,fetchImpl:async(path,opts)=>{
    seen.push({path,opts});
    if(path==='/api/animals'&&opts.method==='GET')return response(200,[{id:'a1',facility_id:'f1',name:'Demo Dog'}]);
    if(path==='/api/animals'&&opts.method==='POST')return response(201,{id:'a2',facility_id:'f1',name:'New Dog'});
    return response(404,{error:'not found'});
  }});
  const animals=await api.animals();
  assert.equal(animals[0].facility_id,'f1');
  const created=await api.createAnimal({name:'New Dog',species:'Dog'});
  assert.equal(created.id,'a2');
  assert.equal(seen[0].path,'/api/animals');
  assert.equal(seen[1].path,'/api/animals');
  assert.equal(seen[1].opts.method,'POST');
  assert.equal(seen[1].opts.headers.authorization,'Bearer synthetic');
});


test('booking methods use authenticated facility API routes',async()=>{
  const seen=[],s=storage();s.setItem(TOKEN_KEY,'synthetic');
  const api=create({storage:s,fetchImpl:async(path,opts)=>{
    seen.push({path,opts});
    if(path==='/api/bookings'&&opts.method==='GET')return response(200,[]);
    if(path==='/api/bookings'&&opts.method==='POST')return response(201,{id:'b1',status:'due'});
    return response(404,{error:'not found'});
  }});
  assert.deepEqual(await api.bookings(),[]);
  const made=await api.createBooking({animal_id:'a1',booking_type:'drop_off',due_at:'2026-10-16T00:00:00.000Z'});
  assert.equal(made.id,'b1');
  assert.equal(seen[1].opts.method,'POST');
  assert.equal(seen[1].opts.headers.authorization,'Bearer synthetic');
});
