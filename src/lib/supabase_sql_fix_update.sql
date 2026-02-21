-- Supabase SQL Fix Update
-- Execute these queries in your Supabase SQL Editor

-- Update users table with missing production columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_checkin TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS checkin_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS next_faucet_claim TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ton_balance FLOAT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rare_cards INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS epic_cards INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mythic_cards INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referrer_id BIGINT REFERENCES users(id);

-- Ensure RLS is enabled and correct (simple public access for demo, restrict for production)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile." ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- RPC for incrementing ribs securely
CREATE OR REPLACE FUNCTION increment_ribs(user_id BIGINT, amount BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET ribs = ribs + amount
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;


 -- FIX UPDATE
-- ============================================================
-- JALANKAN SQL INI DI SUPABASE DASHBOARD > SQL EDITOR
-- Perbaikan untuk memastikan semua data tersimpan dengan benar
-- ============================================================

-- 1. Pastikan kolom yang dibutuhkan ada di tabel users
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_checkin TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS checkin_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS next_faucet_claim TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ton_balance FLOAT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rare_cards INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS epic_cards INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mythic_cards INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referrer_id BIGINT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ribs BIGINT DEFAULT 0;

-- 2. Aktifkan RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 3. Hapus policies lama
DROP POLICY IF EXISTS "Allow anon select users" ON users;
DROP POLICY IF EXISTS "Allow anon insert users" ON users;
DROP POLICY IF EXISTS "Allow anon update users" ON users;
DROP POLICY IF EXISTS "Allow anon upsert users" ON users;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON users;
DROP POLICY IF EXISTS "Users can update own profile." ON users;

-- 4. Buat policies baru yang benar untuk anonymous access
CREATE POLICY "Allow anon select users"
ON users FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow anon insert users"
ON users FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anon update users"
ON users FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- 5. Buat/perbaiki fungsi increment_ribs
-- Fungsi ini diperlukan untuk update ribs secara atomic dari tap
CREATE OR REPLACE FUNCTION increment_ribs(user_id BIGINT, amount BIGINT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users
  SET ribs = GREATEST(0, COALESCE(ribs, 0) + amount)
  WHERE id = user_id;
END;
$$;

-- 6. Grant execute permission ke anon
GRANT EXECUTE ON FUNCTION increment_ribs(BIGINT, BIGINT) TO anon;

-- ============================================================
-- Verifikasi: jalankan query ini untuk cek apakah sudah benar
-- SELECT id, username, ribs, ton_balance, rare_cards, epic_cards, mythic_cards
-- FROM users LIMIT 10;
-- ============================================================

-- Tambah kolom untuk menyimpan jatah spin harian
ALTER TABLE users ADD COLUMN IF NOT EXISTS free_spins_left   INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ad_spins_left     INTEGER DEFAULT 2;
ALTER TABLE users ADD COLUMN IF NOT EXISTS spins_reset_date  DATE    DEFAULT CURRENT_DATE;

-- Verifikasi
SELECT id, username, free_spins_left, ad_spins_left, spins_reset_date FROM users LIMIT 5;


-- Add upgrade level columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS upgrade_faucet_rate  INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS upgrade_tap_power    INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS upgrade_tap_energy   INTEGER DEFAULT 1;

-- Verify
SELECT id, username, upgrade_faucet_rate, upgrade_tap_power, upgrade_tap_energy FROM users LIMIT 5;


-- Task completion tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS task_daily_ads_count    INTEGER DEFAULT 3;
ALTER TABLE users ADD COLUMN IF NOT EXISTS task_daily_ads_reset    DATE    DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS task_invite3_done       BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS task_invite5_done       BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS task_follow_tg_done     BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS task_follow_x_done      BOOLEAN DEFAULT FALSE;

-- Referral reward tracking (to avoid double-rewarding same referral)
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_rewarded_count INTEGER DEFAULT 0;

-- Verify
SELECT id, username,
  task_daily_ads_count, task_daily_ads_reset,
  task_invite3_done, task_invite5_done,
  task_follow_tg_done, task_follow_x_done,
  referral_rewarded_count
FROM users LIMIT 5;


-- Ensure referred_by column exists (stores the inviter's Telegram user ID)
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by BIGINT DEFAULT NULL;

-- Index for fast referral count queries
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);

-- Verify
SELECT id, username, referred_by, referral_rewarded_count FROM users LIMIT 5;


