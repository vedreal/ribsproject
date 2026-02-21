'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CalendarCheck, Disc, ArrowUpCircle } from 'lucide-react';
import { AppLayout } from '@/components/ribs/app-layout';
import { RibsIcon } from '@/components/ribs/ribs-icon';
import { UpgradeSheet } from '@/components/ribs/upgrade-sheet';
import { cn } from '@/lib/utils';
import { upgrades as upgradeDefinitions, type Upgrade, getUserProfile, checkIn, claimFaucet } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useTelegram } from '@/components/telegram-provider';
import { supabase } from '@/lib/supabase';

const CLAIM_DURATION_MS = 2 * 60 * 60 * 1000;

// Map upgrade id to Supabase column name
const UPGRADE_COL: Record<string, string> = {
  'faucet-rate': 'upgrade_faucet_rate',
  'tap-power':   'upgrade_tap_power',
  'tap-energy':  'upgrade_tap_energy',
};

export default function FarmPage() {
  const [balance, setBalance] = useState(0);
  const [tapsLeft, setTapsLeft] = useState(1000);
  const [claimTime, setClaimTime] = useState<number | null>(null);
  const [timeToClaim, setTimeToClaim] = useState('');
  const [isUpgradeSheetOpen, setIsUpgradeSheetOpen] = useState(false);
  const [floatingNumbers, setFloatingNumbers] = useState<{ id: number; x: number; y: number }[]>([]);
  const [checkInCount, setCheckInCount] = useState(0);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isActivated, setIsActivated] = useState(false);

  // Upgrades state — initialized from upgradeDefinitions, levels loaded from Supabase
  const [upgrades, setUpgrades] = useState<Upgrade[]>(upgradeDefinitions);

  const { toast } = useToast();
  const { user: tgUser, isLoading } = useTelegram();
  const userId = tgUser?.id ?? null;

  // Refs
  const tapBufferRef    = useRef(0);
  const tapSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapsLeftRef     = useRef(1000);
  const userIdRef       = useRef<number | null>(null);
  const isMountedRef    = useRef(true);

  useEffect(() => { userIdRef.current = userId; }, [userId]);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // ── Computed from upgrades ────────────────────────────────
  const faucetUpgrade  = upgrades.find(u => u.id === 'faucet-rate');
  const faucetBenefit  = faucetUpgrade?.benefits[faucetUpgrade.level - 1] ?? '+200 RIBS/2hr';
  const claimAmount    = parseInt(faucetBenefit.match(/\d+/)?.[0] || '200');

  const tapPowerUpgrade = upgrades.find(u => u.id === 'tap-power');
  const tapAmount       = parseInt(
    (tapPowerUpgrade?.benefits[tapPowerUpgrade.level - 1] ?? '+1 RIBS/tap').match(/\d+/)?.[0] || '1'
  );

  const tapEnergyUpgrade = upgrades.find(u => u.id === 'tap-energy');
  const dailyTaps        = parseInt(
    (tapEnergyUpgrade?.benefits[tapEnergyUpgrade.level - 1] ?? '+1000 Taps').match(/\d+/)?.[0] || '1000'
  );

  // ── Load user data from Supabase ──────────────────────────
  useEffect(() => {
    if (!userId || isLoading) return;

    (async () => {
      try {
        const profile = await getUserProfile(userId);
        if (!profile) { setIsLoaded(true); return; }
        if (!isMountedRef.current) return;

        setBalance(profile.ribs ?? 0);
        setCheckInCount(profile.checkin_count ?? 0);

        // Check-in status
        if (profile.last_checkin) {
          const lastDate  = new Date(profile.last_checkin).toISOString().split('T')[0];
          const todayDate = new Date().toISOString().split('T')[0];
          setHasCheckedInToday(lastDate === todayDate);
        }

        // Faucet timer
        if (profile.next_faucet_claim) {
          const nextClaim = new Date(profile.next_faucet_claim).getTime();
          setClaimTime(nextClaim > Date.now() ? nextClaim : Date.now());
          setIsActivated(true);
        }

        // ── Load upgrade levels from Supabase ─────────────
        setUpgrades(prev => prev.map(u => {
          const col = UPGRADE_COL[u.id];
          if (!col) return u;
          const savedLevel = profile[col];
          if (typeof savedLevel === 'number' && savedLevel >= 1 && savedLevel <= u.maxLevel) {
            return { ...u, level: savedLevel };
          }
          return u;
        }));

        // ── Tap energy — daily reset check ────────────────
        const todayDate    = new Date().toISOString().split('T')[0];
        const savedReset   = profile.taps_reset_date
          ? new Date(profile.taps_reset_date).toISOString().split('T')[0]
          : null;

        // dailyTaps might still be default here; we read from profile columns directly
        const savedTapEnergyLevel = profile.upgrade_tap_energy ?? 1;
        const tapEnergyBenefits   = ['1000', '2000', '3000'];
        const resolvedDailyTaps   = parseInt(tapEnergyBenefits[savedTapEnergyLevel - 1] || '1000');

        let restoredTaps: number;
        if (!savedReset || savedReset !== todayDate) {
          restoredTaps = resolvedDailyTaps;
          supabase.from('users').update({
            taps_left: resolvedDailyTaps,
            taps_reset_date: todayDate,
          }).eq('id', userId).then(({ error }) => error && console.error('Reset taps:', error));
        } else {
          restoredTaps = Math.min(profile.taps_left ?? resolvedDailyTaps, resolvedDailyTaps);
        }

        if (isMountedRef.current) {
          setTapsLeft(restoredTaps);
          tapsLeftRef.current = restoredTaps;
          setIsLoaded(true);
        }
      } catch (e) {
        console.error('fetchUserData error:', e);
        if (isMountedRef.current) setIsLoaded(true);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, isLoading]);

  // ── Flush on unmount ──────────────────────────────────────
  useEffect(() => {
    return () => {
      if (tapSaveTimerRef.current) clearTimeout(tapSaveTimerRef.current);
      const uid = userIdRef.current;
      if (!uid) return;

      supabase.from('users').update({ taps_left: tapsLeftRef.current })
        .eq('id', uid).then(({ error }) => error && console.error('Flush taps_left:', error));

      const remaining = tapBufferRef.current;
      if (remaining > 0) {
        tapBufferRef.current = 0;
        supabase.rpc('increment_ribs', { user_id: uid, amount: remaining })
          .then(({ error }) => error && console.error('Flush ribs:', error));
      }
    };
  }, []);

  // ── Title ─────────────────────────────────────────────────
  const getUserTitle = (b: number) => {
    if (b >= 300000) return 'Legend';
    if (b >= 100000) return 'Grandmaster';
    if (b >= 50000)  return 'Master';
    if (b >= 25000)  return 'Elite';
    if (b >= 10000)  return 'Skilled';
    return 'Beginner';
  };

  // ── Countdown timer ───────────────────────────────────────
  useEffect(() => {
    if (claimTime === null) return;
    const update = () => {
      const diff = claimTime - Date.now();
      if (diff <= 0) { setTimeToClaim('Ready to Claim'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeToClaim(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [claimTime]);

  // ── Tap handler ───────────────────────────────────────────
  const handleTap = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (tapsLeft <= 0 || !isLoaded) return;

    const newTaps = tapsLeft - 1;
    setTapsLeft(newTaps);
    tapsLeftRef.current = newTaps;
    setBalance(prev => prev + tapAmount);
    tapBufferRef.current += tapAmount;

    if (tapSaveTimerRef.current) clearTimeout(tapSaveTimerRef.current);
    tapSaveTimerRef.current = setTimeout(() => {
      const uid = userIdRef.current;
      if (!uid) return;
      supabase.from('users').update({ taps_left: tapsLeftRef.current })
        .eq('id', uid).then(({ error }) => error && console.error('Save taps_left:', error));
      const amt = tapBufferRef.current;
      if (amt > 0) {
        tapBufferRef.current = 0;
        supabase.rpc('increment_ribs', { user_id: uid, amount: amt })
          .then(({ error }) => error && console.error('increment_ribs:', error));
      }
    }, 2000);

    const rect   = e.currentTarget.getBoundingClientRect();
    const newNum = { id: Date.now(), x: e.clientX - rect.left, y: e.clientY - rect.top };
    setFloatingNumbers(prev => [...prev, newNum]);
    setTimeout(() => setFloatingNumbers(curr => curr.filter(n => n.id !== newNum.id)), 1500);
  };

  // ── Faucet activate ───────────────────────────────────────
  const handleActivate = async () => {
    if (!userId) return;
    const nextClaim = Date.now() + CLAIM_DURATION_MS;
    setClaimTime(nextClaim);
    setIsActivated(true);
    supabase.from('users')
      .update({ next_faucet_claim: new Date(nextClaim).toISOString() })
      .eq('id', userId)
      .then(({ error }) => {
        if (error) {
          console.error('Activate faucet:', error);
          toast({ title: 'Failed to activate faucet', variant: 'destructive' });
        } else {
          toast({ title: 'Faucet Activated! ✅' });
        }
      });
  };

  // ── Faucet claim ──────────────────────────────────────────
  const handleClaim = async () => {
    if (!userId) return;
    try {
      const nextClaimStr = await claimFaucet(userId, claimAmount);
      setBalance(prev => prev + claimAmount);
      setClaimTime(new Date(nextClaimStr).getTime());
      toast({ title: `✅ Claimed ${claimAmount} RIBS!` });
    } catch {
      toast({ title: 'Claim failed, please try again', variant: 'destructive' });
    }
  };

  // ── Upgrade handler ───────────────────────────────────────
  const handleUpgrade = async (upgradeId: string) => {
    if (!userId) return;

    const idx = upgrades.findIndex(u => u.id === upgradeId);
    if (idx === -1) return;

    const upgrade = upgrades[idx];
    if (upgrade.level >= upgrade.maxLevel) return;

    const cost = upgrade.costs[upgrade.level - 1];
    if (balance < cost) {
      toast({ title: 'Insufficient RIBS', description: `You need ${cost.toLocaleString()} RIBS.` });
      return;
    }

    const newLevel = upgrade.level + 1;
    const col      = UPGRADE_COL[upgradeId];

    // Optimistic update
    setBalance(prev => prev - cost);
    setUpgrades(prev => prev.map((u, i) => i === idx ? { ...u, level: newLevel } : u));

    try {
      // Save new level + deduct RIBS in parallel
      const [ribsRes, levelRes] = await Promise.all([
        supabase.rpc('increment_ribs', { user_id: userId, amount: -cost }),
        col
          ? supabase.from('users').update({ [col]: newLevel }).eq('id', userId)
          : Promise.resolve({ error: null }),
      ]);

      if (ribsRes.error) throw ribsRes.error;
      if (levelRes.error) throw levelRes.error;

      toast({ title: `✅ ${upgrade.name} upgraded to level ${newLevel}!` });
    } catch (e) {
      console.error('handleUpgrade error:', e);
      // Rollback
      setBalance(prev => prev + cost);
      setUpgrades(prev => prev.map((u, i) => i === idx ? { ...u, level: upgrade.level } : u));
      toast({ title: 'Upgrade failed, please try again', variant: 'destructive' });
    }
  };

  const userTitle = getUserTitle(balance);

  // ── Render ────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="relative overflow-hidden">
        {/* Top row */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex flex-col items-start gap-2">
            <Button
              onClick={async () => {
                if (!userId) return;
                const res = await checkIn(userId);
                if (res.success) {
                  setCheckInCount(res.count || checkInCount + 1);
                  setHasCheckedInToday(true);
                  setBalance(prev => prev + 200);
                  toast({ title: '✅ Checked in! +200 RIBS' });
                } else {
                  toast({ title: 'Check-in failed', description: res.message, variant: 'destructive' });
                }
              }}
              disabled={hasCheckedInToday || !isLoaded}
              className="bg-gradient-to-b from-slate-300 to-slate-500 text-slate-900 font-bold text-xs px-3 py-1.5 h-auto"
            >
              <CalendarCheck className="mr-2 h-4 w-4" /> Check-in: {checkInCount}x
            </Button>
            <Link href="/spin">
              <Button className="bg-gradient-to-b from-slate-300 to-slate-500 text-slate-900 font-bold text-xs px-3 py-1.5 h-auto">
                <Disc className="mr-2 h-4 w-4" /> Free Spin
              </Button>
            </Link>
          </div>

          <div className={cn(
            'text-xs font-bold px-3 py-1.5 rounded-full shadow-md',
            balance >= 300000
              ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black'
              : 'bg-secondary'
          )}>
            {userTitle}
          </div>
        </div>

        <div className="text-center space-y-4">
          {/* Balance */}
          <div>
            <p className="text-muted-foreground flex items-center justify-center gap-2 mb-1 text-sm">
              <RibsIcon className="w-4 h-4" />
              {tgUser
                ? `@${tgUser.username || tgUser.first_name || 'User'}'s RIBS`
                : 'RIBS Balance'}
            </p>
            <h1 className="font-headline text-5xl font-bold text-primary">
              {balance.toLocaleString('en-US')}
            </h1>
          </div>

          {/* Tap button */}
          <div className="flex flex-col items-center space-y-4">
            <button
              onClick={handleTap}
              disabled={tapsLeft <= 0 || !isLoaded}
              className="relative w-64 h-64 rounded-full bg-primary/20 border-4 border-primary/50 shadow-lg transition-transform duration-100 active:scale-95 disabled:opacity-50 flex items-center justify-center"
            >
              <Image
                src="https://gold-defensive-cattle-30.mypinata.cloud/ipfs/bafybeigwlusnazuypgpol5nzay6oaktvebki7i4hwwrsztxfl6ilisb7om"
                alt="RIBS"
                width={96}
                height={96}
                className="rounded-full object-contain"
              />
              {floatingNumbers.map(num => (
                <span
                  key={num.id}
                  className="tap-float-animation absolute text-3xl font-bold text-primary pointer-events-none"
                  style={{ left: num.x, top: num.y }}
                >
                  +{tapAmount}
                </span>
              ))}
            </button>

            {/* Energy bar */}
            <div className="w-full max-w-xs text-center space-y-1">
              <p className="text-lg font-bold">
                {isLoaded
                  ? `${tapsLeft.toLocaleString('en-US')} / ${dailyTaps.toLocaleString('en-US')}`
                  : 'Loading...'}
              </p>
              <Progress value={isLoaded ? (tapsLeft / dailyTaps) * 100 : 0} className="h-3" />
              {tapsLeft <= 0 && isLoaded && (
                <p className="text-xs text-destructive font-medium mt-1">
                  ⚡ Energy depleted! Come back tomorrow.
                </p>
              )}
            </div>
          </div>

          {/* Faucet */}
          <div className="flex justify-between items-center text-left">
            <div>
              <h2 className="font-headline text-2xl font-semibold">Faucet Claim :</h2>
              <p className="text-sm text-muted-foreground">Rate : {faucetBenefit}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {!isActivated ? (
                <Button
                  onClick={handleActivate}
                  disabled={!isLoaded || !userId}
                  className="bg-gradient-to-b from-slate-300 to-slate-500 text-slate-900 font-bold"
                >
                  Activate
                </Button>
              ) : timeToClaim === 'Ready to Claim' ? (
                <Button
                  onClick={handleClaim}
                  className="bg-gradient-to-b from-slate-300 to-slate-500 text-slate-900 font-bold"
                >
                  Claim
                </Button>
              ) : (
                <p className="text-3xl font-mono tabular-nums">{timeToClaim}</p>
              )}
              <Button
                onClick={() => setIsUpgradeSheetOpen(true)}
                className="bg-gradient-to-b from-slate-300 to-slate-500 text-slate-900 font-bold"
              >
                <ArrowUpCircle className="mr-2 h-4 w-4" /> Upgrade
              </Button>
            </div>
          </div>
        </div>

        <UpgradeSheet
          isOpen={isUpgradeSheetOpen}
          onOpenChange={setIsUpgradeSheetOpen}
          upgrades={upgrades}
          handleUpgrade={handleUpgrade}
        />
      </div>
    </AppLayout>
  );
}
