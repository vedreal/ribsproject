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
