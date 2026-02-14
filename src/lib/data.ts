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
  lumions: number;
  isCurrentUser?: boolean;
};

export const leaderboardData: LeaderboardUser[] = [
    { rank: 1, username: 'cypher', avatarSeed: 'cypher', lumions: 12500000, },
    { rank: 2, username: 'vortex', avatarSeed: 'vortex', lumions: 11800000, },
    { rank: 3, username: 'nova', avatarSeed: 'nova', lumions: 11200000, },
    { rank: 4, username: 'zenith', avatarSeed: 'zenith', lumions: 10500000, },
    { rank: 5, username: 'You', avatarSeed: 'you', lumions: 9800000, isCurrentUser: true },
    { rank: 6, username: 'echo', avatarSeed: 'echo', lumions: 9200000, },
    { rank: 7, username: 'pulse', avatarSeed: 'pulse', lumions: 8500000, },
    { rank: 8, username: 'triton', avatarSeed: 'triton', lumions: 7800000, },
    { rank: 9, username: 'solaris', avatarSeed: 'solaris', lumions: 7100000, },
    { rank: 10, username: 'lyra', avatarSeed: 'lyra', lumions: 6400000, },
];

export const userProfile = {
    username: 'Zenith',
    joinDate: '15-07-2024',
    totalLumions: 9800000,
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
        description: 'Increase the amount of LUMION you earn per hour.',
        level: 4,
        maxLevel: 10,
        cost: 12000,
        benefit: '+100 LUM/hr'
    },
    {
        id: 'tap-power',
        name: 'Tap Power',
        description: 'Increase the amount of LUMION you earn per tap.',
        level: 6,
        maxLevel: 10,
        cost: 8000,
        benefit: '+2 LUM/tap'
    },
    {
        id: 'energy-cap',
        name: 'Energy Cap',
        description: 'Increase your maximum daily tap limit.',
        level: 2,
        maxLevel: 10,
        cost: 25000,
        benefit: '+500 Taps'
    }
]
