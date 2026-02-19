'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CalendarCheck, Disc, ArrowUpCircle } from 'lucide-react';
import { AppLayout } from '@/components/ribs/app-layout';
import { RibsIcon } from '@/components/ribs/ribs-icon';
import { UpgradeSheet } from '@/components/ribs/upgrade-sheet';
import { cn } from '@/lib/utils';
import { upgrades as initialUpgrades, type Upgrade, getUserProfile, updateUserRibs } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useTelegram } from '@/components/telegram-provider'; // ✅ Import context

const CLAIM_DURATION_MS = 2 * 60 * 60 * 1000;

export default function FarmPage() {
  const [balance, setBalance] = useState(0);
  const [tapsLeft, setTapsLeft] = useState(1000);
  const [claimTime, setClaimTime] = useState<number | null>(null);
  const [timeToClaim, setTimeToClaim] = useState('');
  const [isUpgradeSheetOpen, setIsUpgradeSheetOpen] = useState(false);
  const [floatingNumbers, setFloatingNumbers] = useState<{ id: number; x: number; y: number }[]>([]);
  const [checkInCount, setCheckInCount] = useState(1);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const { toast } = useToast();
  const [upgrades, setUpgrades] = useState<Upgrade[]>(initialUpgrades);

  // ✅ Gunakan context, bukan akses window.Telegram langsung
  const { user: tgUser, isLoading } = useTelegram();
  const userId = tgUser?.id ?? null;

  const [isActivated, setIsActivated] = useState(false);

  // ✅ Load user data dari Supabase saat userId tersedia
  useEffect(() => {
    if (!userId) return;

    const fetchUserData = async () => {
      const profile = await getUserProfile(userId);
      if (profile) {
        setBalance(profile.ribs ?? 0);
        setCheckInCount(profile.checkin_count ?? 0);
        
        if (profile.last_checkin) {
          const lastDate = new Date(profile.last_checkin).toISOString().split('T')[0];
          const todayDate = new Date().toISOString().split('T')[0];
          setHasCheckedInToday(lastDate === todayDate);
        }

        if (profile.next_faucet_claim) {
          const nextClaim = new Date(profile.next_faucet_claim).getTime();
          setClaimTime(nextClaim);
          setIsActivated(true);
        } else {
          setIsActivated(false);
          setClaimTime(null);
        }
      }
    };

    fetchUserData();
  }, [userId]);

  const handleActivate = async () => {
    if (!userId) return;
    const nextClaim = Date.now() + CLAIM_DURATION_MS;
    setClaimTime(nextClaim);
    setIsActivated(true);
    await supabase.from('users').update({ next_faucet_claim: new Date(nextClaim).toISOString() }).eq('id', userId);
    toast({ title: 'Faucet Activated!' });
  };

  // ── Upgrade computed values ──────────────────────────────
  const faucetUpgrade = upgrades.find(u => u.id === 'faucet-rate');
  const faucetBenefit = faucetUpgrade ? faucetUpgrade.benefits[faucetUpgrade.level - 1] : '200';
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

    const interval = setInterval(() => {
      const diff = claimTime - Date.now();
      if (diff <= 0) {
        setTimeToClaim('Ready to Claim');
        clearInterval(interval);
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeToClaim(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [claimTime]);

  // ── Handlers ─────────────────────────────────────────────
  const handleTap = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (tapsLeft <= 0) return;

    const newBalance = balance + tapAmount;
    setBalance(newBalance);
    setTapsLeft(prev => prev - 1);

    // ✅ Hanya update Supabase jika ada userId
    if (userId) {
      updateUserRibs(userId, tapAmount).catch(console.error);
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const newNum = { id: Date.now(), x: e.clientX - rect.left, y: e.clientY - rect.top };
    setFloatingNumbers(prev => [...prev, newNum]);
    setTimeout(() => {
      setFloatingNumbers(curr => curr.filter(n => n.id !== newNum.id));
    }, 1500);
  };

  const handleClaim = async () => {
    setBalance(prev => prev + claimAmount);
    setClaimTime(Date.now() + CLAIM_DURATION_MS);
    if (userId) await updateUserRibs(userId, claimAmount);
    toast({ title: `Claimed ${claimAmount} RIBS!` });
  };

  const handleUpgrade = (upgradeId: string) => {
    const idx = upgrades.findIndex(u => u.id === upgradeId);
    if (idx === -1) return;

    const upgrade = upgrades[idx];
    const cost = upgrade.costs[upgrade.level - 1];

    if (balance < cost) {
      toast({ title: 'Insufficient RIBS', description: `You need ${cost.toLocaleString()} RIBS.` });
      return;
    }

    setBalance(prev => prev - cost);
    if (userId) updateUserRibs(userId, -cost).catch(console.error);

    const newUpgrades = [...upgrades];
    newUpgrades[idx] = { ...newUpgrades[idx], level: newUpgrades[idx].level + 1 };
    setUpgrades(newUpgrades);
    toast({ title: `Upgraded ${upgrade.name}!` });
  };

  // ── Render ───────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="relative">
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col items-start gap-2 pt-8">
            <Button
              onClick={() => setHasCheckedInToday(true)}
              disabled={hasCheckedInToday}
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
          <div>
            <h1 className="font-headline text-5xl font-bold text-primary">
              {balance.toLocaleString('en-US')}
            </h1>
            <p className="text-muted-foreground flex items-center justify-center gap-2">
              <RibsIcon className="w-5 h-5" />
              {tgUser ? `@${tgUser.username || tgUser.first_name || 'User'}'s RIBS` : 'Your RIBS Balance'}
            </p>
            {/* ✅ Debug indicator - hapus setelah production stabil */}
            {process.env.NODE_ENV === 'development' && (
              <p className="text-xs text-muted-foreground mt-1">
                UserID: {userId ?? 'Not detected'} | Loaded: {!isLoading ? '✅' : '⏳'}
              </p>
            )}
          </div>

          <div className="flex flex-col items-center space-y-4">
            <button
              onClick={handleTap}
              disabled={tapsLeft <= 0}
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
                {tapsLeft.toLocaleString('en-US')} / {dailyTaps.toLocaleString('en-US')}
              </p>
              <Progress value={(tapsLeft / dailyTaps) * 100} className="h-3" />
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-secondary to-card border border-border p-6 space-y-3">
            <div className="flex justify-between items-center text-left">
              <div>
                <h2 className="font-headline text-2xl font-semibold">Faucet Claim :</h2>
                <p className="text-sm text-muted-foreground">Rate : {faucetBenefit}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {timeToClaim === 'Ready to Claim' ? (
                  <Button
                    onClick={handleClaim}
                    className="bg-gradient-to-b from-slate-300 to-slate-500 text-slate-900 font-bold"
                  >
                    Claim
                  </Button>
                ) : (
                  <p className="text-3xl">{timeToClaim}</p>
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
