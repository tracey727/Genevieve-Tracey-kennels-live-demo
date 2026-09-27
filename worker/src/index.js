import { Client } from 'pg';

const JSON_HEADERS={
  'content-type':'application/json; charset=utf-8',
  'cache-control':'no-store',
  'x-content-type-options':'nosniff',
  'referrer-policy':'no-referrer',
  'permissions-policy':'camera=(), microphone=(), geolocation=()'
};
const ROLES=new Set(['manager','attendant','driver','reception','auditor']);
const WRITE_ANIMALS=new Set(['manager','reception']);
const WRITE_CARE=new Set(['manager','attendant']);
const WRITE_INCIDENTS=new Set(['manager','attendant','driver','reception']);
const WRITE_SAFETY=new Set(['manager','attendant']);

function reply(body,status=200,extra={}){return new Response(JSON.stringify(body),{status,headers:{...JSON_HEADERS,...extra}})}
function isUuid(v){return typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)}
async function sha256(v){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function withDb(env,fn){
  if(!env.HYPERDRIVE?.connectionString)throw new Error('HYPERDRIVE binding is not configured');
  const db=new Client({connectionString:env.HYPERDRIVE.connectionString});
  await db.connect();try{return await fn(db)}finally{await db.end()}
}
async function bodyJson(request){
  const len=Number(request.headers.get('content-length')||0);
  if(len>131072)throw Object.assign(new Error('request too large'),{status:413});
  try{return await request.json()}catch{throw Object.assign(new Error('invalid JSON request'),{status:400})}
}
async function authenticate(db,request){
  const h=request.headers.get('authorization')||'';
  const m=h.match(/^Bearer\s+(.+)$/i);
  if(!m)throw Object.assign(new Error('authentication required'),{status:401});
  const hash=await sha256(m[1]);
  const r=await db.query(`
    SELECT t.id,t.facility_id,t.subject,t.display_name,t.role
    FROM access_tokens t JOIN facilities f ON f.id=t.facility_id
    WHERE t.token_hash=$1 AND t.revoked_at IS NULL
      AND (t.expires_at IS NULL OR t.expires_at>now()) AND f.active=true
    LIMIT 1`,[hash]);
  if(!r.rowCount)throw Object.assign(new Error('invalid or expired token'),{status:401});
  const a=r.rows[0];if(!ROLES.has(a.role))throw Object.assign(new Error('invalid role'),{status:403});return a
}
function need(auth,set){if(!set.has(auth.role))throw Object.assign(new Error('forbidden'),{status:403})}
async function audit(db,auth,eventType,entityType=null,entityId=null,detail={}){
  await db.query(`INSERT INTO audit_events(facility_id,actor_token_id,actor_subject,actor_role,event_type,entity_type,entity_id,detail)
                  VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb)`,
    [auth.facility_id,auth.id,auth.subject,auth.role,eventType,entityType,entityId,JSON.stringify(detail)]);
}
const animalFields=['owner_name','species','name','breed','sex','date_of_birth','microchip','vaccination_status','desexed_status','weight_kg','allergies','diet','medication_plan','physio_plan','behaviour_notes','handling_notes','reactivity','energy','social_confidence','gate_sensitivity','play_style','storm_sensitive','heat_risk','escape_risk','resource_guarding','not_social_today','active'];

async function createAnimal(db,auth,body){
  need(auth,WRITE_ANIMALS);
  if(!body.name||!body.species)throw Object.assign(new Error('name and species are required'),{status:400});
  const id=crypto.randomUUID(), fields=animalFields.filter(k=>body[k]!==undefined);
  const cols=['id','facility_id',...fields], vals=[id,auth.facility_id,...fields.map(k=>body[k])];
  const ps=vals.map((_,i)=>'$'+(i+1)).join(',');
  const r=await db.query(`INSERT INTO animals(${cols.join(',')}) VALUES(${ps}) RETURNING *`,vals);
  await audit(db,auth,'animal.created','animal',id,{name:body.name,species:body.species});return r.rows[0]
}
async function patchAnimal(db,auth,id,body){
  need(auth,WRITE_ANIMALS);const fields=animalFields.filter(k=>body[k]!==undefined&&k!=='species');
  if(!fields.length)throw Object.assign(new Error('no supported fields supplied'),{status:400});
  const vals=fields.map(k=>body[k]), sets=fields.map((k,i)=>k+'=$'+(i+1));vals.push(id,auth.facility_id);
  const r=await db.query(`UPDATE animals SET ${sets.join(',')},updated_at=now() WHERE id=$${vals.length-1} AND facility_id=$${vals.length} RETURNING *`,vals);
  if(!r.rowCount)throw Object.assign(new Error('animal not found'),{status:404});
  await audit(db,auth,'animal.updated','animal',id,{fields});return r.rows[0]
}
async function route(db,request,url,auth){
  const method=request.method.toUpperCase(), f=auth.facility_id;

  if(url.pathname==='/api/session'&&method==='GET')return reply({facilityId:f,subject:auth.subject,displayName:auth.display_name,role:auth.role});
  if(url.pathname==='/api/dashboard'&&method==='GET'){
    const [animals,tasks,incidents,kennels,redStock]=await Promise.all([
      db.query('SELECT count(*)::int count FROM animals WHERE facility_id=$1 AND active=true',[f]),
      db.query("SELECT count(*)::int count FROM care_tasks WHERE facility_id=$1 AND status NOT IN ('completed','cancelled')",[f]),
      db.query("SELECT count(*)::int count FROM incidents WHERE facility_id=$1 AND status<>'closed'",[f]),
      db.query('SELECT count(*)::int count FROM kennels WHERE facility_id=$1 AND active=true',[f]),
      db.query("SELECT count(*)::int count FROM stock_items WHERE facility_id=$1 AND expiry IS NOT NULL AND expiry<current_date",[f])
    ]);
    return reply({animals:animals.rows[0].count,openTasks:tasks.rows[0].count,openIncidents:incidents.rows[0].count,kennels:kennels.rows[0].count,expiredStock:redStock.rows[0].count})
  }
  if(url.pathname==='/api/animals'&&method==='GET')return reply((await db.query('SELECT * FROM animals WHERE facility_id=$1 AND active=true ORDER BY name',[f])).rows);
  if(url.pathname==='/api/animals'&&method==='POST')return reply(await createAnimal(db,auth,await bodyJson(request)),201);
  const am=url.pathname.match(/^\/api\/animals\/([^/]+)$/);
  if(am&&isUuid(am[1])&&method==='PATCH')return reply(await patchAnimal(db,auth,am[1],await bodyJson(request)));
  if(am&&isUuid(am[1])&&method==='DELETE'){
    need(auth,WRITE_ANIMALS);const r=await db.query('UPDATE animals SET active=false,updated_at=now() WHERE id=$1 AND facility_id=$2 RETURNING id,name',[am[1],f]);
    if(!r.rowCount)throw Object.assign(new Error('animal not found'),{status:404});
    await audit(db,auth,'animal.archived','animal',am[1],{name:r.rows[0].name});return reply({ok:true,id:am[1]})
  }

  if(url.pathname==='/api/kennels'&&method==='GET')return reply((await db.query('SELECT * FROM kennels WHERE facility_id=$1 AND active=true ORDER BY zone,name',[f])).rows);
  if(url.pathname==='/api/tasks'&&method==='GET')return reply((await db.query('SELECT * FROM care_tasks WHERE facility_id=$1 ORDER BY due_at NULLS LAST,created_at DESC',[f])).rows);
  if(url.pathname==='/api/tasks'&&method==='POST'){
    need(auth,WRITE_CARE);const b=await bodyJson(request),id=crypto.randomUUID();
    const r=await db.query(`INSERT INTO care_tasks(id,facility_id,animal_id,type,detail,due_at,status,severity,assigned_subject)
      VALUES($1,$2,$3,$4,$5,$6,'open',$7,$8) RETURNING *`,
      [id,f,b.animal_id||null,b.type,b.detail||'',b.due_at||null,b.severity||'green',b.assigned_subject||null]);
    await audit(db,auth,'task.created','care_task',id,{type:b.type});return reply(r.rows[0],201)
  }
  const tm=url.pathname.match(/^\/api\/tasks\/([^/]+)$/);
  if(tm&&isUuid(tm[1])&&method==='PATCH'){
    need(auth,WRITE_CARE);const b=await bodyJson(request), status=b.status;
    if(!['open','in_progress','completed','cancelled'].includes(status))throw Object.assign(new Error('invalid status'),{status:400});
    const r=await db.query('UPDATE care_tasks SET status=$1,completed_at=CASE WHEN $1=\'completed\' THEN now() ELSE completed_at END,updated_at=now() WHERE id=$2 AND facility_id=$3 RETURNING *',[status,tm[1],f]);
    if(!r.rowCount)throw Object.assign(new Error('task not found'),{status:404});
    await audit(db,auth,'task.status','care_task',tm[1],{status});return reply(r.rows[0])
  }

  if(url.pathname==='/api/incidents'&&method==='GET')return reply((await db.query('SELECT * FROM incidents WHERE facility_id=$1 ORDER BY occurred_at DESC',[f])).rows);
  if(url.pathname==='/api/incidents'&&method==='POST'){
    need(auth,WRITE_INCIDENTS);const b=await bodyJson(request),id=crypto.randomUUID();
    if(!['yellow','amber','red'].includes(b.severity))throw Object.assign(new Error('invalid severity'),{status:400});
    const r=await db.query(`INSERT INTO incidents(id,facility_id,animal_id,type,severity,detail,controls,status,reported_by)
      VALUES($1,$2,$3,$4,$5,$6,$7,'open',$8) RETURNING *`,
      [id,f,b.animal_id||null,b.type,b.severity,b.detail||'',b.controls||'',auth.subject]);
    await audit(db,auth,'incident.created','incident',id,{type:b.type,severity:b.severity});return reply(r.rows[0],201)
  }

  if(url.pathname==='/api/safety/daily-ops'&&method==='GET')return reply((await db.query('SELECT * FROM daily_ops WHERE facility_id=$1 AND operation_date=current_date ORDER BY period,item',[f])).rows);
  if(url.pathname==='/api/safety/daily-ops'&&method==='POST'){
    need(auth,WRITE_SAFETY);const b=await bodyJson(request),id=crypto.randomUUID();
    const r=await db.query(`INSERT INTO daily_ops(id,facility_id,operation_date,period,item,completed,completed_at,completed_by)
      VALUES($1,$2,current_date,$3,$4,$5,CASE WHEN $5 THEN now() ELSE NULL END,CASE WHEN $5 THEN $6 ELSE NULL END)
      ON CONFLICT(facility_id,operation_date,period,item) DO UPDATE SET completed=excluded.completed,completed_at=excluded.completed_at,completed_by=excluded.completed_by
      RETURNING *`,[id,f,b.period,b.item,Boolean(b.completed),auth.subject]);
    await audit(db,auth,'daily_ops.updated','daily_ops',r.rows[0].id,{period:b.period,item:b.item,completed:Boolean(b.completed)});return reply(r.rows[0])
  }
  if(url.pathname==='/api/safety/physio'&&method==='GET')return reply((await db.query('SELECT * FROM physio_records WHERE facility_id=$1 ORDER BY observed_at DESC LIMIT 200',[f])).rows);
  if(url.pathname==='/api/safety/physio'&&method==='POST'){
    need(auth,WRITE_SAFETY);const b=await bodyJson(request),id=crypto.randomUUID();
    const r=await db.query(`INSERT INTO physio_records(id,facility_id,animal_id,mobility_observation,comfort_observation,action,note,observed_by)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,[id,f,b.animal_id,b.mobility_observation,b.comfort_observation,b.action,b.note,auth.subject]);
    await audit(db,auth,'physio.observation','physio_record',id,{animal_id:b.animal_id,action:b.action});return reply(r.rows[0],201)
  }
  if(url.pathname==='/api/stock'&&method==='GET')return reply((await db.query(`SELECT *,CASE WHEN expiry IS NOT NULL AND expiry<current_date THEN 'red' WHEN expiry IS NOT NULL AND expiry<=current_date+30 THEN 'amber' WHEN quantity<minimum THEN 'amber' ELSE 'green' END assurance_state FROM stock_items WHERE facility_id=$1 ORDER BY category,item`,[f])).rows);
  if(url.pathname==='/api/compliance'&&method==='GET')return reply((await db.query('SELECT * FROM compliance_evidence WHERE facility_id=$1 ORDER BY item',[f])).rows);
  if(url.pathname==='/api/audit'&&method==='GET')return reply((await db.query('SELECT id,actor_subject,actor_role,event_type,entity_type,entity_id,detail,occurred_at FROM audit_events WHERE facility_id=$1 ORDER BY occurred_at DESC LIMIT 300',[f])).rows);

  return reply({error:'not found'},404)
}

export default {
  async fetch(request,env){
    const url=new URL(request.url), method=request.method.toUpperCase();
    try{
      if(url.pathname==='/api/health'&&method==='GET'){
        return withDb(env,async db=>{const r=await db.query('SELECT current_database() database,current_user role,now() server_time');return reply({ok:true,service:'genevieve-kennels-command-centre',...r.rows[0]})})
      }
      if(!url.pathname.startsWith('/api/')){
        if(env.ASSETS)return env.ASSETS.fetch(request);
        return new Response('Not found',{status:404})
      }
      return withDb(env,async db=>route(db,request,url,await authenticate(db,request)));
    }catch(e){
      console.error(e);const status=e.status||500;
      const message=status>=500?'server error':e.message;
      return reply({error:message},status,status===401?{'www-authenticate':'Bearer realm="GENEVIEVE Kennels"'}:{})
    }
  }
};