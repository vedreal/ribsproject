import { Send, Clapperboard } from 'lucide-react';
import { DiscordIcon } from '@/components/ribs/discord-icon';
import { XIcon } from '@/components/ribs/x-icon';
import type { ElementType } from 'react';

export type Task = {
  id: number;
  title: string;
  reward: number;
  Icon: ElementType;
  href: string;
};

export const tasks: Task[] = [
  {
    id: 1,
    title: 'Watch Ads (3/3)',
    reward: 900,
    Icon: Clapperboard,
    href: '#',
  },
  {
    id: 2,
    title: 'Follow us on X',
    reward: 200,
    Icon: XIcon,
    href: '#',
  },
  {
    id: 3,
    title: 'Join Telegram Channel',
    reward: 200,
    Icon: Send,
    href: '#',
  },
  {
    id: 4,
    title: 'Join Discord Group',
    reward: 200,
    Icon: DiscordIcon,
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
    costs: number[];
    benefits: string[];
}

export const upgrades: Upgrade[] = [
    {
        id: 'farming-rate',
        name: 'Farming Rate',
        description: 'Increase the amount of RIBS you earn from passive farming.',
        level: 1,
        maxLevel: 10,
        costs: [2500, 5000, 7500, 10000, 12500, 15000, 17500, 20000, 22500],
        benefits: [
            '+300 RIBS/2hr',
            '+350 RIBS/2hr',
            '+400 RIBS/2hr',
            '+450 RIBS/2hr',
            '+500 RIBS/2hr',
            '+550 RIBS/2hr',
            '+600 RIBS/2hr',
            '+650 RIBS/2hr',
            '+700 RIBS/2hr'
        ]
    },
    {
        id: 'tap-power',
        name: 'Tap Power',
        description: 'Increase the amount of RIBS you earn per tap.',
        level: 1,
        maxLevel: 3,
        costs: [3000, 6000],
        benefits: ['+5 RIBS/tap', '+10 RIBS/tap']
    },
    {
        id: 'tap-energy',
        name: 'Tap Energy',
        description: 'Increase your maximum daily tap limit.',
        level: 1,
        maxLevel: 3,
        costs: [5000, 10000],
        benefits: ['+1000 Taps', '+2000 Taps']
    }
]
