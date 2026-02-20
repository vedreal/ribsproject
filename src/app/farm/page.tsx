'use client';

import { useState, useEffect, useRef } from 'react';
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
  const { toast } = useToast();
  const [upgrades, setUpgrades] = useState<Upgrade[]>(initialUpgrades);

  const { user: tgUser, isLoading } = useTelegram();
  const userId = tgUser?.id ?? null;

  const [isActivated, setIsActivated] = useState(false);

  // Refs untuk buffer & flush
  const tapBufferRef = useRef(0);          // akumulasi RIBS dari tap
  const tapSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tapsLeftRef = useRef(1000);        // nilai tapsLeft terkini (untuk flush saat unmount)
  const userIdRef = useRef<number | null>(null);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  // ── Computed dari upgrades ───────────────────────────────
  const faucetUpgrade = upgrades.find(u => u.id === 'faucet-rate');
  const faucetBenefit = faucetUpgrade ? faucetUpgrade.benefits[faucetUpgrade.level - 1] : '+200 RIBS/2hr';
  const claimAmount = faucetUpgrade
    ? parseInt(faucetBenefit.match(/\d+/)?.[0] || '200')
    : 200;

  const tapPowerUpgrade = upgrades.find(u => u.id === 'tap-power');
  const tapAmount = tapPowerUpgrade
    ? parseInt(tapPowerUpgrade.benefits[tapPowerUpgrade.level - 1].match(/\d+/)?.[0] || '1')
    : 1;

  const tapEnergyUpgrade = upgrades.find(u => u.id === 'tap-energy');
  const dailyTaps = tapEnergyUpgrade
    ? parseInt(tapEnergyUpgrade.benefits[tapEnergyUpgrade.level - 1].match(/\d+/)?.[0] || '1000')
    : 1000;

  // ── Load user data dari Supabase ──────────────────────────
  useEffect(() => {
    if (!userId || isLoading) return;

    const fetchUserData = async () => {
      const profile = await getUserProfile(userId);
      if (profile) {
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

        // ── Tap Energy: cek reset harian ───────────────────
        const todayDate = new Date().toISOString().split('T')[0];
        const savedResetDate = profile.taps_reset_date
          ? new Date(profile.taps_reset_date).toISOString().split('T')[0]
          : null;

        let restoredTaps: number;

        if (!savedResetDate || savedResetDate !== todayDate) {
          // Hari baru → reset tap energy ke penuh
          restoredTaps = dailyTaps;
          await supabase.from('users').update({
            taps_left: dailyTaps,
            taps_reset_date: todayDate,
          }).eq('id', userId);
        } else {
          // Hari sama → restore dari DB
          restoredTaps = Math.min(profile.taps_left ?? dailyTaps, dailyTaps);
        }

        setTapsLeft(restoredTaps);
        tapsLeftRef.current = restoredTaps;
      }

      setIsLoaded(true);
    };

    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, isLoading]);

  // ── Flush saat pindah halaman / unmount ──────────────────
  useEffect(() => {
    return () => {
      if (tapSaveTimerRef.current) {
        clearTimeout(tapSaveTimerRef.current);
      }

      const uid = userIdRef.current;
      if (!uid) return;

      // Selalu simpan taps_left terkini
      supabase.from('users').update({
        taps_left: tapsLeftRef.current,
      }).eq('id', uid).catch(console.error);

      // Simpan sisa buffer RIBS
      if (tapBufferRef.current > 0) {
        supabase.rpc('increment_ribs', {
          user_id: uid,
          amount: tapBufferRef.current,
        }).catch(console.error);
        tapBufferRef.current = 0;
      }
    };
  }, []); // intentionally empty — pakai ref biar tidak re-register

  // ── Title ────────────────────────────────────────────────
  const getUserTitle = (b: number): string => {
    if (b >= 300000) return 'Legend';
    if (b >= 100000) return 'Grandmaster';
    if (b >= 50000) return 'Master';
    if (b >= 25000) return 'Elite';
    if (b >= 10000) return 'Skilled';
    return 'Beginner';
  };
  const userTitle = getUserTitle(balance);

  // ── Countdown timer ──────────────────────────────────────
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

    // Debounce: simpan 2 detik setelah tap terakhir
    if (tapSaveTimerRef.current) clearTimeout(tapSaveTimerRef.current);
    tapSaveTimerRef.current = setTimeout(async () => {
      if (!userId) return;

      const savePromises: Promise<any>[] = [];

      // Simpan taps_left
      savePromises.push(
        supabase.from('users').update({
          taps_left: tapsLeftRef.current,
        }).eq('id', userId).then(({ error }) => {
          if (error) console.error('Save taps_left error:', error);
        })
      );

      // Simpan RIBS
      if (tapBufferRef.current > 0) {
        const amount = tapBufferRef.current;
        tapBufferRef.current = 0;
        savePromises.push(
          supabase.rpc('increment_ribs', { user_id: userId, amount }).then(({ error }) => {
            if (error) console.error('increment_ribs error:', error);
          })
        );
      }

      await Promise.all(savePromises);
    }, 2000);

    // Floating number animation
    const rect = e.currentTarget.getBoundingClientRect();
    const newNum = { id: Date.now(), x: e.clientX - rect.left, y: e.clientY - rect.top };
    setFloatingNumbers(prev => [...prev, newNum]);
    setTimeout(() => setFloatingNumbers(curr => curr.filter(n => n.id !== newNum.id)), 1500);
  };

  // ── Faucet activate ──────────────────────────────────────
  const handleActivate = async () => {
    if (!userId) return;
    const nextClaim = Date.now() + CLAIM_DURATION_MS;
    setClaimTime(nextClaim);
    setIsActivated(true);
    const { error } = await supabase
      .from('users')
      .update({ next_faucet_claim: new Date(nextClaim).toISOString() })
      .eq('id', userId);
    if (error) {
      console.error('Failed to activate faucet:', error);
      toast({ title: 'Gagal mengaktifkan faucet', variant: 'destructive' });
    } else {
      toast({ title: 'Faucet Activated! ✅' });
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
    } catch (err) {
      console.error('Claim failed:', err);
      toast({ title: 'Claim gagal, coba lagi', variant: 'destructive' });
    }
  };

  // ── Upgrade ──────────────────────────────────────────────
  const handleUpgrade = async (upgradeId: string) => {
    if (!userId) return;
    const idx = upgrades.findIndex(u => u.id === upgradeId);
    if (idx === -1) return;

    const upgrade = upgrades[idx];
    const cost = upgrade.costs[upgrade.level - 1];

    if (balance < cost) {
      toast({ title: 'Insufficient RIBS', description: `You need ${cost.toLocaleString()} RIBS.` });
      return;
    }

    setBalance(prev => prev - cost);
    const newUpgrades = [...upgrades];
    newUpgrades[idx] = { ...newUpgrades[idx], level: newUpgrades[idx].level + 1 };
    setUpgrades(newUpgrades);

    try {
      const { error } = await supabase.rpc('increment_ribs', { user_id: userId, amount: -cost });
      if (error) throw error;
      toast({ title: `✅ Upgraded ${upgrade.name}!` });
    } catch {
      setBalance(prev => prev + cost);
      setUpgrades(upgrades);
      toast({ title: 'Upgrade gagal', variant: 'destructive' });
    }
  };

  // ── Render ───────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="relative">
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
            'text-xs font-bold px-3 py-1.5 rounded-full shadow-md mt-8',
            balance >= 300000
              ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black'
              : 'bg-secondary'
          )}>
            {userTitle}
          </div>
        </div>

        <div className="text-center space-y-8">
          <div>
            <h1 className="font-headline text-5xl font-bold text-primary">
              {balance.toLocaleString('en-US')}
            </h1>
            <p className="text-muted-foreground flex items-center justify-center gap-2">
              <RibsIcon className="w-5 h-5" />
              {tgUser ? `@${tgUser.username || tgUser.first_name || 'User'}'s RIBS` : 'Your RIBS Balance'}
            </p>
          </div>

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

            <div className="w-full max-w-xs text-center space-y-1">
              <p className="text-lg font-bold">
                {isLoaded
                  ? `${tapsLeft.toLocaleString('en-US')} / ${dailyTaps.toLocaleString('en-US')}`
                  : 'Loading...'}
              </p>
              <Progress value={isLoaded ? (tapsLeft / dailyTaps) * 100 : 0} className="h-3" />
              {tapsLeft <= 0 && isLoaded && (
                <p className="text-xs text-destructive font-medium mt-1">
                  ⚡ Energy habis! Kembali besok untuk tap lagi.
                </p>
              )}
            </div>
          </div>

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
