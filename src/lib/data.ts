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
        href: 'https://t.me/ribs_announcements'
    },
    {
        id: 2,
        title: 'Follow us on X',
        reward: 3000,
        Icon: XIcon,
        href: 'https://x.com/ribs_project'
    }
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

export async function getTasks(): Promise<Task[]> {
  const { data, error } = await supabase.from('tasks').select('*');
  if (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
  return data.map((t: any) => ({
    ...t,
    Icon: iconMap[t.icon] || Send,
  }));
}

export async function getLeaderboard() {
  const { data, error } = await supabase
    .from('users')
    .select('username, ribs')
    .order('ribs', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }

  return data.map((u, i) => ({
    rank: i + 1,
    username: u.username || 'Anonymous',
    avatarSeed: u.username || 'Anonymous',
    ribs: u.ribs,
  }));
}

export async function getUserProfile(telegramId: number) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', telegramId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user profile:', error);
  }
  return data;
}

export async function syncUser(user: { id: number; username?: string; first_name?: string; last_name?: string }) {
  const { data, error } = await supabase.from('users').upsert({
    id: user.id,
    username: user.username,
    first_name: user.first_name,
    last_name: user.last_name,
    referral_code: `ref_${user.id}`
  }, { onConflict: 'id' }).select().single();

  if (error) {
    console.error('Error syncing user:', error);
  }
  return data;
}

export async function updateUserRibs(telegramId: number, amount: number) {
    const { data, error } = await supabase.rpc('increment_ribs', { 
        user_id: telegramId, 
        amount: amount 
    });
    
    if (error) {
        // Fallback if RPC doesn't exist yet
        const { data: user } = await supabase.from('users').select('ribs').eq('id', telegramId).single();
        if (user) {
            await supabase.from('users').update({ ribs: user.ribs + amount }).eq('id', telegramId);
        }
    }
}

export type Upgrade = {
    id: string;
    name: string;
    description: string;
    level: number;
    maxLevel: number;
    costs: number[];
    benefits: string[];
}

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
            '+600 RIBS/2hr', '+650 RIBS/2hr'
        ]
    },
    {
        id: 'tap-power',
        name: 'Tap Power',
        description: 'Increase the amount of RIBS you earn per tap.',
        level: 1,
        maxLevel: 3,
        costs: [3000, 6000],
        benefits: ['+1 RIBS/tap', '+2 RIBS/tap', '+5 RIBS/tap']
    },
    {
        id: 'tap-energy',
        name: 'Tap Energy',
        description: 'Increase your maximum daily tap limit.',
        level: 1,
        maxLevel: 3,
        costs: [5000, 10000],
        benefits: ['+1000 Taps', '+2000 Taps', '+3000 Taps']
    }
]
