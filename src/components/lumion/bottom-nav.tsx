'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Flame, CheckSquare, Trophy, User, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const navItems = [
  { href: '/farm', label: 'Earn', icon: Flame },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/referrals', label: 'Refs', icon: Users },
  { href: '/leaderboard', label: 'Rank', icon: Trophy },
  { href: '/profile', label: 'Profile', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="h-16 bg-card/5 backdrop-blur-xl rounded-lg border border-border/5 shadow-2xl">
      <div className="flex h-full items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex flex-col items-center justify-center gap-1 h-full w-full focus:outline-none"
            >
              <div
                className={cn(
                  'flex items-center justify-center h-8 w-8 rounded-full transition-colors duration-200',
                  isActive && item.href !== '/profile' ? 'bg-accent' : 'bg-transparent'
                )}
              >
                {item.href === '/profile' ? (
                  <Image
                    src="https://picsum.photos/seed/you/24/24"
                    alt="Profile"
                    width={24}
                    height={24}
                    className={cn(
                      "rounded-full transition-all border-2",
                      isActive ? "border-accent" : "border-transparent",
                      "group-hover:border-foreground/50"
                    )}
                    data-ai-hint="avatar"
                  />
                ) : (
                  <item.icon
                    className={cn(
                      'h-5 w-5 transition-colors duration-200',
                      isActive
                        ? 'text-accent-foreground'
                        : 'text-muted-foreground group-hover:text-foreground'
                    )}
                    strokeWidth={2.5}
                  />
                )}
              </div>
              <span
                className={cn(
                  'text-xs font-semibold transition-colors duration-200',
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
