-- ============================================================================
-- UF Planner PostgreSQL Schema: Real UF Course Data, Catalog & Program Mappings
-- ============================================================================

CREATE TABLE IF NOT EXISTS terms (
  id VARCHAR(32) PRIMARY KEY,               -- e.g. 'fall-2026'
  code VARCHAR(16) NOT NULL UNIQUE,          -- ONE.UF term code e.g. '2268'
  label VARCHAR(64) NOT NULL,               -- e.g. 'Fall 2026'
  season VARCHAR(16) NOT NULL,              -- 'Fall', 'Spring', 'Summer'
  year INT NOT NULL,                        -- 2026
  sort_term INT NOT NULL,                   -- e.g. 2268
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS courses (
  id VARCHAR(32) PRIMARY KEY,               -- normalized lower-kebab code e.g. 'cop-3530'
  code VARCHAR(16) NOT NULL UNIQUE,          -- standard display code e.g. 'COP 3530'
  course_id VARCHAR(16),                    -- ONE.UF courseId identifier e.g. '010942'
  title VARCHAR(255) NOT NULL,              -- 'Data Structures and Algorithm'
  description TEXT,                         -- course catalog description
  credits_min NUMERIC(3,1) NOT NULL DEFAULT 3.0,
  credits_max NUMERIC(3,1) NOT NULL DEFAULT 3.0,
  credits_display VARCHAR(32) NOT NULL DEFAULT '3',
  dept_code VARCHAR(32),                    -- e.g. '19140000'
  dept_name VARCHAR(128),                   -- 'Computer & Information Science & Engineering'
  raw_prerequisites TEXT,                   -- exact verbatim prerequisite text from ONE.UF / Catalog
  prereq_rules JSONB NOT NULL DEFAULT '{}'::jsonb, -- structured parsing: course codes, rule type, grade notes
  source_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_offerings (
  id SERIAL PRIMARY KEY,
  course_id VARCHAR(32) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  term_code VARCHAR(16) NOT NULL,            -- e.g. '2268'
  term_id VARCHAR(32) NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
  offering_status VARCHAR(16) NOT NULL DEFAULT 'available', -- 'available' (confirmed in SOC), 'predicted', 'unknown'
  section_count INT NOT NULL DEFAULT 0,
  sections_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (course_id, term_code)
);

CREATE TABLE IF NOT EXISTS degree_programs (
  id VARCHAR(64) PRIMARY KEY,               -- e.g. 'cs-bs-eng'
  name VARCHAR(128) NOT NULL,               -- 'Computer Science, B.S.'
  college VARCHAR(128) NOT NULL,            -- 'Herbert Wertheim College of Engineering'
  catalog_year VARCHAR(16) NOT NULL,        -- '2026-2027'
  total_credits INT NOT NULL DEFAULT 120,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS degree_requirements (
  id VARCHAR(64) PRIMARY KEY,               -- e.g. 'critical-tracking', 'major-core', 'computing-electives'
  program_id VARCHAR(64) NOT NULL REFERENCES degree_programs(id) ON DELETE CASCADE,
  name VARCHAR(128) NOT NULL,
  description TEXT,
  required_credits INT NOT NULL,
  category_order INT NOT NULL DEFAULT 1,
  next_course_suggestion VARCHAR(128),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_requirement_mappings (
  id SERIAL PRIMARY KEY,
  course_id VARCHAR(32) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  requirement_id VARCHAR(64) NOT NULL REFERENCES degree_requirements(id) ON DELETE CASCADE,
  is_mandatory BOOLEAN NOT NULL DEFAULT FALSE,
  explanation TEXT NOT NULL,
  catalog_source_url TEXT,
  UNIQUE (course_id, requirement_id)
);

CREATE TABLE IF NOT EXISTS import_logs (
  id SERIAL PRIMARY KEY,
  scope TEXT NOT NULL,
  term_codes TEXT[] NOT NULL DEFAULT '{}',
  courses_imported INT NOT NULL DEFAULT 0,
  offerings_imported INT NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'completed', -- 'in_progress', 'completed', 'failed'
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS student_profiles (
  id VARCHAR(64) PRIMARY KEY,
  display_name VARCHAR(128) NOT NULL,
  program_id VARCHAR(64) NOT NULL REFERENCES degree_programs(id) ON DELETE RESTRICT,
  catalog_year VARCHAR(16) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_course_records (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id VARCHAR(64) NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  course_id VARCHAR(32) REFERENCES courses(id) ON DELETE SET NULL,
  course_code VARCHAR(16) NOT NULL,
  title VARCHAR(255) NOT NULL,
  credits NUMERIC(3,1) NOT NULL CHECK (credits > 0 AND credits <= 20),
  status VARCHAR(16) NOT NULL CHECK (status IN ('completed', 'in-progress', 'planned')),
  source_type VARCHAR(32) NOT NULL CHECK (
    source_type IN ('uf', 'ap', 'dual-enrollment', 'transfer', 'manual')
  ),
  term_label VARCHAR(64),
  planned_semester_id VARCHAR(32) REFERENCES terms(id) ON DELETE SET NULL,
  grade VARCHAR(8),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, course_code)
);

CREATE TABLE IF NOT EXISTS student_course_requirement_applications (
  student_course_id BIGINT NOT NULL REFERENCES student_course_records(id) ON DELETE CASCADE,
  requirement_id VARCHAR(64) NOT NULL REFERENCES degree_requirements(id) ON DELETE CASCADE,
  applied_credits NUMERIC(3,1) NOT NULL CHECK (applied_credits > 0 AND applied_credits <= 20),
  PRIMARY KEY (student_course_id, requirement_id)
);

CREATE TABLE IF NOT EXISTS degree_audit_imports (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id VARCHAR(64) NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  source VARCHAR(32) NOT NULL,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices for rapid querying and filtering
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(code);
CREATE INDEX IF NOT EXISTS idx_offerings_course_term ON course_offerings(course_id, term_id);
CREATE INDEX IF NOT EXISTS idx_offerings_term_id ON course_offerings(term_id);
CREATE INDEX IF NOT EXISTS idx_req_mappings_req ON course_requirement_mappings(requirement_id);
CREATE INDEX IF NOT EXISTS idx_req_mappings_course ON course_requirement_mappings(course_id);
CREATE INDEX IF NOT EXISTS idx_student_courses_student ON student_course_records(student_id);
CREATE INDEX IF NOT EXISTS idx_student_courses_course ON student_course_records(course_id);
CREATE INDEX IF NOT EXISTS idx_student_req_apps_requirement
  ON student_course_requirement_applications(requirement_id);
CREATE INDEX IF NOT EXISTS idx_degree_audit_imports_student
  ON degree_audit_imports(student_id, imported_at DESC);
