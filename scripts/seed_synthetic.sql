-- SYNTHETIC DEMO DATA ONLY. Never substitute real owner/staff/animal information.
-- Apply after migrations to a disposable/synthetic facility.
BEGIN;

INSERT INTO facilities(id,name,timezone)
VALUES ('11111111-1111-4111-8111-111111111111','GENEVIEVE Synthetic Kennel','Australia/Brisbane')
ON CONFLICT (id) DO NOTHING;

INSERT INTO staff_members(id,facility_id,subject,name,role,on_shift,first_aid,animal_first_aid)
VALUES
('21111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','manager.demo','Demo Manager','Manager',true,true,true),
('21111111-1111-4111-8111-111111111112','11111111-1111-4111-8111-111111111111','attendant.demo','Demo Attendant','Attendant',true,true,true)
ON CONFLICT (facility_id,subject) DO NOTHING;

INSERT INTO animals(id,facility_id,owner_name,species,name,breed,vaccination_status,diet,behaviour_notes)
VALUES
('31111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','Synthetic Owner','Dog','Demo Dog','Mixed breed','Current','Synthetic diet','Demo behaviour notes'),
('31111111-1111-4111-8111-111111111112','11111111-1111-4111-8111-111111111111','Synthetic Owner','Cat','Demo Cat','Domestic shorthair','Current','Synthetic diet','Demo cat notes')
ON CONFLICT (id) DO NOTHING;

INSERT INTO kennels(id,facility_id,name,zone,species,type,state,active)
VALUES
('41111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','Demo Dog Run','Dog Block','Dog','General','green',true),
('41111111-1111-4111-8111-111111111112','11111111-1111-4111-8111-111111111111','Demo Cat Suite','Cattery','Cat','Quiet','green',true)
ON CONFLICT (facility_id,name) DO NOTHING;

INSERT INTO stock_items(id,facility_id,category,item,quantity,unit,minimum,expiry)
VALUES
('51111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','Food','Synthetic dog food',12,'meals',6,current_date+60),
('51111111-1111-4111-8111-111111111112','11111111-1111-4111-8111-111111111111','PPE','Synthetic gloves',2,'boxes',3,NULL)
ON CONFLICT (facility_id,item) DO NOTHING;

COMMIT;
