import { Send, Clapperboard, Users } from 'lucide-react';
import { XIcon } from '@/components/ribs/x-icon';
import type { ElementType } from 'react';
import { supabase } from './supabase';

export type Task = {
  id: number;
  title: string;
  reward: number;
  Icon: ElementType;
  href: string;
};

const iconMap: Record<string, ElementType> = {
  Clapperboard,
  Users,
  XIcon,
  Send,
};

export const tasks: Task[] = [
  {
    id: 1,
    title: 'Join our Telegram Channel',
    reward: 5000,
    Icon: Send,
    href: 'https://t.me/ribs_announcements',
  },
  {
    id: 2,
    title: 'Follow us on X',
    reward: 3000,
    Icon: XIcon,
    href: 'https://x.com/ribs_project',
  },
];

export const leaderboardData = [
  { rank: 1, username: 'RibsMaster', avatarSeed: '1', ribs: 1000000 },
  { rank: 2, username: 'TappingPro', avatarSeed: '2', ribs: 850000 },
];

export const userProfile = {
  rank: 150,
  username: 'Player123',
  referralCode: 'REF123',
  totalRibs: 12500,
};

// ── Get user profile ────────────────────────────────────────
export async function getUserProfile(telegramId: number) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', telegramId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('getUserProfile error:', error);
    }
    return data ?? null;
  } catch (e) {
    console.error('getUserProfile exception:', e);
    return null;
  }
}

// ── Sync user (upsert) ──────────────────────────────────────
export async function syncUser(user: {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
}) {
  try {
    const { data, error } = await supabase
      .from('users')
      .upsert(
        {
          id: user.id,
          username: user.username || '',
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          referral_code: `ref_${user.id}`,
        },
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (error) console.error('syncUser error:', error);
    return data ?? null;
  } catch (e) {
    console.error('syncUser exception:', e);
    return null;
  }
}

// ── Daily check-in ──────────────────────────────────────────
export async function checkIn(telegramId: number): Promise<{
  success: boolean;
  message?: string;
  count?: number;
}> {
  try {
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('last_checkin, checkin_count, ribs')
      .eq('id', telegramId)
      .single();

    if (fetchError || !user) {
      return { success: false, message: 'User not found' };
    }

    const todayDate = new Date().toISOString().split('T')[0];

    if (user.last_checkin) {
      const lastDate = new Date(user.last_checkin).toISOString().split('T')[0];
      if (lastDate === todayDate) {
        return { success: false, message: 'Already checked in today' };
      }
    }

    const newCount = (user.checkin_count ?? 0) + 1;
    const newRibs = (user.ribs ?? 0) + 200;

    const { error: updateError } = await supabase
      .from('users')
      .update({
        last_checkin: new Date().toISOString(),
        checkin_count: newCount,
        ribs: newRibs,
      })
      .eq('id', telegramId);

    if (updateError) {
      return { success: false, message: updateError.message };
    }

    return { success: true, count: newCount };
  } catch (e) {
    console.error('checkIn exception:', e);
    return { success: false, message: 'Unexpected error' };
  }
}

// ── Claim faucet ────────────────────────────────────────────
export async function claimFaucet(telegramId: number, amount: number): Promise<string> {
  try {
    const nextClaim = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    // Ambil ribs saat ini
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('ribs')
      .eq('id', telegramId)
      .single();

    if (fetchError || !user) {
      throw new Error('User not found');
    }

    const newRibs = (user.ribs ?? 0) + amount;

    const { error: updateError } = await supabase
      .from('users')
      .update({
        ribs: newRibs,
        next_faucet_claim: nextClaim,
      })
      .eq('id', telegramId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return nextClaim;
  } catch (e) {
    console.error('claimFaucet exception:', e);
    throw e;
  }
}

// ── Save spin reward ────────────────────────────────────────
export async function saveSpinReward(telegramId: number, reward: string): Promise<void> {
  try {
    if (reward === 'Try Again!') return;

    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('ribs, ton_balance, rare_cards, epic_cards, mythic_cards')
      .eq('id', telegramId)
      .single();

    if (fetchError || !user) {
      console.error('saveSpinReward: user not found', fetchError);
      return;
    }

    const update: Record<string, number> = {};

    if (reward.includes('TON')) {
      const amount = parseFloat(reward.split(' ')[0]);
      update.ton_balance = (user.ton_balance ?? 0) + amount;
    } else if (reward.includes('RIBS')) {
      const amount = parseInt(reward.split(' ')[0]);
      update.ribs = (user.ribs ?? 0) + amount;
    } else if (reward === 'Rare Card') {
      update.rare_cards = (user.rare_cards ?? 0) + 1;
    } else if (reward === 'Epic Card') {
      update.epic_cards = (user.epic_cards ?? 0) + 1;
    } else if (reward === 'Mythic Card') {
      update.mythic_cards = (user.mythic_cards ?? 0) + 1;
    }

    if (Object.keys(update).length > 0) {
      const { error: updateError } = await supabase
        .from('users')
        .update(update)
        .eq('id', telegramId);

      if (updateError) {
        throw new Error(updateError.message);
      }
    }
  } catch (e) {
    console.error('saveSpinReward exception:', e);
    throw e;
  }
}

// ── Get tasks ───────────────────────────────────────────────
export async function getTasks(): Promise<Task[]> {
  try {
    const { data, error } = await supabase.from('tasks').select('*');
    if (error) {
      console.error('getTasks error:', error);
      return tasks; // fallback ke static
    }
    return data.map((t: any) => ({
      ...t,
      Icon: iconMap[t.icon] || Send,
    }));
  } catch {
    return tasks;
  }
}

// ── Get leaderboard ─────────────────────────────────────────
export async function getLeaderboard() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('username, ribs')
      .order('ribs', { ascending: false })
      .limit(100);

    if (error) {
      console.error('getLeaderboard error:', error);
      return [];
    }

    return data.map((u, i) => ({
      rank: i + 1,
      username: u.username || 'Anonymous',
      avatarSeed: u.username || 'Anonymous',
      ribs: u.ribs,
    }));
  } catch {
    return [];
  }
}

// ── Types & static data ─────────────────────────────────────
export type Upgrade = {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  costs: number[];
  benefits: string[];
};

export const upgrades: Upgrade[] = [
  {
    id: 'faucet-rate',
    name: 'Faucet Rate',
    description: 'Increase the amount of RIBS you earn from the faucet.',
    level: 1,
    maxLevel: 10,
    costs: [2500, 5000, 7500, 10000, 12500, 15000, 17500, 20000, 22500],
    benefits: [
      '+200 RIBS/2hr', '+250 RIBS/2hr', '+300 RIBS/2hr', '+350 RIBS/2hr',
      '+400 RIBS/2hr', '+450 RIBS/2hr', '+500 RIBS/2hr', '+550 RIBS/2hr',
      '+600 RIBS/2hr', '+650 RIBS/2hr',
    ],
  },
  {
    id: 'tap-power',
    name: 'Tap Power',
    description: 'Increase the amount of RIBS you earn per tap.',
    level: 1,
    maxLevel: 3,
    costs: [3000, 6000],
    benefits: ['+1 RIBS/tap', '+2 RIBS/tap', '+5 RIBS/tap'],
  },
  {
    id: 'tap-energy',
    name: 'Tap Energy',
    description: 'Increase your maximum daily tap limit.',
    level: 1,
    maxLevel: 3,
    costs: [5000, 10000],
    benefits: ['+1000 Taps', '+2000 Taps', '+3000 Taps'],
  },
];
