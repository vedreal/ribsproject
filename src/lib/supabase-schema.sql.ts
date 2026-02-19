export const supabaseSql = `
-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY, -- Telegram User ID
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    ribs BIGINT DEFAULT 0,
    referral_code TEXT UNIQUE,
    referred_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    reward INTEGER NOT NULL,
    icon TEXT,
    href TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_tasks table to track completion
CREATE TABLE IF NOT EXISTS user_tasks (
    user_id BIGINT REFERENCES users(id),
    task_id INTEGER REFERENCES tasks(id),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, task_id)
);

-- Create upgrades table
CREATE TABLE IF NOT EXISTS upgrades (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    max_level INTEGER NOT NULL,
    base_cost INTEGER NOT NULL,
    cost_multiplier FLOAT DEFAULT 1.5,
    benefit_description TEXT
);

-- Create user_upgrades table
CREATE TABLE IF NOT EXISTS user_upgrades (
    user_id BIGINT REFERENCES users(id),
    upgrade_id TEXT REFERENCES upgrades(id),
    level INTEGER DEFAULT 1,
    PRIMARY KEY (user_id, upgrade_id)
);

-- Initial tasks
INSERT INTO tasks (title, reward, icon, href) VALUES
('Watch Ads (3/3)', 900, 'Clapperboard', '#'),
('Invite 5 Friends', 600, 'Users', '/referrals'),
('Follow us on X', 300, 'XIcon', '#'),
('Join Telegram Channel', 300, 'Send', '#')
ON CONFLICT DO NOTHING;

-- Initial upgrades
INSERT INTO upgrades (id, name, description, max_level, base_cost, benefit_description) VALUES
('faucet-rate', 'Faucet Rate', 'Increase the amount of RIBS you earn from the faucet.', 10, 2500, '+50 RIBS/2hr per level'),
('tap-power', 'Tap Power', 'Increase the amount of RIBS you earn per tap.', 3, 3000, '+1 RIBS/tap per level'),
('tap-energy', 'Tap Energy', 'Increase your maximum daily tap limit.', 3, 5000, '+1000 Taps per level')
ON CONFLICT DO NOTHING;
`;
