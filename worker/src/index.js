import { Client } from 'pg';

const JSON_HEADERS={
  'content-type':'application/json; charset=utf-8',
  'cache-control':'no-store',
  'x-content-type-options':'nosniff',
  'referrer-policy':'no-referrer',
  'permissions-policy':'camera=(), microphone=(), geolocation=()'
};
const ROLES=new Set(['manager','attendant','driver','reception','auditor','owner']);
const WRITE_ANIMALS=new Set(['manager','reception']);
const WRITE_CARE=new Set(['manager','attendant']);
const WRITE_INCIDENTS=new Set(['manager','attendant','driver','reception']);
const WRITE_SAFETY=new Set(['manager','attendant']);
const WRITE_OPERATIONS=new Set(['manager','attendant','driver','reception']);
const MANAGER_RECEPTION=new Set(['manager','reception']);

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
    SELECT t.id,t.facility_id,t.subject,t.display_name,t.role,t.animal_id
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

  if(url.pathname==='/api/session'&&method==='GET')return reply({facilityId:f,subject:auth.subject,displayName:auth.display_name,role:auth.role,animalId:auth.animal_id||null});

  // Owner tokens are scoped to exactly one animal and may only use the owner routes below.
  if(url.pathname==='/api/owner/me'&&method==='GET'){
    if(auth.role!=='owner'||!auth.animal_id)throw Object.assign(new Error('forbidden'),{status:403});
    const animal=(await db.query('SELECT id,species,name,breed,vaccination_status,diet,medication_plan,behaviour_notes FROM animals WHERE id=$1 AND facility_id=$2 AND active=true',[auth.animal_id,f])).rows[0];
    if(!animal)throw Object.assign(new Error('animal not found'),{status:404});
    const updates=(await db.query('SELECT id,message,created_at FROM owner_updates WHERE facility_id=$1 AND animal_id=$2 ORDER BY created_at DESC LIMIT 100',[f,auth.animal_id])).rows;
    return reply({animal,updates});
  }
  if(url.pathname==='/api/owner/pickup-authority-requests'&&method==='POST'){
    if(auth.role!=='owner'||!auth.animal_id)throw Object.assign(new Error('forbidden'),{status:403});
    const b=await bodyJson(request),id=crypto.randomUUID();
    if(!String(b.collector||'').trim())throw Object.assign(new Error('collector is required'),{status:400});
    const r=await db.query(`INSERT INTO pickup_authority_requests(id,facility_id,animal_id,collector,note)
      VALUES($1,$2,$3,$4,$5) RETURNING *`,[id,f,auth.animal_id,String(b.collector).trim(),b.note||null]);
    await audit(db,auth,'pickup_authority.requested','pickup_authority_request',id,{animal_id:auth.animal_id});
    return reply(r.rows[0],201);
  }
  if(auth.role==='owner')throw Object.assign(new Error('forbidden'),{status:403});

  if(url.pathname==='/api/staff'&&method==='GET')
    return reply((await db.query('SELECT id,subject,name,role,on_shift,first_aid,animal_first_aid FROM staff_members WHERE facility_id=$1 AND active=true ORDER BY name',[f])).rows);

  if(url.pathname==='/api/bookings'&&method==='GET')
    return reply((await db.query('SELECT * FROM bookings WHERE facility_id=$1 ORDER BY due_at',[f])).rows);
  if(url.pathname==='/api/bookings'&&method==='POST'){
    need(auth,MANAGER_RECEPTION);const b=await bodyJson(request),id=crypto.randomUUID();
    if(!isUuid(b.animal_id)||!['drop_off','pick_up'].includes(b.booking_type)||!b.due_at)throw Object.assign(new Error('animal_id, booking_type and due_at are required'),{status:400});
    const r=await db.query(`INSERT INTO bookings(id,facility_id,animal_id,booking_type,due_at,status,created_by)
      VALUES($1,$2,$3,$4,$5,'due',$6) RETURNING *`,[id,f,b.animal_id,b.booking_type,b.due_at,auth.subject]);
    await audit(db,auth,'booking.created','booking',id,{animal_id:b.animal_id,booking_type:b.booking_type});return reply(r.rows[0],201);
  }
  const bm=url.pathname.match(/^\/api\/bookings\/([^/]+)$/);
  if(bm&&isUuid(bm[1])&&method==='PATCH'){
    need(auth,MANAGER_RECEPTION);const b=await bodyJson(request);
    if(!['due','completed','cancelled'].includes(b.status))throw Object.assign(new Error('invalid status'),{status:400});
    const r=await db.query('UPDATE bookings SET status=$1,updated_at=now() WHERE id=$2 AND facility_id=$3 RETURNING *',[b.status,bm[1],f]);
    if(!r.rowCount)throw Object.assign(new Error('booking not found'),{status:404});
    await audit(db,auth,'booking.status','booking',bm[1],{status:b.status});return reply(r.rows[0]);
  }

  if(url.pathname==='/api/custody'&&method==='GET')
    return reply((await db.query('SELECT * FROM custody_records WHERE facility_id=$1 ORDER BY occurred_at DESC LIMIT 300',[f])).rows);
  if(url.pathname==='/api/custody'&&method==='POST'){
    need(auth,WRITE_OPERATIONS);const b=await bodyJson(request),id=crypto.randomUUID();
    if(!isUuid(b.animal_id)||!['drop_off','pick_up'].includes(b.direction)||!String(b.condition_note||'').trim())throw Object.assign(new Error('animal_id, direction and condition_note are required'),{status:400});
    const r=await db.query(`INSERT INTO custody_records(id,facility_id,animal_id,direction,staff_subject,identity_status,authority_detail,vaccination_status,medication_detail,belongings,condition_note)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [id,f,b.animal_id,b.direction,auth.subject,b.identity_status||null,b.authority_detail||null,b.vaccination_status||null,b.medication_detail||null,b.belongings||null,b.condition_note]);
    await db.query('UPDATE animals SET updated_at=now() WHERE id=$1 AND facility_id=$2',[b.animal_id,f]);
    await audit(db,auth,'custody.'+b.direction,'custody_record',id,{animal_id:b.animal_id});return reply(r.rows[0],201);
  }

  if(url.pathname==='/api/rounds'&&method==='GET')
    return reply((await db.query('SELECT * FROM rounds WHERE facility_id=$1 ORDER BY due_at NULLS LAST',[f])).rows);
  const rm=url.pathname.match(/^\/api\/rounds\/([^/]+)$/);
  if(rm&&isUuid(rm[1])&&method==='PATCH'){
    need(auth,WRITE_SAFETY);const b=await bodyJson(request);
    const status=b.status;
    if(status&&!['due','in_progress','completed'].includes(status))throw Object.assign(new Error('invalid status'),{status:400});
    const progress=Number.isInteger(b.progress)?Math.max(0,Math.min(100,b.progress)):null;
    const r=await db.query(`UPDATE rounds SET
      status=COALESCE($1,status),progress=COALESCE($2,progress),checks=COALESCE($3::jsonb,checks),severity=COALESCE($4,severity),note=COALESCE($5,note),
      completed_at=CASE WHEN $1='completed' THEN now() ELSE completed_at END,updated_at=now()
      WHERE id=$6 AND facility_id=$7 RETURNING *`,
      [status||null,progress,b.checks?JSON.stringify(b.checks):null,b.severity||null,b.note||null,rm[1],f]);
    if(!r.rowCount)throw Object.assign(new Error('round not found'),{status:404});
    await audit(db,auth,'round.updated','round',rm[1],{status:r.rows[0].status,progress:r.rows[0].progress,severity:r.rows[0].severity});return reply(r.rows[0]);
  }

  if(url.pathname==='/api/transports'&&method==='GET')
    return reply((await db.query('SELECT * FROM transports WHERE facility_id=$1 ORDER BY due_at NULLS LAST',[f])).rows);
  const trm=url.pathname.match(/^\/api\/transports\/([^/]+)$/);
  if(trm&&isUuid(trm[1])&&method==='PATCH'){
    need(auth,new Set(['manager','driver']));const b=await bodyJson(request);
    if(b.status&&!['scheduled','in_progress','completed','cancelled'].includes(b.status))throw Object.assign(new Error('invalid status'),{status:400});
    const r=await db.query(`UPDATE transports SET status=COALESCE($1,status),temperature=COALESCE($2,temperature),checklist=COALESCE($3::jsonb,checklist),note=COALESCE($4,note),
      completed_at=CASE WHEN $1='completed' THEN now() ELSE completed_at END,updated_at=now()
      WHERE id=$5 AND facility_id=$6 RETURNING *`,
      [b.status||null,b.temperature??null,b.checklist?JSON.stringify(b.checklist):null,b.note||null,trm[1],f]);
    if(!r.rowCount)throw Object.assign(new Error('transport not found'),{status:404});
    await audit(db,auth,'transport.updated','transport',trm[1],{status:r.rows[0].status,temperature:r.rows[0].temperature});return reply(r.rows[0]);
  }

  if(url.pathname==='/api/alerts'&&method==='GET')
    return reply((await db.query('SELECT * FROM alerts WHERE facility_id=$1 ORDER BY created_at DESC LIMIT 300',[f])).rows);
  const alm=url.pathname.match(/^\/api\/alerts\/([^/]+)$/);
  if(alm&&isUuid(alm[1])&&method==='PATCH'){
    need(auth,WRITE_OPERATIONS);const b=await bodyJson(request);
    if(!['open','closed'].includes(b.status))throw Object.assign(new Error('invalid status'),{status:400});
    const r=await db.query("UPDATE alerts SET status=$1,closed_at=CASE WHEN $1='closed' THEN now() ELSE NULL END WHERE id=$2 AND facility_id=$3 RETURNING *",[b.status,alm[1],f]);
    if(!r.rowCount)throw Object.assign(new Error('alert not found'),{status:404});
    await audit(db,auth,'alert.status','alert',alm[1],{status:b.status});return reply(r.rows[0]);
  }

  if(url.pathname==='/api/emergency'&&method==='GET'){
    const r=await db.query('SELECT * FROM emergency_state WHERE facility_id=$1',[f]);
    return reply(r.rows[0]||{facility_id:f,active:false,type:null,checks:{}});
  }
  if(url.pathname==='/api/emergency'&&method==='POST'){
    need(auth,new Set(['manager','attendant']));const b=await bodyJson(request);
    if(b.action==='activate'){
      if(!String(b.type||'').trim())throw Object.assign(new Error('type is required'),{status:400});
      const r=await db.query(`INSERT INTO emergency_state(facility_id,active,type,owner_subject,started_at,checks,stood_down_at,updated_at)
        VALUES($1,true,$2,$3,now(),'{}'::jsonb,NULL,now())
        ON CONFLICT(facility_id) DO UPDATE SET active=true,type=excluded.type,owner_subject=excluded.owner_subject,started_at=now(),checks='{}'::jsonb,stood_down_at=NULL,updated_at=now()
        RETURNING *`,[f,b.type,auth.subject]);
      await audit(db,auth,'emergency.activated','emergency',null,{type:b.type});return reply(r.rows[0]);
    }
    if(b.action==='check'){
      const r=await db.query('UPDATE emergency_state SET checks=$1::jsonb,updated_at=now() WHERE facility_id=$2 RETURNING *',[JSON.stringify(b.checks||{}),f]);
      if(!r.rowCount)throw Object.assign(new Error('no emergency state'),{status:404});
      await audit(db,auth,'emergency.checks','emergency',null,{});return reply(r.rows[0]);
    }
    if(b.action==='stand_down'){
      const r=await db.query("UPDATE emergency_state SET active=false,stood_down_at=now(),updated_at=now() WHERE facility_id=$1 RETURNING *",[f]);
      if(!r.rowCount)throw Object.assign(new Error('no emergency state'),{status:404});
      await audit(db,auth,'emergency.stood_down','emergency',null,{});return reply(r.rows[0]);
    }
    throw Object.assign(new Error('invalid emergency action'),{status:400});
  }

  if(url.pathname==='/api/owner-updates'&&method==='GET'){
    const animalId=url.searchParams.get('animal_id');
    if(!isUuid(animalId))throw Object.assign(new Error('valid animal_id required'),{status:400});
    return reply((await db.query('SELECT * FROM owner_updates WHERE facility_id=$1 AND animal_id=$2 ORDER BY created_at DESC LIMIT 100',[f,animalId])).rows);
  }
  if(url.pathname==='/api/owner-updates'&&method==='POST'){
    need(auth,MANAGER_RECEPTION);const b=await bodyJson(request),id=crypto.randomUUID();
    if(!isUuid(b.animal_id)||!String(b.message||'').trim())throw Object.assign(new Error('animal_id and message are required'),{status:400});
    const r=await db.query('INSERT INTO owner_updates(id,facility_id,animal_id,message,approved_by) VALUES($1,$2,$3,$4,$5) RETURNING *',[id,f,b.animal_id,b.message,auth.subject]);
    await audit(db,auth,'owner_update.created','owner_update',id,{animal_id:b.animal_id});return reply(r.rows[0],201);
  }
  if(url.pathname==='/api/pickup-authority-requests'&&method==='GET'){
    need(auth,MANAGER_RECEPTION);return reply((await db.query('SELECT * FROM pickup_authority_requests WHERE facility_id=$1 ORDER BY created_at DESC',[f])).rows);
  }
  const prm=url.pathname.match(/^\/api\/pickup-authority-requests\/([^/]+)$/);
  if(prm&&isUuid(prm[1])&&method==='PATCH'){
    need(auth,MANAGER_RECEPTION);const b=await bodyJson(request);
    if(!['approved','declined','cancelled','pending'].includes(b.status))throw Object.assign(new Error('invalid status'),{status:400});
    const r=await db.query('UPDATE pickup_authority_requests SET status=$1,reviewed_by=$2,reviewed_at=now() WHERE id=$3 AND facility_id=$4 RETURNING *',[b.status,auth.subject,prm[1],f]);
    if(!r.rowCount)throw Object.assign(new Error('request not found'),{status:404});
    await audit(db,auth,'pickup_authority.reviewed','pickup_authority_request',prm[1],{status:b.status});return reply(r.rows[0]);
  }

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
  if(url.pathname==='/api/stock'&&method==='POST'){
    need(auth,MANAGER_RECEPTION);const b=await bodyJson(request),id=crypto.randomUUID();
    if(!String(b.item||'').trim()||!String(b.category||'').trim())throw Object.assign(new Error('category and item are required'),{status:400});
    const r=await db.query(`INSERT INTO stock_items(id,facility_id,category,item,quantity,unit,minimum,expiry,sds_current)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [id,f,b.category,b.item,Number(b.quantity||0),b.unit||null,Number(b.minimum||0),b.expiry||null,b.sds_current??null]);
    await audit(db,auth,'stock.created','stock_item',id,{item:b.item});return reply(r.rows[0],201);
  }
  const sm=url.pathname.match(/^\/api\/stock\/([^/]+)$/);
  if(sm&&isUuid(sm[1])&&method==='PATCH'){
    need(auth,MANAGER_RECEPTION);const b=await bodyJson(request);
    const r=await db.query(`UPDATE stock_items SET quantity=COALESCE($1,quantity),minimum=COALESCE($2,minimum),expiry=COALESCE($3,expiry),sds_current=COALESCE($4,sds_current),updated_at=now()
      WHERE id=$5 AND facility_id=$6 RETURNING *`,[b.quantity??null,b.minimum??null,b.expiry??null,b.sds_current??null,sm[1],f]);
    if(!r.rowCount)throw Object.assign(new Error('stock item not found'),{status:404});
    await audit(db,auth,'stock.updated','stock_item',sm[1],{});return reply(r.rows[0]);
  }
  if(url.pathname==='/api/workforce-events'&&method==='POST'){
    need(auth,new Set(['manager','attendant']));const b=await bodyJson(request),id=crypto.randomUUID();
    if(!['break','close_shift','overtime','lone_worker_check'].includes(b.event_type))throw Object.assign(new Error('invalid event_type'),{status:400});
    const r=await db.query('INSERT INTO workforce_events(id,facility_id,subject,event_type,minutes,detail) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',[id,f,b.subject||auth.subject,b.event_type,b.minutes??null,b.detail||null]);
    await audit(db,auth,'workforce.event','workforce_event',id,{event_type:b.event_type,subject:b.subject||auth.subject});return reply(r.rows[0],201);
  }
  if(url.pathname==='/api/compliance'&&method==='GET')return reply((await db.query('SELECT * FROM compliance_evidence WHERE facility_id=$1 ORDER BY item',[f])).rows);
  if(url.pathname==='/api/compliance'&&method==='POST'){
    need(auth,new Set(['manager','auditor']));const b=await bodyJson(request),id=crypto.randomUUID();
    if(!String(b.item||'').trim()||!['current','not_current','hold'].includes(b.status))throw Object.assign(new Error('item and valid status are required'),{status:400});
    const r=await db.query(`INSERT INTO compliance_evidence(id,facility_id,item,status,evidence_ref,reviewed_by,reviewed_at)
      VALUES($1,$2,$3,$4,$5,$6,now())
      ON CONFLICT(facility_id,item) DO UPDATE SET status=excluded.status,evidence_ref=excluded.evidence_ref,reviewed_by=excluded.reviewed_by,reviewed_at=now()
      RETURNING *`,[id,f,b.item,b.status,b.evidence_ref||null,auth.subject]);
    await audit(db,auth,'compliance.updated','compliance_evidence',r.rows[0].id,{item:b.item,status:b.status});return reply(r.rows[0]);
  }
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