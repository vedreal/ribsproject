'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CalendarCheck, Disc, ArrowUpCircle } from 'lucide-react';
import { AppLayout } from '@/components/ribs/app-layout';
import { RibsIcon } from '@/components/ribs/ribs-icon';
import { UpgradeSheet } from '@/components/ribs/upgrade-sheet';
import { cn } from '@/lib/utils';
import { upgrades as initialUpgrades, type Upgrade, getUserProfile, checkIn, claimFaucet } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useTelegram } from '@/components/telegram-provider';
import { supabase } from '@/lib/supabase';

const CLAIM_DURATION_MS = 2 * 60 * 60 * 1000;

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
  const { toast } = useToast();
  const [upgrades, setUpgrades] = useState<Upgrade[]>(initialUpgrades);

  const { user: tgUser, isLoading } = useTelegram();
  const userId = tgUser?.id ?? null;

  // Semua refs — tidak trigger re-render, aman di cleanup
  const tapBufferRef = useRef(0);
  const tapSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapsLeftRef = useRef(1000);
  const userIdRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  // Sync userId ke ref setiap kali berubah
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  // Mark unmounted saat cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ── Computed dari upgrades ──────────────────────────────
  const faucetUpgrade = upgrades.find(u => u.id === 'faucet-rate');
  const faucetBenefit = faucetUpgrade
    ? faucetUpgrade.benefits[faucetUpgrade.level - 1]
    : '+200 RIBS/2hr';
  const claimAmount = parseInt(faucetBenefit.match(/\d+/)?.[0] || '200');

  const tapPowerUpgrade = upgrades.find(u => u.id === 'tap-power');
  const tapAmount = parseInt(
    (tapPowerUpgrade?.benefits[tapPowerUpgrade.level - 1] ?? '+1 RIBS/tap').match(/\d+/)?.[0] || '1'
  );

  const tapEnergyUpgrade = upgrades.find(u => u.id === 'tap-energy');
  const dailyTaps = parseInt(
    (tapEnergyUpgrade?.benefits[tapEnergyUpgrade.level - 1] ?? '+1000 Taps').match(/\d+/)?.[0] || '1000'
  );

  // ── Helper: save ke Supabase (tidak throw, hanya log) ───
  const safeSaveTaps = useCallback(async (uid: number, taps: number) => {
    try {
      await supabase
        .from('users')
        .update({ taps_left: taps })
        .eq('id', uid);
    } catch (e) {
      console.error('safeSaveTaps error:', e);
    }
  }, []);

  const safeSaveRibs = useCallback(async (uid: number, amount: number) => {
    try {
      await supabase.rpc('increment_ribs', { user_id: uid, amount });
    } catch (e) {
      console.error('safeSaveRibs error:', e);
    }
  }, []);

  // ── Load user data saat mount ────────────────────────────
  useEffect(() => {
    if (!userId || isLoading) return;

    const fetchUserData = async () => {
      try {
        const profile = await getUserProfile(userId);
        if (!profile) {
          setIsLoaded(true);
          return;
        }

        if (!isMountedRef.current) return;

        setBalance(profile.ribs ?? 0);
        setCheckInCount(profile.checkin_count ?? 0);

        // Check-in hari ini
        if (profile.last_checkin) {
          const lastDate = new Date(profile.last_checkin).toISOString().split('T')[0];
          const todayDate = new Date().toISOString().split('T')[0];
          setHasCheckedInToday(lastDate === todayDate);
        }

        // Faucet timer
        if (profile.next_faucet_claim) {
          const nextClaim = new Date(profile.next_faucet_claim).getTime();
          setClaimTime(nextClaim > Date.now() ? nextClaim : Date.now());
          setIsActivated(true);
        }

        // Tap energy — reset harian
        const todayDate = new Date().toISOString().split('T')[0];
        const savedResetDate = profile.taps_reset_date
          ? new Date(profile.taps_reset_date).toISOString().split('T')[0]
          : null;

        let restoredTaps: number;

        if (!savedResetDate || savedResetDate !== todayDate) {
          // Hari baru → reset ke penuh
          restoredTaps = dailyTaps;
          // Fire and forget — tidak await agar tidak block render
          supabase.from('users').update({
            taps_left: dailyTaps,
            taps_reset_date: todayDate,
          }).eq('id', userId).then(({ error }) => {
            if (error) console.error('Reset taps error:', error);
          });
        } else {
          restoredTaps = Math.min(profile.taps_left ?? dailyTaps, dailyTaps);
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
    };

    fetchUserData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, isLoading]);

  // ── Flush saat pindah halaman (cleanup) ─────────────────
  // PENTING: cleanup function harus SYNCHRONOUS.
  // Kita gunakan fire-and-forget (tidak await) agar tidak crash.
  useEffect(() => {
    return () => {
      // Cancel debounce timer
      if (tapSaveTimerRef.current) {
        clearTimeout(tapSaveTimerRef.current);
        tapSaveTimerRef.current = null;
      }

      const uid = userIdRef.current;
      if (!uid) return;

      // Fire and forget — sync cleanup, async execution
      // Simpan taps_left
      supabase
        .from('users')
        .update({ taps_left: tapsLeftRef.current })
        .eq('id', uid)
        .then(({ error }) => {
          if (error) console.error('Cleanup save taps_left error:', error);
        });

      // Simpan sisa RIBS buffer
      const remaining = tapBufferRef.current;
      if (remaining > 0) {
        tapBufferRef.current = 0;
        supabase
          .rpc('increment_ribs', { user_id: uid, amount: remaining })
          .then(({ error }) => {
            if (error) console.error('Cleanup increment_ribs error:', error);
          });
      }
    };
  }, []); // kosong — pakai refs

  // ── Title ────────────────────────────────────────────────
  const getUserTitle = (b: number): string => {
    if (b >= 300000) return 'Legend';
    if (b >= 100000) return 'Grandmaster';
    if (b >= 50000) return 'Master';
    if (b >= 25000) return 'Elite';
    if (b >= 10000) return 'Skilled';
    return 'Beginner';
  };

  // ── Countdown timer ──────────────────────────────────────
  useEffect(() => {
    if (claimTime === null) return;
    const update = () => {
      const diff = claimTime - Date.now();
      if (diff <= 0) {
        setTimeToClaim('Ready to Claim');
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeToClaim(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [claimTime]);

  // ── Tap handler ──────────────────────────────────────────
  const handleTap = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (tapsLeft <= 0 || !isLoaded) return;

    const newTapsLeft = tapsLeft - 1;
    setTapsLeft(newTapsLeft);
    tapsLeftRef.current = newTapsLeft;
    setBalance(prev => prev + tapAmount);
    tapBufferRef.current += tapAmount;

    // Debounce save 2 detik
    if (tapSaveTimerRef.current) clearTimeout(tapSaveTimerRef.current);
    tapSaveTimerRef.current = setTimeout(() => {
      const uid = userIdRef.current;
      if (!uid) return;

      // Save taps_left
      safeSaveTaps(uid, tapsLeftRef.current);

      // Save RIBS buffer
      const amount = tapBufferRef.current;
      if (amount > 0) {
        tapBufferRef.current = 0;
        safeSaveRibs(uid, amount);
      }
    }, 2000);

    // Floating number animation
    const rect = e.currentTarget.getBoundingClientRect();
    const newNum = { id: Date.now(), x: e.clientX - rect.left, y: e.clientY - rect.top };
    setFloatingNumbers(prev => [...prev, newNum]);
    setTimeout(
      () => setFloatingNumbers(curr => curr.filter(n => n.id !== newNum.id)),
      1500
    );
  };

  // ── Faucet activate ──────────────────────────────────────
  const handleActivate = async () => {
    if (!userId) return;
    const nextClaim = Date.now() + CLAIM_DURATION_MS;
    setClaimTime(nextClaim);
    setIsActivated(true);
    try {
      await supabase
        .from('users')
        .update({ next_faucet_claim: new Date(nextClaim).toISOString() })
        .eq('id', userId);
      toast({ title: 'Faucet Activated! ✅' });
    } catch {
      toast({ title: 'Gagal mengaktifkan faucet', variant: 'destructive' });
    }
  };

  // ── Faucet claim ─────────────────────────────────────────
  const handleClaim = async () => {
    if (!userId) return;
    try {
      const nextClaimStr = await claimFaucet(userId, claimAmount);
      setBalance(prev => prev + claimAmount);
      setClaimTime(new Date(nextClaimStr).getTime());
      toast({ title: `✅ Claimed ${claimAmount} RIBS!` });
    } catch {
      toast({ title: 'Claim gagal, coba lagi', variant: 'destructive' });
    }
  };

  // ── Upgrade ──────────────────────────────────────────────
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

    // Optimistic update
    setBalance(prev => prev - cost);
    const newUpgrades = upgrades.map((u, i) =>
      i === idx ? { ...u, level: u.level + 1 } : u
    );
    setUpgrades(newUpgrades);

    try {
      const { error } = await supabase.rpc('increment_ribs', { user_id: userId, amount: -cost });
      if (error) throw error;
      toast({ title: `✅ Upgraded ${upgrade.name}!` });
    } catch {
      // Rollback
      setBalance(prev => prev + cost);
      setUpgrades(upgrades);
      toast({ title: 'Upgrade gagal', variant: 'destructive' });
    }
  };

  const userTitle = getUserTitle(balance);

  // ── Render ───────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="relative">
        {/* Top row */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col items-start gap-2 pt-8">
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
                  toast({
                    title: 'Check-in failed',
                    description: res.message,
                    variant: 'destructive',
                  });
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

          <div
            className={cn(
              'text-xs font-bold px-3 py-1.5 rounded-full shadow-md mt-8',
              balance >= 300000
                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black'
                : 'bg-secondary'
            )}
          >
            {userTitle}
          </div>
        </div>

        <div className="text-center space-y-8">
          {/* Balance */}
          <div>
            <h1 className="font-headline text-5xl font-bold text-primary">
              {balance.toLocaleString('en-US')}
            </h1>
            <p className="text-muted-foreground flex items-center justify-center gap-2">
              <RibsIcon className="w-5 h-5" />
              {tgUser
                ? `@${tgUser.username || tgUser.first_name || 'User'}'s RIBS`
                : 'Your RIBS Balance'}
            </p>
          </div>

          {/* Tap button + energy bar */}
          <div className="flex flex-col items-center space-y-4">
            <button
              onClick={handleTap}
              disabled={tapsLeft <= 0 || !isLoaded}
              className="relative w-64 h-64 rounded-full bg-primary/20 border-4 border-primary/50 shadow-lg transition-transform duration-100 active:scale-95 disabled:opacity-50 flex items-center justify-center"
            >
              <RibsIcon className="w-24 h-24 text-primary" />
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
              <Progress
                value={isLoaded ? (tapsLeft / dailyTaps) * 100 : 0}
                className="h-3"
              />
              {tapsLeft <= 0 && isLoaded && (
                <p className="text-xs text-destructive font-medium mt-1">
                  ⚡ Energy habis! Kembali besok untuk tap lagi.
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
