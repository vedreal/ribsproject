'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/ribs/app-layout';
import { Button } from '@/components/ui/button';
import { RibsIcon } from '@/components/ribs/ribs-icon';
import { useToast } from '@/hooks/use-toast';
import { useTelegram } from '@/components/telegram-provider';
import { supabase } from '@/lib/supabase';
import { getUserProfile } from '@/lib/data';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const DAILY_ADS_MAX   = 3;
const RIBS_PER_AD     = 200; // 600 total / 3 ads
const INVITE3_REWARD  = 500;
const INVITE5_REWARD  = 1000;
const FOLLOW_TG_REWARD = 300;
const FOLLOW_X_REWARD  = 300;

export default function TasksPage() {
  const { user: tgUser, isLoading } = useTelegram();
  const { toast } = useToast();
  const userId = tgUser?.id ?? null;

  // Task states
  const [adsLeft,        setAdsLeft]        = useState(DAILY_ADS_MAX);
  const [invite3Done,    setInvite3Done]    = useState(false);
  const [invite5Done,    setInvite5Done]    = useState(false);
  const [followTgDone,   setFollowTgDone]   = useState(false);
  const [followXDone,    setFollowXDone]    = useState(false);
  const [balance,        setBalance]        = useState(0);
  const [isLoaded,       setIsLoaded]       = useState(false);

  // Button loading states
  const [loadingAd,      setLoadingAd]      = useState(false);
  const [loadingInvite3, setLoadingInvite3] = useState(false);
  const [loadingInvite5, setLoadingInvite5] = useState(false);
  const [loadingTg,      setLoadingTg]      = useState(false);
  const [loadingX,       setLoadingX]       = useState(false);

  // ── Load from Supabase ──────────────────────────────────
  useEffect(() => {
    if (!userId || isLoading) return;

    (async () => {
      try {
        const profile = await getUserProfile(userId);
        if (!profile) { setIsLoaded(true); return; }

        setBalance(profile.ribs ?? 0);
        setInvite3Done(profile.task_invite3_done   ?? false);
        setInvite5Done(profile.task_invite5_done   ?? false);
        setFollowTgDone(profile.task_follow_tg_done ?? false);
        setFollowXDone(profile.task_follow_x_done  ?? false);

        // Daily ads — check reset
        const today     = new Date().toISOString().split('T')[0];
        const savedDate = profile.task_daily_ads_reset
          ? new Date(profile.task_daily_ads_reset).toISOString().split('T')[0]
          : null;

        if (!savedDate || savedDate !== today) {
          // New day → reset ads
          setAdsLeft(DAILY_ADS_MAX);
          supabase.from('users').update({
            task_daily_ads_count: DAILY_ADS_MAX,
            task_daily_ads_reset: today,
          }).eq('id', userId).then(({ error }) => error && console.error('Reset ads:', error));
        } else {
          setAdsLeft(profile.task_daily_ads_count ?? DAILY_ADS_MAX);
        }

        setIsLoaded(true);
      } catch (e) {
        console.error('TasksPage load error:', e);
        setIsLoaded(true);
      }
    })();
  }, [userId, isLoading]);

  // ── Helper: add RIBS ────────────────────────────────────
  const addRibs = async (uid: number, amount: number) => {
    const { error } = await supabase.rpc('increment_ribs', { user_id: uid, amount });
    if (error) throw error;
    setBalance(prev => prev + amount);
  };

  // ── Task 1: Watch Daily Ad ──────────────────────────────
  const handleWatchAd = async () => {
    if (!userId || adsLeft <= 0 || loadingAd) return;
    setLoadingAd(true);

    // Simulate ad watching (3 seconds)
    await new Promise(r => setTimeout(r, 3000));

    const newAdsLeft = adsLeft - 1;
    try {
      await Promise.all([
        addRibs(userId, RIBS_PER_AD),
        supabase.from('users').update({ task_daily_ads_count: newAdsLeft }).eq('id', userId),
      ]);
      setAdsLeft(newAdsLeft);
      toast({ title: `✅ Ad watched! +${RIBS_PER_AD} RIBS`, description: `${newAdsLeft} ad${newAdsLeft !== 1 ? 's' : ''} remaining today.` });
    } catch {
      toast({ title: 'Failed to save reward', variant: 'destructive' });
    }
    setLoadingAd(false);
  };

  // ── Task 2: Invite 3 Friends ────────────────────────────
  const handleInvite3 = async () => {
    if (!userId || invite3Done || loadingInvite3) return;
    setLoadingInvite3(true);

    try {
      const { count } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('referred_by', userId);

      const refCount = count ?? 0;
      if (refCount >= 3) {
        await Promise.all([
          addRibs(userId, INVITE3_REWARD),
          supabase.from('users').update({ task_invite3_done: true }).eq('id', userId),
        ]);
        setInvite3Done(true);
        toast({ title: `✅ Task complete! +${INVITE3_REWARD} RIBS`, description: 'You have invited 3+ friends.' });
      } else {
        toast({
          title: 'Not enough referrals',
          description: `You have ${refCount}/3 friends. Keep sharing!`,
          variant: 'destructive',
        });
      }
    } catch {
      toast({ title: 'Check failed, please try again', variant: 'destructive' });
    }
    setLoadingInvite3(false);
  };

  // ── Task 3: Invite 5 Friends ────────────────────────────
  const handleInvite5 = async () => {
    if (!userId || invite5Done || loadingInvite5) return;
    setLoadingInvite5(true);

    try {
      const { count } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('referred_by', userId);

      const refCount = count ?? 0;
      if (refCount >= 5) {
        await Promise.all([
          addRibs(userId, INVITE5_REWARD),
          supabase.from('users').update({ task_invite5_done: true }).eq('id', userId),
        ]);
        setInvite5Done(true);
        toast({ title: `✅ Task complete! +${INVITE5_REWARD} RIBS`, description: 'You have invited 5+ friends.' });
      } else {
        toast({
          title: 'Not enough referrals',
          description: `You have ${refCount}/5 friends. Keep sharing!`,
          variant: 'destructive',
        });
      }
    } catch {
      toast({ title: 'Check failed, please try again', variant: 'destructive' });
    }
    setLoadingInvite5(false);
  };

  // ── Task 4: Follow Telegram ─────────────────────────────
  const handleFollowTg = async () => {
    if (!userId || followTgDone || loadingTg) return;
    setLoadingTg(true);

    // Open Telegram channel
    window.open('https://t.me/ribscoin', '_blank');

    // Wait 10 seconds then reward
    await new Promise(r => setTimeout(r, 10000));

    try {
      await Promise.all([
        addRibs(userId, FOLLOW_TG_REWARD),
        supabase.from('users').update({ task_follow_tg_done: true }).eq('id', userId),
      ]);
      setFollowTgDone(true);
      toast({ title: `✅ Task complete! +${FOLLOW_TG_REWARD} RIBS`, description: 'Thanks for following our Telegram!' });
    } catch {
      toast({ title: 'Failed to save reward', variant: 'destructive' });
    }
    setLoadingTg(false);
  };

  // ── Task 5: Follow X ────────────────────────────────────
  const handleFollowX = async () => {
    if (!userId || followXDone || loadingX) return;
    setLoadingX(true);

    // Open X/Twitter account
    window.open('https://x.com/ribscoin', '_blank');

    // Wait 10 seconds then reward
    await new Promise(r => setTimeout(r, 10000));

    try {
      await Promise.all([
        addRibs(userId, FOLLOW_X_REWARD),
        supabase.from('users').update({ task_follow_x_done: true }).eq('id', userId),
      ]);
      setFollowXDone(true);
      toast({ title: `✅ Task complete! +${FOLLOW_X_REWARD} RIBS`, description: 'Thanks for following on X!' });
    } catch {
      toast({ title: 'Failed to save reward', variant: 'destructive' });
    }
    setLoadingX(false);
  };

  // ── Task row UI component ───────────────────────────────
  const TaskRow = ({
    icon,
    title,
    description,
    reward,
    done,
    loading,
    onAction,
    actionLabel = 'Go',
    disabled = false,
  }: {
    icon: string;
    title: string;
    description: string;
    reward: number;
    done: boolean;
    loading: boolean;
    onAction: () => void;
    actionLabel?: string;
    disabled?: boolean;
  }) => (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-2xl shrink-0">{icon}</span>
        <div className="min-w-0">
          <p className="font-semibold text-sm leading-tight">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <RibsIcon className="w-3 h-3" />
            <span className="text-xs font-bold text-primary">+{reward.toLocaleString()} RIBS</span>
          </div>
        </div>
      </div>
      <div className="shrink-0">
        {done ? (
          <CheckCircle2 className="w-6 h-6 text-green-500" />
        ) : (
          <Button
            size="sm"
            onClick={onAction}
            disabled={disabled || loading || !isLoaded || !userId}
            className="bg-gradient-to-b from-slate-300 to-slate-500 text-slate-900 font-bold min-w-[60px]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : actionLabel}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="text-center">
          <h1 className="text-3xl font-headline font-bold">Tasks</h1>
          <p className="text-muted-foreground text-sm">Complete tasks to earn RIBS</p>
        </div>

        {/* Balance */}
        <div className="rounded-xl bg-gradient-to-br from-secondary to-card border border-border p-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Your Balance</span>
          <div className="flex items-center gap-2 font-bold text-lg">
            <RibsIcon className="w-5 h-5" />
            {balance.toLocaleString()}
          </div>
        </div>

        {/* Tasks card */}
        <div className="rounded-xl bg-gradient-to-br from-secondary to-card border border-border p-4">

          {/* Daily */}
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Daily</p>
          <TaskRow
            icon="📺"
            title="Watch Daily Ads"
            description={`${adsLeft}/${DAILY_ADS_MAX} remaining today`}
            reward={RIBS_PER_AD}
            done={adsLeft <= 0}
            loading={loadingAd}
            onAction={handleWatchAd}
            disabled={adsLeft <= 0}
          />

          {/* One-time */}
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-4 mb-1">One-time</p>
          <TaskRow
            icon="👥"
            title="Invite 3 Friends"
            description="Refer 3 friends to RIBS"
            reward={INVITE3_REWARD}
            done={invite3Done}
            loading={loadingInvite3}
            onAction={handleInvite3}
            actionLabel="Check"
          />
          <TaskRow
            icon="👥"
            title="Invite 5 Friends"
            description="Refer 5 friends to RIBS"
            reward={INVITE5_REWARD}
            done={invite5Done}
            loading={loadingInvite5}
            onAction={handleInvite5}
            actionLabel="Check"
          />
          <TaskRow
            icon="✈️"
            title="Follow Telegram News"
            description="Join our Telegram channel"
            reward={FOLLOW_TG_REWARD}
            done={followTgDone}
            loading={loadingTg}
            onAction={handleFollowTg}
          />
          <TaskRow
            icon="🐦"
            title="Follow X Account"
            description="Follow us on X (Twitter)"
            reward={FOLLOW_X_REWARD}
            done={followXDone}
            loading={loadingX}
            onAction={handleFollowX}
          />
        </div>
      </div>
    </AppLayout>
  );
}
