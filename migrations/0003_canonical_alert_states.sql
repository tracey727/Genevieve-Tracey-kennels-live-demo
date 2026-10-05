BEGIN;
-- Canonical GENEVIEVE alert vocabulary migration.
UPDATE kennels SET state='amber' WHERE state='yellow';
UPDATE care_tasks SET severity='amber' WHERE severity='yellow';
UPDATE rounds SET severity='amber' WHERE severity='yellow';
UPDATE alerts SET severity='amber' WHERE severity='yellow';
UPDATE incidents SET severity='amber' WHERE severity='yellow';

ALTER TABLE kennels DROP CONSTRAINT IF EXISTS kennels_state_check;
ALTER TABLE kennels ADD CONSTRAINT kennels_state_check CHECK (state IN ('green','amber','red','hold'));
ALTER TABLE care_tasks DROP CONSTRAINT IF EXISTS care_tasks_severity_check;
ALTER TABLE care_tasks ADD CONSTRAINT care_tasks_severity_check CHECK (severity IN ('green','amber','red','hold'));
ALTER TABLE rounds DROP CONSTRAINT IF EXISTS rounds_severity_check;
ALTER TABLE rounds ADD CONSTRAINT rounds_severity_check CHECK (severity IN ('green','amber','red','hold'));
ALTER TABLE alerts DROP CONSTRAINT IF EXISTS alerts_severity_check;
ALTER TABLE alerts ADD CONSTRAINT alerts_severity_check CHECK (severity IN ('green','amber','red','hold'));
ALTER TABLE incidents DROP CONSTRAINT IF EXISTS incidents_severity_check;
ALTER TABLE incidents ADD CONSTRAINT incidents_severity_check CHECK (severity IN ('amber','red','hold'));
COMMIT;
