'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/ribs/app-layout';
import { RibsIcon } from '@/components/ribs/ribs-icon';
import { useTelegram } from '@/components/telegram-provider';
import { supabase } from '@/lib/supabase';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RankEntry {
  id: number;
  username: string | null;
  first_name: string | null;
  ribs: number;
  rank: number;
}

export default function RankPage() {
  const { user: tgUser, isLoading } = useTelegram();
  const userId = tgUser?.id ?? null;

  const [top100,    setTop100]    = useState<RankEntry[]>([]);
  const [myRank,    setMyRank]    = useState<RankEntry | null>(null);
  const [inTop100,  setInTop100]  = useState(false);
  const [isLoaded,  setIsLoaded]  = useState(false);

  useEffect(() => {
    if (!userId || isLoading) return;

    (async () => {
      try {
        // Fetch top 100
        const { data: topData } = await supabase
          .from('users')
          .select('id, username, first_name, ribs')
          .order('ribs', { ascending: false })
          .limit(100);

        const entries: RankEntry[] = (topData ?? []).map((u, i) => ({
          ...u,
          rank: i + 1,
        }));

        setTop100(entries);

        // Check if user is in top 100
        const myEntry = entries.find(e => e.id === userId);
        if (myEntry) {
          setInTop100(true);
          setMyRank(myEntry);
        } else {
          // Get user's actual rank via count
          const { data: myData } = await supabase
            .from('users')
            .select('id, username, first_name, ribs')
            .eq('id', userId)
            .single();

          if (myData) {
            const { count } = await supabase
              .from('users')
              .select('id', { count: 'exact', head: true })
              .gt('ribs', myData.ribs ?? 0);

            setMyRank({
              ...myData,
              rank: (count ?? 0) + 1,
            });
          }
          setInTop100(false);
        }

        setIsLoaded(true);
      } catch (e) {
        console.error('RankPage load error:', e);
        setIsLoaded(true);
      }
    })();
  }, [userId, isLoading]);

  const getMedalColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-slate-300';
    if (rank === 3) return 'text-amber-600';
    return 'text-muted-foreground';
  };

  const displayName = (entry: RankEntry) =>
    entry.username ? `@${entry.username}` : (entry.first_name || 'Unknown');

  const isMe = (entry: RankEntry) => entry.id === userId;

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="text-center">
          <h1 className="text-3xl font-headline font-bold">Leaderboard</h1>
          <p className="text-muted-foreground text-sm">Top 100 RIBS holders</p>
        </div>

        {!isLoaded ? (
          <div className="text-center py-16 text-muted-foreground">Loading...</div>
        ) : (
          <div className="rounded-xl bg-gradient-to-br from-secondary to-card border border-border overflow-hidden">

            {/* Header */}
            <div className="grid grid-cols-[40px_1fr_auto] gap-2 px-4 py-2 border-b border-border text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <span>#</span>
              <span>Player</span>
              <span>RIBS</span>
            </div>

            {/* Top 100 */}
            <div className="divide-y divide-border">
              {top100.map(entry => (
                <div
                  key={entry.id}
                  className={cn(
                    'grid grid-cols-[40px_1fr_auto] gap-2 px-4 py-2.5 items-center',
                    isMe(entry) && 'bg-primary/10 border-l-2 border-primary'
                  )}
                >
                  {/* Rank */}
                  <div className={cn('font-bold text-sm', getMedalColor(entry.rank))}>
                    {entry.rank <= 3 ? (
                      <Trophy className="w-4 h-4 inline" />
                    ) : (
                      entry.rank
                    )}
                  </div>

                  {/* Name */}
                  <div className="min-w-0 flex items-center gap-1.5">
                    <span className={cn(
                      'text-sm font-medium truncate',
                      isMe(entry) && 'text-primary font-bold'
                    )}>
                      {displayName(entry)}{isMe(entry) ? ' (You)' : ''}
                    </span>
                  </div>

                  {/* RIBS */}
                  <div className="flex items-center gap-1 shrink-0">
                    <RibsIcon className="w-3.5 h-3.5" />
                    <span className="text-sm font-bold">{(entry.ribs ?? 0).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* User's own rank if not in top 100 */}
            {!inTop100 && myRank && (
              <>
                {/* Divider */}
                <div className="px-4 py-1 flex items-center gap-2">
                  <div className="flex-1 border-t border-dashed border-border" />
                  <span className="text-xs text-muted-foreground">Your Rank</span>
                  <div className="flex-1 border-t border-dashed border-border" />
                </div>

                {/* My row */}
                <div className="grid grid-cols-[40px_1fr_auto] gap-2 px-4 py-2.5 items-center bg-primary/10 border-l-2 border-primary">
                  <div className="font-bold text-sm text-muted-foreground">{myRank.rank}</div>
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-primary truncate">
                      {displayName(myRank)} (You)
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <RibsIcon className="w-3.5 h-3.5" />
                    <span className="text-sm font-bold">{(myRank.ribs ?? 0).toLocaleString()}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
