import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { Client } from 'pg';
import worker from '../src/index.js';

const DB=process.env.KENNELS_TEST_DB_URL;
if(!DB) throw new Error('KENNELS_TEST_DB_URL is required');
const env={HYPERDRIVE:{connectionString:DB}};

const FAC_A='11111111-1111-4111-8111-111111111111';
const FAC_B='22222222-2222-4222-8222-222222222222';
const ANIMAL_B='32222222-2222-4222-8222-222222222222';
const token=(s)=>'synthetic-'+s+'-only';
const hash=(v)=>createHash('sha256').update(v).digest('hex');

async function request(path,{method='GET',bearer,body}={}){
  const headers={};
  if(bearer) headers.authorization='Bearer '+bearer;
  if(body!==undefined) headers['content-type']='application/json';
  return worker.fetch(new Request('https://kennels.test'+path,{
    method,headers,body:body===undefined?undefined:JSON.stringify(body)
  }),env);
}
async function json(res){return {status:res.status,body:await res.json()}}

const db=new Client({connectionString:DB});
await db.connect();
try{
  await db.query(`
    INSERT INTO facilities(id,name,timezone,active)
    VALUES($1,'Synthetic Isolation Kennel','Australia/Brisbane',true)
    ON CONFLICT(id) DO UPDATE SET active=true
  `,[FAC_B]);
  await db.query(`
    INSERT INTO animals(id,facility_id,species,name,active)
    VALUES($1,$2,'Dog','Synthetic Facility B Dog',true)
    ON CONFLICT(id) DO UPDATE SET facility_id=excluded.facility_id,name=excluded.name,active=true
  `,[ANIMAL_B,FAC_B]);

  const identities=[
    ['aa111111-1111-4111-8111-111111111111',FAC_A,'manager.a','Manager A','manager',token('manager-a')],
    ['aa111111-1111-4111-8111-111111111112',FAC_A,'attendant.a','Attendant A','attendant',token('attendant-a')],
    ['aa111111-1111-4111-8111-111111111113',FAC_A,'auditor.a','Auditor A','auditor',token('auditor-a')],
    ['bb222222-2222-4222-8222-222222222221',FAC_B,'manager.b','Manager B','manager',token('manager-b')]
  ];
  for(const [id,facility,subject,display,role,raw] of identities){
    await db.query(`
      INSERT INTO access_tokens(id,facility_id,token_hash,subject,display_name,role,revoked_at,expires_at)
      VALUES($1,$2,$3,$4,$5,$6,NULL,now()+interval '1 hour')
      ON CONFLICT(token_hash) DO UPDATE SET revoked_at=NULL,expires_at=excluded.expires_at
    `,[id,facility,hash(raw),subject,display,role]);
  }

  let r=await json(await request('/api/session'));
  assert.equal(r.status,401,'missing token must be rejected');

  r=await json(await request('/api/session',{bearer:'synthetic-wrong-token'}));
  assert.equal(r.status,401,'unknown token must be rejected');

  r=await json(await request('/api/session',{bearer:token('manager-a')}));
  assert.equal(r.status,200);
  assert.equal(r.body.facilityId,FAC_A);
  assert.equal(r.body.role,'manager');

  r=await json(await request('/api/animals',{bearer:token('manager-a')}));
  assert.equal(r.status,200);
  assert.ok(r.body.length>=6);
  assert.ok(r.body.every(x=>x.facility_id===FAC_A),'facility A list leaked another facility');
  assert.ok(!r.body.some(x=>x.id===ANIMAL_B),'facility B animal leaked to facility A');

  r=await json(await request('/api/animals',{bearer:token('manager-b')}));
  assert.equal(r.status,200);
  assert.ok(r.body.some(x=>x.id===ANIMAL_B));
  assert.ok(r.body.every(x=>x.facility_id===FAC_B),'facility B list leaked another facility');

  r=await json(await request('/api/animals/'+ANIMAL_B,{
    method:'PATCH',bearer:token('manager-a'),body:{owner_name:'MUST NOT CHANGE'}
  }));
  assert.equal(r.status,404,'cross-facility animal patch must fail');
  const ownerCheck=await db.query('SELECT owner_name FROM animals WHERE id=$1',[ANIMAL_B]);
  assert.notEqual(ownerCheck.rows[0].owner_name,'MUST NOT CHANGE');

  r=await json(await request('/api/workforce-events',{
    method:'POST',bearer:token('attendant-a'),
    body:{event_type:'break',minutes:10,subject:'manager.a',detail:'must be denied'}
  }));
  assert.equal(r.status,403,'attendant must not record another staff identity');

  r=await json(await request('/api/compliance',{
    method:'POST',bearer:token('auditor-a'),
    body:{item:'Synthetic audit-only item',status:'current'}
  }));
  assert.equal(r.status,403,'auditor must remain read-only');

  const successName='Atomic Success '+Date.now();
  r=await json(await request('/api/animals',{
    method:'POST',bearer:token('manager-a'),body:{name:successName,species:'Dog'}
  }));
  assert.equal(r.status,201,'valid atomic mutation should succeed');
  const createdId=r.body.id;
  const pair=await db.query(`
    SELECT
      (SELECT count(*)::int FROM animals WHERE id=$1 AND facility_id=$2) animal_count,
      (SELECT count(*)::int FROM audit_events WHERE entity_id=$1 AND facility_id=$2 AND event_type='animal.created') audit_count
  `,[createdId,FAC_A]);
  assert.equal(pair.rows[0].animal_count,1);
  assert.equal(pair.rows[0].audit_count,1,'successful mutation must persist its audit event');

  await db.query(`ALTER TABLE audit_events
    ADD CONSTRAINT synthetic_force_audit_failure
    CHECK (event_type <> 'animal.created')`);
  try{
    const rollbackName='Atomic Rollback '+Date.now();
    r=await json(await request('/api/animals',{
      method:'POST',bearer:token('manager-a'),body:{name:rollbackName,species:'Dog'}
    }));
    assert.equal(r.status,500,'forced audit failure must fail the request');
    const rolled=await db.query('SELECT count(*)::int AS n FROM animals WHERE facility_id=$1 AND name=$2',[FAC_A,rollbackName]);
    assert.equal(rolled.rows[0].n,0,'business mutation survived failed audit; rollback broken');
  }finally{
    await db.query('ALTER TABLE audit_events DROP CONSTRAINT IF EXISTS synthetic_force_audit_failure');
  }

  await db.query('UPDATE access_tokens SET revoked_at=now() WHERE token_hash=$1',[hash(token('manager-a'))]);
  r=await json(await request('/api/session',{bearer:token('manager-a')}));
  assert.equal(r.status,401,'revoked token must be rejected');

  console.log('PASS: Kennels synthetic authentication, tenant isolation, revocation and atomic audit rollback');
}finally{
  await db.query('ALTER TABLE audit_events DROP CONSTRAINT IF EXISTS synthetic_force_audit_failure').catch(()=>{});
  await db.end();
}
