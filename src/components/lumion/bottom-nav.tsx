'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Flame, CheckSquare, Trophy, User, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/farm', label: 'Farm', icon: Flame },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/referrals', label: 'Refs', icon: Users },
  { href: '/leaderboard', label: 'Rank', icon: Trophy },
  { href: '/profile', label: 'Profile', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-4 inset-x-0 mx-auto h-16 w-max max-w-sm bg-card/80 backdrop-blur-xl rounded-lg border border-border/50 shadow-2xl z-50">
      <div className="flex h-full items-center justify-center gap-x-6 px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex flex-col items-center justify-center gap-1 h-full focus:outline-none"
            >
              <div
                className={cn(
                  'flex items-center justify-center h-8 w-8 rounded-full transition-colors duration-200',
                  isActive ? 'bg-accent' : 'bg-transparent'
                )}
              >
                <item.icon
                  className={cn(
                    'h-5 w-5 transition-colors duration-200',
                    isActive
                      ? 'text-accent-foreground'
                      : 'text-muted-foreground group-hover:text-foreground'
                  )}
                  strokeWidth={2.5}
                />
              </div>
              <span
                className={cn(
                  'text-[10px] font-semibold transition-colors duration-200',
                  isActive
                    ? 'text-accent'
                    : 'text-muted-foreground group-hover:text-foreground'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
