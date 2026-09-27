BEGIN;

CREATE TABLE facilities (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  timezone text NOT NULL DEFAULT 'Australia/Brisbane',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE access_tokens (
  id uuid PRIMARY KEY,
  facility_id uuid NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  token_hash char(64) NOT NULL UNIQUE,
  subject text NOT NULL,
  display_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('manager','attendant','driver','reception','auditor')),
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX access_tokens_facility_idx ON access_tokens(facility_id);

CREATE TABLE animals (
  id uuid PRIMARY KEY,
  facility_id uuid NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  owner_name text,
  species text NOT NULL CHECK (species IN ('Dog','Cat')),
  name text NOT NULL,
  breed text, sex text, date_of_birth date, microchip text,
  vaccination_status text, desexed_status text, weight_kg numeric(8,2),
  allergies text, diet text, medication_plan text, physio_plan text,
  behaviour_notes text, handling_notes text, reactivity text, energy text,
  social_confidence text, gate_sensitivity text, play_style text,
  storm_sensitive boolean NOT NULL DEFAULT false,
  heat_risk boolean NOT NULL DEFAULT false,
  escape_risk boolean NOT NULL DEFAULT false,
  resource_guarding boolean NOT NULL DEFAULT false,
  not_social_today boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX animals_facility_idx ON animals(facility_id,active,name);

CREATE TABLE kennels (
  id uuid PRIMARY KEY,
  facility_id uuid NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  name text NOT NULL, zone text, species text NOT NULL CHECK (species IN ('Dog','Cat','Both')),
  type text, state text NOT NULL DEFAULT 'green' CHECK (state IN ('green','yellow','amber','red','hold')),
  temperature numeric(5,2), humidity numeric(5,2), gate_status text,
  occupied_animal_id uuid REFERENCES animals(id) ON DELETE SET NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(facility_id,name)
);

CREATE TABLE care_tasks (
  id uuid PRIMARY KEY,
  facility_id uuid NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  animal_id uuid REFERENCES animals(id) ON DELETE SET NULL,
  type text NOT NULL, detail text NOT NULL DEFAULT '', due_at timestamptz,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','completed','cancelled')),
  severity text NOT NULL DEFAULT 'green' CHECK (severity IN ('green','yellow','amber','red','hold')),
  assigned_subject text, completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX care_tasks_facility_due_idx ON care_tasks(facility_id,status,due_at);

CREATE TABLE incidents (
  id uuid PRIMARY KEY,
  facility_id uuid NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  animal_id uuid REFERENCES animals(id) ON DELETE SET NULL,
  type text NOT NULL, severity text NOT NULL CHECK (severity IN ('yellow','amber','red')),
  detail text NOT NULL, controls text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','review','closed')),
  reported_by text NOT NULL, occurred_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);
CREATE INDEX incidents_facility_idx ON incidents(facility_id,status,occurred_at DESC);

CREATE TABLE stock_items (
  id uuid PRIMARY KEY,
  facility_id uuid NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  category text NOT NULL, item text NOT NULL, quantity numeric(12,2) NOT NULL DEFAULT 0,
  unit text, minimum numeric(12,2) NOT NULL DEFAULT 0, expiry date,
  sds_current boolean, active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(facility_id,item)
);

CREATE TABLE daily_ops (
  id uuid PRIMARY KEY,
  facility_id uuid NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  operation_date date NOT NULL,
  period text NOT NULL CHECK (period IN ('Morning','Midday','Evening')),
  item text NOT NULL, completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz, completed_by text,
  UNIQUE(facility_id,operation_date,period,item)
);

CREATE TABLE physio_records (
  id uuid PRIMARY KEY,
  facility_id uuid NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  animal_id uuid NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  mobility_observation text NOT NULL, comfort_observation text NOT NULL,
  action text NOT NULL, note text NOT NULL, observed_by text NOT NULL,
  observed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX physio_facility_animal_idx ON physio_records(facility_id,animal_id,observed_at DESC);

CREATE TABLE workforce_events (
  id uuid PRIMARY KEY,
  facility_id uuid NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  subject text NOT NULL, event_type text NOT NULL CHECK (event_type IN ('break','close_shift','overtime','lone_worker_check')),
  minutes integer, detail text, occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE compliance_evidence (
  id uuid PRIMARY KEY,
  facility_id uuid NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  item text NOT NULL, status text NOT NULL DEFAULT 'not_current' CHECK (status IN ('current','not_current','hold')),
  evidence_ref text, reviewed_by text, reviewed_at timestamptz,
  UNIQUE(facility_id,item)
);

CREATE TABLE audit_events (
  id bigserial PRIMARY KEY,
  facility_id uuid NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  actor_token_id uuid REFERENCES access_tokens(id) ON DELETE SET NULL,
  actor_subject text NOT NULL, actor_role text NOT NULL,
  event_type text NOT NULL, entity_type text, entity_id uuid,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_events_facility_time_idx ON audit_events(facility_id,occurred_at DESC);

COMMIT;
