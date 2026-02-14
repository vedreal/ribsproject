'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Flame, CheckSquare, Trophy, User, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/farm', label: 'Farm', icon: Flame },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/referrals', label: 'Refs', icon: Users },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/profile', label: 'Profile', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-card/80 backdrop-blur-lg border-t border-border/50">
      <div className="container mx-auto h-full max-w-lg">
        <div className="grid grid-cols-5 h-full items-center">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <item.icon
                  className={cn(
                    'h-6 w-6',
                    isActive ? 'text-accent' : ''
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span
                  className={cn(
                    'text-xs font-medium',
                    isActive ? 'text-accent' : ''
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
