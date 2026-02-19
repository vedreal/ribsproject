'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Gem, CalendarCheck, Disc, ArrowUpCircle } from 'lucide-react';
import { AppLayout } from '@/components/ribs/app-layout';
import { RibsIcon } from '@/components/ribs/ribs-icon';
import { UpgradeSheet } from '@/components/ribs/upgrade-sheet';
import { cn } from '@/lib/utils';
import { upgrades as initialUpgrades, type Upgrade, getUserProfile, updateUserRibs } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

const CLAIM_DURATION_MS = 2 * 60 * 60 * 1000;

export default function FarmPage() {
  const [balance, setBalance] = useState(0);
  const [tapsLeft, setTapsLeft] = useState(1000);
  const [claimTime, setClaimTime] = useState<number | null>(null);
  const [timeToClaim, setTimeToClaim] = useState('');
  const [isUpgradeSheetOpen, setIsUpgradeSheetOpen] = useState(false);
  const [floatingNumbers, setFloatingNumbers] = useState<any[]>([]);
  const [checkInCount, setCheckInCount] = useState(1);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const { toast } = useToast();
  const [upgrades, setUpgrades] = useState<Upgrade[]>(initialUpgrades);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
        if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user) {
            const tgUser = window.Telegram.WebApp.initDataUnsafe.user;
            setUserId(tgUser.id);
            
            // Try to sync user here as well to be sure
            const { data: syncedUser, error: syncError } = await supabase
                .from('users')
                .upsert({
                    id: tgUser.id,
                    username: tgUser.username || '',
                    first_name: tgUser.first_name || '',
                    last_name: tgUser.last_name || '',
                    referral_code: `ref_${tgUser.id}`,
                }, { onConflict: 'id' })
                .select()
                .single();

            const profile = syncedUser || await getUserProfile(tgUser.id);
            if (profile) {
                setBalance(profile.ribs);
            }
        }
    };
    fetchUser();
    setClaimTime(Date.now() + CLAIM_DURATION_MS);
  }, []);

  const faucetUpgrade = upgrades.find(u => u.id === 'faucet-rate');
  const faucetBenefit = faucetUpgrade ? faucetUpgrade.benefits[faucetUpgrade.level - 1] : '200';
  const claimAmount = faucetUpgrade ? parseInt(faucetBenefit.match(/\d+/)?.[0] || '200') : 200;

  const tapPowerUpgrade = upgrades.find(u => u.id === 'tap-power');
  const tapAmount = tapPowerUpgrade ? parseInt(tapPowerUpgrade.benefits[tapPowerUpgrade.level - 1].match(/\d+/)?.[0] || '1') : 1;

  const tapEnergyUpgrade = upgrades.find(u => u.id === 'tap-energy');
  const dailyTaps = tapEnergyUpgrade ? parseInt(tapEnergyUpgrade.benefits[tapEnergyUpgrade.level - 1].match(/\d+/)?.[0] || '1000') : 1000;

  const getUserTitle = (b: number): string => {
    if (b >= 300000) return 'Legend';
    if (b >= 100000) return 'Grandmaster';
    if (b >= 50000) return 'Master';
    if (b >= 25000) return 'Elite';
    if (b >= 10000) return 'Skilled';
    return 'Beginner';
  };

  const userTitle = getUserTitle(balance);

  useEffect(() => {
    if (claimTime === null) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = claimTime - now;
      if (diff <= 0) {
        setTimeToClaim('Ready to Claim');
        clearInterval(interval);
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeToClaim(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [claimTime]);

  const handleTap = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (tapsLeft <= 0) return;
    const newBalance = balance + tapAmount;
    setBalance(newBalance);
    setTapsLeft(prev => prev - 1);
    
    if (userId) {
        updateUserRibs(userId, tapAmount);
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const newFloatingNumber = { id: Date.now(), x: e.clientX - rect.left, y: e.clientY - rect.top };
    setFloatingNumbers(prev => [...prev, newFloatingNumber]);
    setTimeout(() => {
      setFloatingNumbers(current => current.filter(n => n.id !== newFloatingNumber.id));
    }, 1500);
  };

  const handleClaim = async () => {
    setBalance(prev => prev + claimAmount);
    setClaimTime(Date.now() + CLAIM_DURATION_MS);
    if (userId) await updateUserRibs(userId, claimAmount);
  };

  const handleUpgrade = (upgradeId: string) => {
    const upgradeIndex = upgrades.findIndex(u => u.id === upgradeId);
    if (upgradeIndex === -1) return;
    const upgrade = upgrades[upgradeIndex];
    const cost = upgrade.costs[upgrade.level - 1];
    if (balance >= cost) {
      setBalance(prev => prev - cost);
      if (userId) updateUserRibs(userId, -cost);
      const newUpgrades = [...upgrades];
      newUpgrades[upgradeIndex] = { ...newUpgrades[upgradeIndex], level: newUpgrades[upgradeIndex].level + 1 };
      setUpgrades(newUpgrades);
      toast({ title: `Upgraded ${upgrade.name}!` });
    }
  };

  return (
    <AppLayout>
      <div className="relative">
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col items-start gap-2 pt-8">
            <Button onClick={() => setHasCheckedInToday(true)} disabled={hasCheckedInToday} className="bg-gradient-to-b from-slate-300 to-slate-500 text-slate-900 font-bold text-xs px-3 py-1.5 h-auto">
              <CalendarCheck className="mr-2 h-4 w-4" /> Check-in: {checkInCount}x
            </Button>
            <Link href="/spin"><Button className="bg-gradient-to-b from-slate-300 to-slate-500 text-slate-900 font-bold text-xs px-3 py-1.5 h-auto"><Disc className="mr-2 h-4 w-4" /> Free Spin</Button></Link>
          </div>
          <div className={cn('text-xs font-bold px-3 py-1.5 rounded-full shadow-md mt-8', balance >= 300000 ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black' : 'bg-secondary')}>
            {userTitle}
          </div>
        </div>
        <div className="text-center space-y-8">
          <div><h1 className="font-headline text-5xl font-bold text-primary">{balance.toLocaleString('en-US')}</h1><p className="text-muted-foreground flex items-center justify-center gap-2"><RibsIcon className="w-5 h-5" /> Your RIBS Balance</p></div>
          <div className="flex flex-col items-center space-y-4">
            <button onClick={handleTap} disabled={tapsLeft <= 0} className="relative w-64 h-64 rounded-full bg-primary/20 border-4 border-primary/50 shadow-lg transition-transform duration-100 active:scale-95 disabled:opacity-50 flex items-center justify-center">
              <RibsIcon className="w-24 h-24 text-primary" />
              {floatingNumbers.map(num => (<span key={num.id} className="tap-float-animation absolute text-3xl font-bold text-primary pointer-events-none" style={{ left: num.x, top: num.y }}>+{tapAmount}</span>))}
            </button>
            <div className="w-full max-w-xs text-center space-y-1">
              <p className="text-lg font-bold">{tapsLeft.toLocaleString('en-US')} / {dailyTaps.toLocaleString('en-US')}</p>
              <Progress value={(tapsLeft / dailyTaps) * 100} className="h-3" />
            </div>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-secondary to-card border border-border p-6 space-y-3">
            <div className="flex justify-between items-center text-left">
              <div><h2 className="font-headline text-2xl font-semibold">Faucet Claim :</h2><p className="text-sm text-muted-foreground">Rate : {faucetBenefit}</p></div>
              <div className="flex flex-col items-end gap-2">
                {timeToClaim === 'Ready to Claim' ? <Button onClick={handleClaim} className="bg-gradient-to-b from-slate-300 to-slate-500 text-slate-900 font-bold">Claim</Button> : <p className="text-3xl">{timeToClaim}</p>}
                <Button onClick={() => setIsUpgradeSheetOpen(true)} className="bg-gradient-to-b from-slate-300 to-slate-500 text-slate-900 font-bold"><ArrowUpCircle className="mr-2 h-4 w-4" /> Upgrade</Button>
              </div>
            </div>
          </div>
        </div>
        <UpgradeSheet isOpen={isUpgradeSheetOpen} onOpenChange={setIsUpgradeSheetOpen} upgrades={upgrades} handleUpgrade={handleUpgrade} />
      </div>
    </AppLayout>
  );
}
