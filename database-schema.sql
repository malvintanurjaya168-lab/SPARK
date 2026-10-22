-- SPARK Database Schema
-- Student Progress & Reward Keeper
-- SMA Presiden

-- Enable UUID extension if needed
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: users
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    nomor_induk TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('siswa', 'guru', 'kesiswaan', 'admin_pembina_asrama')),
    kelas TEXT,
    angkatan TEXT,
    password TEXT,
    initial_points INTEGER DEFAULT 100,
    wali_kelas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_nomor_induk ON users(nomor_induk);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_kelas ON users(kelas);
CREATE INDEX IF NOT EXISTS idx_users_angkatan ON users(angkatan);

-- ============================================
-- TABLE: semesters
-- ============================================
CREATE TABLE IF NOT EXISTS semesters (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure only one semester is active at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_semesters_active ON semesters(is_active) WHERE is_active = TRUE;

-- ============================================
-- TABLE: point_categories
-- ============================================
CREATE TABLE IF NOT EXISTS point_categories (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('pelanggaran', 'reward')),
    severity TEXT CHECK (severity IN ('ringan', 'sedang', 'berat')),
    points_value INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for filtering by type
CREATE INDEX IF NOT EXISTS idx_point_categories_type ON point_categories(type);

-- ============================================
-- TABLE: point_logs
-- ============================================
CREATE TABLE IF NOT EXISTS point_logs (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id BIGINT NOT NULL REFERENCES point_categories(id) ON DELETE RESTRICT,
    recorded_by BIGINT NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    semester_id BIGINT NOT NULL REFERENCES semesters(id) ON DELETE RESTRICT,
    points_changed INTEGER NOT NULL,
    notes TEXT,
    location TEXT NOT NULL DEFAULT 'sekolah' CHECK (location IN ('sekolah', 'asrama', 'luar')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_point_logs_student_id ON point_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_point_logs_category_id ON point_logs(category_id);
CREATE INDEX IF NOT EXISTS idx_point_logs_recorded_by ON point_logs(recorded_by);
CREATE INDEX IF NOT EXISTS idx_point_logs_semester_id ON point_logs(semester_id);
CREATE INDEX IF NOT EXISTS idx_point_logs_location ON point_logs(location);
CREATE INDEX IF NOT EXISTS idx_point_logs_created_at ON point_logs(created_at DESC);

-- ============================================
-- TABLE: point_requests
-- ============================================
CREATE TABLE IF NOT EXISTS point_requests (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id BIGINT NOT NULL REFERENCES point_categories(id) ON DELETE RESTRICT,
    semester_id BIGINT REFERENCES semesters(id) ON DELETE SET NULL,
    recorder_id BIGINT NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    points_value INTEGER NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    location TEXT NOT NULL DEFAULT 'sekolah' CHECK (location IN ('sekolah', 'asrama', 'luar')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for filtering requests
CREATE INDEX IF NOT EXISTS idx_point_requests_student_id ON point_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_point_requests_category_id ON point_requests(category_id);
CREATE INDEX IF NOT EXISTS idx_point_requests_semester_id ON point_requests(semester_id);
CREATE INDEX IF NOT EXISTS idx_point_requests_recorder_id ON point_requests(recorder_id);
CREATE INDEX IF NOT EXISTS idx_point_requests_status ON point_requests(status);
CREATE INDEX IF NOT EXISTS idx_point_requests_created_at ON point_requests(created_at DESC);

-- ============================================
-- INSERT DEFAULT DATA
-- ============================================

-- Insert default semester (if none exists)
INSERT INTO semesters (name, start_date, end_date, is_active)
SELECT 'Semester Ganjil 2025/2026', '2025-07-15', '2026-01-15', TRUE
WHERE NOT EXISTS (SELECT 1 FROM semesters WHERE is_active = TRUE);

-- Insert default point categories (if none exists)
INSERT INTO point_categories (name, type, severity, points_value) VALUES
-- Pelanggaran
('Terlambat Sekolah', 'pelanggaran', 'ringan', -2),
('Tidak Memakai Seragam Lengkap', 'pelanggaran', 'ringan', -3),
('Bolos Jam Pelajaran', 'pelanggaran', 'sedang', -5),
('Merokok di Lingkungan Sekolah', 'pelanggaran', 'berat', -10),
('Berkelahi', 'pelanggaran', 'berat', -15),
('Mencuri', 'pelanggaran', 'berat', -20),
-- Rewards
('Mengikuti Kegiatan Ekstrakurikuler', 'reward', NULL, 2),
('Membantu Teman', 'reward', NULL, 3),
('Menjaga Kebersihan Kelas', 'reward', NULL, 2),
('Mengikuti Lomba Sekolah', 'reward', NULL, 5),
('Juara Kelas', 'reward', NULL, 10),
('Juara Lomba Tingkat Kabupaten/Kota', 'reward', NULL, 15)
ON CONFLICT DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_requests ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Allow authenticated read access" ON users
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow kesiswaan full access" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = (SELECT id FROM auth.users() WHERE id = users.id)
            AND role = 'kesiswaan'
        )
    );

-- Semesters table policies
CREATE POLICY "Allow authenticated read access" ON semesters
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow kesiswaan full access" ON semesters
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = (SELECT id FROM auth.users() WHERE id = users.id)
            AND role = 'kesiswaan'
        )
    );

-- Point categories policies
CREATE POLICY "Allow authenticated read access" ON point_categories
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow kesiswaan full access" ON point_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = (SELECT id FROM auth.users() WHERE id = users.id)
            AND role = 'kesiswaan'
        )
    );

