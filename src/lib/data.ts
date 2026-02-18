import { Send, Clapperboard, Users } from 'lucide-react';
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
    title: 'Invite 5 Friends',
    reward: 600,
    Icon: Users,
    href: '/referrals',
  },
  {
    id: 3,
    title: 'Follow us on X',
    reward: 300,
    Icon: XIcon,
    href: '#',
  },
  {
    id: 4,
    title: 'Join Telegram Channel',
    reward: 300,
    Icon: Send,
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

const sampleUsernames = ['cypher', 'vortex', 'nova', 'zenith', 'echo', 'pulse', 'triton', 'solaris', 'lyra', 'orion', 'ace', 'blaze', 'case', 'drake', 'ember', 'fang', 'gale', 'hawk', 'iris', 'jade'];

export const leaderboardData: LeaderboardUser[] = Array.from({ length: 100 }, (_, i) => {
    const rank = i + 1;
    const baseRibs = 12500000;
    const ribs = baseRibs - (rank * 50000) - Math.floor(Math.random() * 40000);
    const username = `${sampleUsernames[i % sampleUsernames.length]}${rank}`;
    return {
        rank,
        username,
        avatarSeed: username,
        ribs,
    };
});

export const userProfile = {
    username: 'You',
    rank: 123,
    joinDate: '15-07-2024',
    totalRibs: 9800000,
    totalReferrals: 12,
    referralCode: 'ZENITHFARM123',
    email: 'zenith@example.com'
};

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
            '+200 RIBS/2hr',
            '+250 RIBS/2hr',
            '+300 RIBS/2hr',
            '+350 RIBS/2hr',
            '+400 RIBS/2hr',
            '+450 RIBS/2hr',
            '+500 RIBS/2hr',
            '+550 RIBS/2hr',
            '+600 RIBS/2hr'
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
