-- SYNTHETIC DEMO DATA ONLY.
-- Canonical live-simulator seed for GENEVIEVE Kennels Command.
-- Never substitute real owner, staff, animal-medical or payment information.

BEGIN;

INSERT INTO facilities(id,name,timezone,active)
VALUES ('11111111-1111-4111-8111-111111111111','GENEVIEVE Synthetic Kennel','Australia/Brisbane',true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO staff_members(id,facility_id,subject,name,role,on_shift,first_aid,animal_first_aid)
VALUES
('21111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','manager.demo','Demo Manager','manager',true,true,true),
('21111111-1111-4111-8111-111111111112','11111111-1111-4111-8111-111111111111','attendant.demo','Demo Attendant','attendant',true,true,true),
('21111111-1111-4111-8111-111111111113','11111111-1111-4111-8111-111111111111','reception.demo','Demo Reception','reception',true,true,false),
('21111111-1111-4111-8111-111111111114','11111111-1111-4111-8111-111111111111','driver.demo','Demo Driver','driver',true,true,true)
ON CONFLICT (facility_id,subject) DO NOTHING;

INSERT INTO animals(
 id,facility_id,owner_name,species,name,breed,sex,vaccination_status,diet,medication_plan,physio_plan,
 behaviour_notes,handling_notes,reactivity,energy,social_confidence,gate_sensitivity,play_style,
 storm_sensitive,heat_risk,escape_risk,resource_guarding,not_social_today
)
VALUES
('31111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','Synthetic Owner A','Dog','Max','Labrador','Male','Current','Sensitive skin diet','1 tablet with food','Two-person transfer if mobility reduced','Friendly; monitor arousal','Slow lead-up at gate','4','7','8','Medium','Social',false,true,false,false,false),
('31111111-1111-4111-8111-111111111112','11111111-1111-4111-8111-111111111111','Synthetic Owner B','Cat','Luna','Domestic shorthair','Female','Current','Renal wet food','Renal medication','Gentle mobility observation','Prefers quiet spaces','Low-stress handling','2','4','6','Low','Independent',true,false,true,false,false),
('31111111-1111-4111-8111-111111111113','11111111-1111-4111-8111-111111111111','Synthetic Owner C','Dog','Buddy','Kelpie cross','Male','Current','Standard kennel diet',NULL,NULL,'High energy; compatible play only','Secure gate before lead change','6','9','7','High','Fast play',false,true,true,false,false),
('31111111-1111-4111-8111-111111111114','11111111-1111-4111-8111-111111111111','Synthetic Owner D','Cat','Milo','Domestic medium hair','Male','Current','Standard cat diet',NULL,NULL,'May hide after environmental change','Allow settling time','1','3','5','Low','Solo',false,false,false,false,true),
('31111111-1111-4111-8111-111111111115','11111111-1111-4111-8111-111111111111','Synthetic Owner E','Dog','Ruby','Staffy cross','Female','Current','Sensitive stomach diet',NULL,NULL,'Calm with known handlers','Quiet approach','3','5','7','Medium','Gentle',true,true,false,false,false),
('31111111-1111-4111-8111-111111111116','11111111-1111-4111-8111-111111111111','Synthetic Owner F','Cat','Simba','Domestic shorthair','Male','Evidence awaiting check','Standard cat diet',NULL,NULL,'New arrival; observe appetite and hiding','Airlock discipline','2','5','4','Medium','Solo',false,false,true,false,false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO kennels(id,facility_id,name,zone,species,type,state,temperature,humidity,gate_status,occupied_animal_id,active)
VALUES
('41111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','Quiet Dog Run 1','Kennel Block A','Dog','Quiet','green',23.0,48.0,'Secure','31111111-1111-4111-8111-111111111111',true),
('41111111-1111-4111-8111-111111111112','11111111-1111-4111-8111-111111111111','Dog Run 2','Kennel Block B','Dog','General','green',24.0,50.0,'Secure','31111111-1111-4111-8111-111111111113',true),
('41111111-1111-4111-8111-111111111113','11111111-1111-4111-8111-111111111111','Dog Run 3','Kennel Block B','Dog','General','amber',27.0,54.0,'Secure','31111111-1111-4111-8111-111111111115',true),
('41111111-1111-4111-8111-111111111114','11111111-1111-4111-8111-111111111111','Cat Suite 4','Cattery','Cat','Quiet','green',22.0,45.0,'Secure','31111111-1111-4111-8111-111111111112',true),
('41111111-1111-4111-8111-111111111115','11111111-1111-4111-8111-111111111111','Cat Suite 5','Cattery','Cat','Quiet','green',22.0,46.0,'Secure','31111111-1111-4111-8111-111111111114',true),
('41111111-1111-4111-8111-111111111116','11111111-1111-4111-8111-111111111111','Cat Suite 6','Cattery','Cat','Arrival hold','hold',22.0,46.0,'Airlock check due','31111111-1111-4111-8111-111111111116',true)
ON CONFLICT (facility_id,name) DO NOTHING;

INSERT INTO bookings(id,facility_id,animal_id,booking_type,due_at,status,created_by)
VALUES
('a1111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','31111111-1111-4111-8111-111111111116','drop_off',now()+interval '80 minutes','due','reception.demo'),
('a1111111-1111-4111-8111-111111111112','11111111-1111-4111-8111-111111111111','31111111-1111-4111-8111-111111111114','pick_up',now()+interval '150 minutes','due','reception.demo'),
('a1111111-1111-4111-8111-111111111113','11111111-1111-4111-8111-111111111111','31111111-1111-4111-8111-111111111111','pick_up',now()+interval '300 minutes','due','reception.demo')
ON CONFLICT (id) DO NOTHING;

INSERT INTO care_tasks(id,facility_id,animal_id,type,detail,due_at,status,severity,assigned_subject)
VALUES
('61111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','31111111-1111-4111-8111-111111111111','Medication','Give 1 tablet with food',now()+interval '25 minutes','open','amber','attendant.demo'),
('61111111-1111-4111-8111-111111111112','11111111-1111-4111-8111-111111111111','31111111-1111-4111-8111-111111111112','Vet appointment','Annual vaccination appointment',now()+interval '280 minutes','open','red','manager.demo'),
('61111111-1111-4111-8111-111111111113','11111111-1111-4111-8111-111111111111',NULL,'Facility','Check Cat Suite 6 airlock before Simba arrives',now()+interval '55 minutes','open','amber','attendant.demo')
ON CONFLICT (id) DO NOTHING;

INSERT INTO rounds(id,facility_id,zone,species,due_at,status,progress,assigned_subject,checks,severity,note)
VALUES
('71111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','Kennel Block A','Dog',now()-interval '80 minutes','completed',100,'attendant.demo','{"sighted":true,"water":true,"food":true,"behaviour":true}'::jsonb,'green','Completed without exception'),
('71111111-1111-4111-8111-111111111112','11111111-1111-4111-8111-111111111111','Cattery Suites 1-6','Cat',now()+interval '20 minutes','in_progress',60,'attendant.demo','{"sighted":true,"water":true,"food":true,"behaviour":false}'::jsonb,'amber','Simba arrival airlock check remains open'),
('71111111-1111-4111-8111-111111111113','11111111-1111-4111-8111-111111111111','Property & Perimeter','Facility',now()+interval '140 minutes','due',0,'driver.demo','{}'::jsonb,'green',NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO transports(id,facility_id,animal_id,direction,address,due_at,driver_subject,vehicle,crate,status,temperature,checklist,note)
VALUES
('81111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','31111111-1111-4111-8111-111111111116','Collect','Synthetic owner address',now()+interval '70 minutes','driver.demo','Pet Van 1','Cat carrier C-12','scheduled',NULL,'{}'::jsonb,'Synthetic transport job'),
('81111111-1111-4111-8111-111111111112','11111111-1111-4111-8111-111111111111','31111111-1111-4111-8111-111111111114','Return home','Synthetic owner address',now()+interval '165 minutes','driver.demo','Pet Van 1','Cat carrier C-08','scheduled',NULL,'{}'::jsonb,'Synthetic transport job')
ON CONFLICT (id) DO NOTHING;

INSERT INTO stock_items(id,facility_id,category,item,quantity,unit,minimum,expiry,sds_current)
VALUES
('51111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','Food','Sensitive skin dog diet',18,'meals',10,current_date+33,NULL),
('51111111-1111-4111-8111-111111111112','11111111-1111-4111-8111-111111111111','Food','Renal cat wet food',8,'meals',10,current_date+115,NULL),
('51111111-1111-4111-8111-111111111113','11111111-1111-4111-8111-111111111111','Medication','Medication fridge supplies',14,'items',5,current_date-12,NULL),
('51111111-1111-4111-8111-111111111114','11111111-1111-4111-8111-111111111111','PPE','Nitrile gloves',2,'boxes',3,NULL,NULL),
('51111111-1111-4111-8111-111111111115','11111111-1111-4111-8111-111111111111','Cleaning','Approved disinfectant',6,'litres',3,current_date+127,true)
ON CONFLICT (facility_id,item) DO NOTHING;

INSERT INTO alerts(id,facility_id,severity,title,detail,owner_subject,status)
VALUES
('91111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','amber','Max requires two-person transfer','Quiet Dog Run 1 - mobility safety instruction','manager.demo','open'),
('91111111-1111-4111-8111-111111111112','11111111-1111-4111-8111-111111111111','red','Expired stock: Medication fridge supplies','Synthetic expired stock should be removed from use','manager.demo','open'),
('91111111-1111-4111-8111-111111111113','11111111-1111-4111-8111-111111111111','amber','Cat Suite 6 airlock check due','Complete before Simba arrival','attendant.demo','open')
ON CONFLICT (id) DO NOTHING;

INSERT INTO daily_ops(id,facility_id,operation_date,period,item,completed,completed_at,completed_by)
VALUES
('b1111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111',current_date,'Morning','Staff sign-on and role check',true,now(),'manager.demo'),
('b1111111-1111-4111-8111-111111111112','11111111-1111-4111-8111-111111111111',current_date,'Morning','Animal headcount against register',true,now(),'attendant.demo'),
('b1111111-1111-4111-8111-111111111113','11111111-1111-4111-8111-111111111111',current_date,'Morning','Gate, fence and yard inspection',false,NULL,NULL)
ON CONFLICT (facility_id,operation_date,period,item) DO NOTHING;

INSERT INTO compliance_evidence(id,facility_id,item,status,evidence_ref,reviewed_by,reviewed_at)
VALUES
('c1111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','Animal welfare policy and Five Domains checks','current','SYNTHETIC-DEMO','manager.demo',now()),
('c1111111-1111-4111-8111-111111111112','11111111-1111-4111-8111-111111111111','Emergency drills and evacuation records','hold','SYNTHETIC-DEMO','manager.demo',now())
ON CONFLICT (facility_id,item) DO NOTHING;

INSERT INTO physio_records(id,facility_id,animal_id,mobility_observation,comfort_observation,action,note,observed_by)
VALUES
('d1111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','31111111-1111-4111-8111-111111111111','Mild change observed','Possible discomfort - monitor','Supervisor review','Synthetic mobility observation only; no diagnosis','attendant.demo')
ON CONFLICT (id) DO NOTHING;

INSERT INTO workforce_events(id,facility_id,subject,event_type,minutes,detail)
VALUES
('e1111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','attendant.demo','break',20,'Synthetic fatigue-control evidence'),
('e1111111-1111-4111-8111-111111111112','11111111-1111-4111-8111-111111111111','driver.demo','lone_worker_check',NULL,'Synthetic check-in complete')
ON CONFLICT (id) DO NOTHING;

INSERT INTO incidents(id,facility_id,animal_id,type,severity,detail,controls,status,reported_by)
VALUES
('f1111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','31111111-1111-4111-8111-111111111113','Near miss','amber','Synthetic gate-control near miss','Gate secured; supervisor review','review','attendant.demo')
ON CONFLICT (id) DO NOTHING;

INSERT INTO emergency_state(facility_id,active,type,owner_subject,started_at,checks,stood_down_at)
VALUES ('11111111-1111-4111-8111-111111111111',false,NULL,NULL,NULL,'{}'::jsonb,NULL)
ON CONFLICT (facility_id) DO NOTHING;

INSERT INTO owner_updates(id,facility_id,animal_id,message,approved_by)
VALUES
('12111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','31111111-1111-4111-8111-111111111111','Synthetic owner update: Max settled well after morning care.','manager.demo'),
('12111111-1111-4111-8111-111111111112','11111111-1111-4111-8111-111111111111','31111111-1111-4111-8111-111111111112','Synthetic owner update: Luna is resting in her quiet suite.','manager.demo')
ON CONFLICT (id) DO NOTHING;

COMMIT;