-- Point logs policies
CREATE POLICY "Allow students to see own logs" ON point_logs
    FOR SELECT USING (
        student_id = (SELECT id FROM auth.users() WHERE id = users.id)
    );

CREATE POLICY "Allow kesiswaan full access" ON point_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = (SELECT id FROM auth.users() WHERE id = users.id)
            AND role = 'kesiswaan'
        )
    );

CREATE POLICY "Allow guru to see own recorded logs" ON point_logs
    FOR SELECT USING (
        recorded_by = (SELECT id FROM auth.users() WHERE id = users.id)
    );

-- Point requests policies
CREATE POLICY "Allow kesiswaan full access" ON point_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = (SELECT id FROM auth.users() WHERE id = users.id)
            AND role = 'kesiswaan'
        )
    );

CREATE POLICY "Allow guru to see own requests" ON point_requests
    FOR SELECT USING (
        recorder_id = (SELECT id FROM auth.users() WHERE id = users.id)
    );

-- ============================================
-- TRIGGERS AND FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp (if needed in future)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View for student points summary
CREATE OR REPLACE VIEW student_points_summary AS
SELECT 
    u.id,
    u.nomor_induk,
    u.name,
    u.kelas,
    u.angkatan,
    u.initial_points,
    COALESCE(SUM(pl.points_changed), 0) as total_points_changed,
    u.initial_points + COALESCE(SUM(pl.points_changed), 0) as current_points,
    COUNT(pl.id) as total_logs
FROM users u
LEFT JOIN point_logs pl ON u.id = pl.student_id
WHERE u.role = 'siswa'
GROUP BY u.id, u.nomor_induk, u.name, u.kelas, u.angkatan, u.initial_points;

-- View for location distribution statistics
CREATE OR REPLACE VIEW location_distribution AS
SELECT 
    location,
    COUNT(*) as total_logs,
    SUM(CASE WHEN points_changed < 0 THEN 1 ELSE 0 END) as violations,
    SUM(CASE WHEN points_changed > 0 THEN 1 ELSE 0 END) as rewards
FROM point_logs
GROUP BY location;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Grant select on all tables to authenticated users
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant insert/update/delete on specific tables to authenticated users
GRANT INSERT, UPDATE, DELETE ON users TO authenticated;
GRANT INSERT, UPDATE, DELETE ON point_logs TO authenticated;
GRANT INSERT, UPDATE, DELETE ON point_requests TO authenticated;
