BEGIN;

ALTER TABLE access_tokens DROP CONSTRAINT access_tokens_role_check;
ALTER TABLE access_tokens
  ADD CONSTRAINT access_tokens_role_check
  CHECK (role IN ('manager','attendant','driver','reception','auditor','owner'));
ALTER TABLE access_tokens
  ADD COLUMN animal_id uuid REFERENCES animals(id) ON DELETE CASCADE;

CREATE TABLE staff_members (
  id uuid PRIMARY KEY,
  facility_id uuid NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  subject text NOT NULL,
  name text NOT NULL,
  role text NOT NULL,
  on_shift boolean NOT NULL DEFAULT false,
  first_aid boolean NOT NULL DEFAULT false,
  animal_first_aid boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(facility_id,subject)
);

CREATE TABLE bookings (
  id uuid PRIMARY KEY,
  facility_id uuid NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  animal_id uuid NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  booking_type text NOT NULL CHECK (booking_type IN ('drop_off','pick_up')),
  due_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'due' CHECK (status IN ('due','completed','cancelled')),
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX bookings_facility_due_idx ON bookings(facility_id,due_at,status);

CREATE TABLE custody_records (
  id uuid PRIMARY KEY,
  facility_id uuid NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  animal_id uuid NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('drop_off','pick_up')),
  staff_subject text NOT NULL,
  identity_status text,
  authority_detail text,
  vaccination_status text,
  medication_detail text,
  belongings text,
  condition_note text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX custody_facility_time_idx ON custody_records(facility_id,occurred_at DESC);

CREATE TABLE rounds (
  id uuid PRIMARY KEY,
  facility_id uuid NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  zone text NOT NULL,
  species text NOT NULL,
  due_at timestamptz,
  status text NOT NULL DEFAULT 'due' CHECK (status IN ('due','in_progress','completed')),
  progress integer NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  assigned_subject text,
  checks jsonb NOT NULL DEFAULT '{}'::jsonb,
  severity text NOT NULL DEFAULT 'green' CHECK (severity IN ('green','amber','red','hold')),
  note text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rounds_facility_due_idx ON rounds(facility_id,status,due_at);

CREATE TABLE transports (
  id uuid PRIMARY KEY,
  facility_id uuid NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  animal_id uuid NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  direction text NOT NULL,
  address text,
  due_at timestamptz,
  driver_subject text,
  vehicle text,
  crate text,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','in_progress','completed','cancelled')),
  temperature numeric(5,2),
  checklist jsonb NOT NULL DEFAULT '{}'::jsonb,
  note text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX transports_facility_due_idx ON transports(facility_id,status,due_at);

CREATE TABLE alerts (
  id uuid PRIMARY KEY,
  facility_id uuid NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  severity text NOT NULL CHECK (severity IN ('green','amber','red','hold')),
  title text NOT NULL,
  detail text NOT NULL,
  owner_subject text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);
CREATE INDEX alerts_facility_open_idx ON alerts(facility_id,status,severity,created_at DESC);

CREATE TABLE emergency_state (
  facility_id uuid PRIMARY KEY REFERENCES facilities(id) ON DELETE CASCADE,
  active boolean NOT NULL DEFAULT false,
  type text,
  owner_subject text,
  started_at timestamptz,
  checks jsonb NOT NULL DEFAULT '{}'::jsonb,
  stood_down_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE owner_updates (
  id uuid PRIMARY KEY,
  facility_id uuid NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  animal_id uuid NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  message text NOT NULL,
  approved_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX owner_updates_facility_animal_idx ON owner_updates(facility_id,animal_id,created_at DESC);

CREATE TABLE pickup_authority_requests (
  id uuid PRIMARY KEY,
  facility_id uuid NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  animal_id uuid NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  collector text NOT NULL,
  note text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','declined','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by text,
  reviewed_at timestamptz
);
CREATE INDEX pickup_requests_facility_idx ON pickup_authority_requests(facility_id,status,created_at DESC);

COMMIT;
