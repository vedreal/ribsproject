'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/ribs/app-layout';
import { Button } from '@/components/ui/button';
import { RibsIcon } from '@/components/ribs/ribs-icon';
import { useToast } from '@/hooks/use-toast';
import { useTelegram } from '@/components/telegram-provider';
import { supabase } from '@/lib/supabase';
import { getUserProfile } from '@/lib/data';
import { Copy, Users } from 'lucide-react';

const RIBS_PER_REFERRAL = 100;
// startapp param = pure numeric userId (no prefix)
const MINIAPP_BASE = 'https://t.me/ribscoin_bot/RIBS?startapp=';

export default function RefsPage() {
  const { user: tgUser, isLoading } = useTelegram();
  const { toast } = useToast();
  const userId = tgUser?.id ?? null;

  const [referralCount,   setReferralCount]   = useState(0);
  const [rewardedCount,   setRewardedCount]   = useState(0);
  const [balance,         setBalance]         = useState(0);
  const [referrals,       setReferrals]       = useState<{ username: string | null; first_name: string | null; ribs: number }[]>([]);
  const [isLoaded,        setIsLoaded]        = useState(false);

  // Pure numeric userId as startapp param — Telegram will pass it as start_param
  const referralLink = userId ? `${MINIAPP_BASE}${userId}` : '';

  // ── Load & check for new referrals to reward ───────────
  useEffect(() => {
    if (!userId || isLoading) return;

    (async () => {
      try {
        const profile = await getUserProfile(userId);
        if (!profile) { setIsLoaded(true); return; }

        const currentBalance  = profile.ribs              ?? 0;
        const currentRewarded = profile.referral_rewarded_count ?? 0;
        setBalance(currentBalance);
        setRewardedCount(currentRewarded);

        // Fetch referrals
        const { data: refs, count } = await supabase
          .from('users')
          .select('username, first_name, ribs', { count: 'exact' })
          .eq('referred_by', userId)
          .order('ribs', { ascending: false });

        const totalRefs = count ?? 0;
        setReferralCount(totalRefs);
        setReferrals(refs ?? []);

        // Auto-reward for new referrals not yet rewarded
        const newRefs = totalRefs - currentRewarded;
        if (newRefs > 0) {
          const bonus = newRefs * RIBS_PER_REFERRAL;
          const { error: ribsErr } = await supabase.rpc('increment_ribs', {
            user_id: userId,
            amount: bonus,
          });
          if (!ribsErr) {
            const { error: updateErr } = await supabase.from('users').update({
              referral_rewarded_count: totalRefs,
            }).eq('id', userId);

            if (!updateErr) {
              setBalance(prev => prev + bonus);
              setRewardedCount(totalRefs);
              toast({
                title: `🎉 +${bonus} RIBS earned!`,
                description: `Reward for ${newRefs} new referral${newRefs > 1 ? 's' : ''}.`,
              });
            }
          }
        }

        setIsLoaded(true);
      } catch (e) {
        console.error('RefsPage load error:', e);
        setIsLoaded(true);
      }
    })();
  }, [userId, isLoading]);

  const copyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).then(() => {
      toast({ title: 'Referral link copied!' });
    });
  };

  const shareLink = () => {
    if (!referralLink) return;
    const text = encodeURIComponent(`Join me on RIBS and start earning! ${referralLink}`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${text}`, '_blank');
  };

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="text-center">
          <h1 className="text-3xl font-headline font-bold">Referrals</h1>
          <p className="text-muted-foreground text-sm">Earn {RIBS_PER_REFERRAL} RIBS for every friend you invite</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-gradient-to-br from-secondary to-card border border-border p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Friends Invited</span>
            </div>
            <p className="text-3xl font-bold">{referralCount}</p>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-secondary to-card border border-border p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <RibsIcon className="w-4 h-4" />
              <span className="text-xs text-muted-foreground">RIBS Earned</span>
            </div>
            <p className="text-3xl font-bold">{(rewardedCount * RIBS_PER_REFERRAL).toLocaleString()}</p>
          </div>
        </div>

        {/* Referral link */}
        <div className="rounded-xl bg-gradient-to-br from-secondary to-card border border-border p-4 space-y-3">
          <p className="text-sm font-semibold">Your Referral Link</p>
          <div className="bg-background rounded-lg px-3 py-2 text-xs text-muted-foreground break-all font-mono">
            {referralLink || 'Loading...'}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={copyLink}
              disabled={!isLoaded || !referralLink}
              className="flex-1 bg-gradient-to-b from-slate-300 to-slate-500 text-slate-900 font-bold"
            >
              <Copy className="mr-2 h-4 w-4" /> Copy Link
            </Button>
            <Button
              onClick={shareLink}
              disabled={!isLoaded || !referralLink}
              className="flex-1 bg-gradient-to-b from-slate-300 to-slate-500 text-slate-900 font-bold"
            >
              Share
            </Button>
          </div>
        </div>

        {/* Friends list */}
        {referrals.length > 0 && (
          <div className="rounded-xl bg-gradient-to-br from-secondary to-card border border-border p-4 space-y-1">
            <p className="text-sm font-semibold mb-3">Your Friends</p>
            {referrals.map((ref, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                    {(ref.username || ref.first_name || '?')[0].toUpperCase()}
                  </div>
                  <span className="text-sm">
                    {ref.username ? `@${ref.username}` : (ref.first_name || 'Unknown')}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <RibsIcon className="w-3 h-3" />
                  {(ref.ribs ?? 0).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}

        {isLoaded && referrals.length === 0 && (
          <div className="text-center text-muted-foreground py-8 space-y-2">
            <Users className="w-12 h-12 mx-auto opacity-30" />
            <p className="text-sm">No referrals yet. Share your link to start earning!</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
