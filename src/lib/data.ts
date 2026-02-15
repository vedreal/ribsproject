import { Twitter, Send, Globe, type LucideIcon } from 'lucide-react';

export type Task = {
  id: number;
  title: string;
  reward: number;
  Icon: LucideIcon;
  href: string;
};

export const tasks: Task[] = [
  {
    id: 1,
    title: 'Join Telegram Channel',
    reward: 5000,
    Icon: Send,
    href: '#',
  },
  {
    id: 2,
    title: 'Follow us on X',
    reward: 5000,
    Icon: Twitter,
    href: '#',
  },
  {
    id: 3,
    title: 'Visit our Website',
    reward: 2000,
    Icon: Globe,
    href: '#',
  },
];

export type LeaderboardUser = {
  rank: number;
  username: string;
  avatarSeed: string;
  ribs: number;
  isCurrentUser?: boolean;
};

export const leaderboardData: LeaderboardUser[] = [
    { rank: 1, username: 'cypher', avatarSeed: 'cypher', ribs: 12500000, },
    { rank: 2, username: 'vortex', avatarSeed: 'vortex', ribs: 11800000, },
    { rank: 3, username: 'nova', avatarSeed: 'nova', ribs: 11200000, },
    { rank: 4, username: 'zenith', avatarSeed: 'zenith', ribs: 10500000, },
    { rank: 5, username: 'You', avatarSeed: 'you', ribs: 9800000, isCurrentUser: true },
    { rank: 6, username: 'echo', avatarSeed: 'echo', ribs: 9200000, },
    { rank: 7, username: 'pulse', avatarSeed: 'pulse', ribs: 8500000, },
    { rank: 8, username: 'triton', avatarSeed: 'triton', ribs: 7800000, },
    { rank: 9, username: 'solaris', avatarSeed: 'solaris', ribs: 7100000, },
    { rank: 10, username: 'lyra', avatarSeed: 'lyra', ribs: 6400000, },
];

export const userProfile = {
    username: 'Zenith',
    joinDate: '15-07-2024',
    totalRibs: 9800000,
    totalReferrals: 12,
    referralCode: 'ZENITHFARM123',
    email: 'zenith@example.com'
}

export type Upgrade = {
    id: string;
    name: string;
    description: string;
    level: number;
    maxLevel: number;
    cost: number;
    benefit: string;
}

export const upgrades: Upgrade[] = [
    {
        id: 'farming-rate',
        name: 'Farming Rate',
        description: 'Increase the amount of RIBS you earn from passive farming.',
        level: 1,
        maxLevel: 10,
        cost: 2500,
        benefit: '+50 RIBS/2hr'
    },
    {
        id: 'tap-power',
        name: 'Tap Power',
        description: 'Increase the amount of RIBS you earn per tap.',
        level: 2,
        maxLevel: 3,
        cost: 3000,
        benefit: '+5 RIBS/tap'
    },
    {
        id: 'tap-energy',
        name: 'Tap Energy',
        description: 'Increase your maximum daily tap limit.',
        level: 1,
        maxLevel: 3,
        cost: 5000,
        benefit: '+1000 Taps'
    }
]
