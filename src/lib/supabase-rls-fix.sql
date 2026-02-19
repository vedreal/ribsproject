-- ============================================================
-- JALANKAN SQL INI DI SUPABASE DASHBOARD > SQL EDITOR
-- ============================================================
-- Masalah: Row Level Security (RLS) memblokir operasi dari
-- anonymous client (frontend). Policies ini harus dibuat agar
-- app bisa insert/update/select data user.
-- ============================================================

-- 1. Pastikan RLS aktif di tabel users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 2. Hapus policy lama jika ada (hindari konflik)
DROP POLICY IF EXISTS "Allow anon select users" ON users;
DROP POLICY IF EXISTS "Allow anon insert users" ON users;
DROP POLICY IF EXISTS "Allow anon update users" ON users;
DROP POLICY IF EXISTS "Allow anon upsert users" ON users;

-- 3. Buat policy baru

-- SELECT: Siapapun bisa baca data user (untuk leaderboard, dll)
CREATE POLICY "Allow anon select users"
ON users FOR SELECT
TO anon
USING (true);

-- INSERT: Anon bisa insert user baru (saat pertama kali login via Telegram)
CREATE POLICY "Allow anon insert users"
ON users FOR INSERT
TO anon
WITH CHECK (true);

-- UPDATE: Anon bisa update data user (tap ribs, dll)
CREATE POLICY "Allow anon update users"
ON users FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- ============================================================
-- Untuk tabel lainnya (tasks, user_tasks, dll)
-- ============================================================

-- Tasks: read-only untuk anon
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon select tasks" ON tasks;
CREATE POLICY "Allow anon select tasks"
ON tasks FOR SELECT
TO anon
USING (true);

-- User Tasks: anon bisa insert completion
ALTER TABLE user_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon select user_tasks" ON user_tasks;
DROP POLICY IF EXISTS "Allow anon insert user_tasks" ON user_tasks;
CREATE POLICY "Allow anon select user_tasks"
ON user_tasks FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert user_tasks"
ON user_tasks FOR INSERT TO anon WITH CHECK (true);

-- ============================================================
-- Buat atau perbaiki fungsi increment_ribs (atomic update)
-- Ini mencegah race condition saat banyak tap terjadi bersamaan
-- ============================================================
CREATE OR REPLACE FUNCTION increment_ribs(user_id BIGINT, amount BIGINT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER  -- Jalankan sebagai owner, bypass RLS
AS $$
BEGIN
  INSERT INTO users (id, ribs, referral_code)
  VALUES (user_id, GREATEST(0, amount), 'ref_' || user_id::TEXT)
  ON CONFLICT (id) DO UPDATE
  SET ribs = GREATEST(0, users.ribs + amount);
END;
$$;

-- Berikan permission ke anon untuk memanggil fungsi ini
GRANT EXECUTE ON FUNCTION increment_ribs(BIGINT, BIGINT) TO anon;
