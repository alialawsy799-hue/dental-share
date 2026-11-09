-- Dental Share schema contract for a later PostgreSQL migration.
-- Not applied in the prototype. Tenant tables carry clinic_id and must be
-- enforced with server checks and row-level security, not UI filters.

-- Example session setting once a real auth layer exists:
-- SET app.clinic_id = '<clinic uuid>';

CREATE TABLE clinics (
  id text PRIMARY KEY,
  name text NOT NULL,
  city text NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'pending'))
);

CREATE TABLE patients (
  id text PRIMARY KEY,
  clinic_id text NOT NULL REFERENCES clinics (id),
  file_number text NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  medical_history text NOT NULL DEFAULT '',
  UNIQUE (clinic_id, file_number)
);

CREATE TABLE appointments (
  id text PRIMARY KEY,
  clinic_id text NOT NULL REFERENCES clinics (id),
  patient_id text NOT NULL REFERENCES patients (id),
  doctor_id text NOT NULL,
  chair_id text NOT NULL,
  starts_at timestamptz NOT NULL,
  duration_min integer NOT NULL,
  status text NOT NULL
);

CREATE INDEX appointments_clinic_start_idx ON appointments (clinic_id, starts_at);

CREATE TABLE expenses (
  id text PRIMARY KEY,
  clinic_id text NOT NULL REFERENCES clinics (id),
  bucket text NOT NULL CHECK (bucket IN ('paid', 'unpaid', 'estimated')),
  amount_iqd integer NOT NULL CHECK (amount_iqd > 0),
  source_type text NOT NULL,
  source_id text,
  UNIQUE (clinic_id, source_type, source_id)
);

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY clinic_isolation ON patients
--   USING (clinic_id = current_setting('app.clinic_id', true));
-- Repeat for every clinic-owned table. Lab and merchant policies use their own tenant keys.
