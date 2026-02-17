'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Gem, CalendarCheck, Disc, ArrowUpCircle } from 'lucide-react';
import { AppLayout } from '@/components/ribs/app-layout';
import { RibsIcon } from '@/components/ribs/ribs-icon';
import { UpgradeSheet } from '@/components/ribs/upgrade-sheet';
import { cn } from '@/lib/utils';
import { upgrades } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

type FloatingNumber = {
  id: number;
  x: number;
  y: number;
};

const CLAIM_DURATION_MS = 5 * 1000; // Temporarily set to 5 seconds for testing
const DAILY_TAPS = 1000;

export default function FarmPage() {
  const [balance, setBalance] = useState(9800000);
  const [tapsLeft, setTapsLeft] = useState(850);
  const [claimTime, setClaimTime] = useState<number | null>(null);
  const [timeToClaim, setTimeToClaim] = useState('');
  const [isUpgradeSheetOpen, setIsUpgradeSheetOpen] = useState(false);
  const [floatingNumbers, setFloatingNumbers] = useState<FloatingNumber[]>([]);
  const [checkInCount, setCheckInCount] = useState(1);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const { toast } = useToast();

  const farmingUpgrade = upgrades.find(u => u.id === 'farming-rate');
  const farmingBenefit = farmingUpgrade ? farmingUpgrade.benefits[farmingUpgrade.level - 1] : '...';


  const getUserTitle = (balance: number): string => {
    if (balance >= 300000) return 'Legend';
    if (balance >= 100000) return 'Grandmaster';
    if (balance >= 50000) return 'Master';
    if (balance >= 25000) return 'Elite';
    if (balance >= 10000) return 'Skilled';
    return 'Beginner';
  };

  const userTitle = getUserTitle(balance);

  const getTitleClasses = (title: string): string => {
    switch (title) {
      case 'Legend':
        return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black';
      case 'Grandmaster':
        return 'bg-gradient-to-r from-orange-500 to-red-600 text-white';
      case 'Master':
        return 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white';
      case 'Elite':
        return 'bg-gradient-to-r from-green-400 to-teal-500 text-white';
      case 'Skilled':
        return 'bg-gradient-to-r from-blue-400 to-cyan-500 text-white';
      default: // Beginner
        return 'bg-secondary text-secondary-foreground';
    }
  };

  useEffect(() => {
    // Initialize client-side state
    setClaimTime(Date.now() + CLAIM_DURATION_MS);
  }, []);

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

      setTimeToClaim(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
          2,
          '0'
        )}:${String(seconds).padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [claimTime]);

  const handleCheckIn = () => {
    if (hasCheckedInToday) return;

    const rewardAmount = 500 * checkInCount;
    setBalance(prev => prev + rewardAmount);
    toast({
        title: "Check-in Successful!",
        description: `Day ${checkInCount} check-in complete. You earned ${rewardAmount} RIBS!`,
    });

    setHasCheckedInToday(true);
    setCheckInCount(prev => prev + 1);
  };

  const handleTap = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (tapsLeft <= 0) return;

    setBalance((prev) => prev + 1);
    setTapsLeft((prev) => prev - 1);

    const rect = e.currentTarget.getBoundingClientRect();
    const newFloatingNumber: FloatingNumber = {
      id: Date.now(),
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    setFloatingNumbers((prev) => [...prev, newFloatingNumber]);
    setTimeout(() => {
      setFloatingNumbers((current) =>
        current.filter((n) => n.id !== newFloatingNumber.id)
      );
    }, 1500);
  };

  const handleClaim = () => {
    setBalance((prev) => prev + 10000); // Example claim amount
    setClaimTime(Date.now() + CLAIM_DURATION_MS);
  };

  return (
    <>
      <AppLayout>
        <div className="relative">
           <div className="absolute top-4 left-0 flex flex-col items-start gap-2">
            <Button
              onClick={handleCheckIn}
              disabled={hasCheckedInToday}
              className="bg-gradient-to-b from-slate-300 to-slate-500 text-slate-900 font-bold text-xs px-3 py-1.5 h-auto"
            >
              <CalendarCheck className="mr-2 h-4 w-4" />
              Check-in: {checkInCount}x
            </Button>
            <Link href="/spin" passHref>
                <Button className="bg-gradient-to-b from-slate-300 to-slate-500 text-slate-900 font-bold text-xs px-3 py-1.5 h-auto">
                    <Disc className="mr-2 h-4 w-4" />
                    Free Spin
                </Button>
            </Link>
          </div>
          <div className="absolute top-4 right-0">
            <div
              className={cn(
                'text-xs font-bold px-3 py-1.5 rounded-full shadow-md',
                getTitleClasses(userTitle)
              )}
            >
              {userTitle}
            </div>
          </div>
          <div className="text-center space-y-8 pt-16">
            <div>
              <h1 className="font-headline text-5xl font-bold text-primary">
                {balance.toLocaleString('en-US')}
              </h1>
              <p className="text-muted-foreground flex items-center justify-center gap-2">
                <RibsIcon className="w-5 h-5" /> Your RIBS Balance
              </p>
            </div>

            <div className="flex flex-col items-center space-y-4">
              <button
                onClick={handleTap}
                disabled={tapsLeft <= 0}
                className={cn(
                  'relative w-64 h-64 rounded-full bg-primary/20 border-4 border-primary/50 shadow-lg transition-transform duration-100 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
                  'flex items-center justify-center text-center'
                )}
              >
                <RibsIcon className="w-24 h-24 text-primary" />
                {floatingNumbers.map((num) => (
                  <span
                    key={num.id}
                    className="tap-float-animation absolute text-3xl font-bold text-primary pointer-events-none"
                    style={{ left: num.x, top: num.y }}
                  >
                    +1
                  </span>
                ))}
              </button>
              <div
                className="w-full max-w-xs text-center space-y-1"
                style={{ minHeight: '44px' }}
              >
                {tapsLeft <= 0 ? (
                  <div className="flex flex-col justify-center h-full pt-1">
                    <p className="font-bold text-primary">
                      Daily tap limit reached
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Come back tomorrow!
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-lg font-bold">
                      {tapsLeft.toLocaleString('en-US')}
                      / {DAILY_TAPS.toLocaleString('en-US')}
                    </p>
                    <Progress
                      value={(tapsLeft / DAILY_TAPS) * 100}
                      className="h-3"
                    />
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="rounded-xl bg-gradient-to-br from-secondary to-card border border-border p-6 space-y-3">
                <div className="flex justify-between items-center">
                  <div className='flex flex-col'>
                    <h2 className="font-headline text-2xl font-semibold leading-none tracking-tight">Faucet Claim :</h2>
                    <p className="text-sm text-muted-foreground pt-1">
                      Faucet Rate : {farmingBenefit}
                    </p>
                  </div>
                  <div className='flex flex-col items-end gap-2'>
                    {timeToClaim !== 'Ready to Claim' ? (
                      <p className="text-3xl font-bold">
                        {timeToClaim || '...'}
                      </p>
                    ) : (
                      <Button
                        onClick={handleClaim}
                        className="bg-gradient-to-b from-slate-300 to-slate-500 text-slate-900 font-bold px-4 py-1.5 h-auto text-sm"
                      >
                        Claim
                      </Button>
                    )}
                    <Button
                        onClick={() => setIsUpgradeSheetOpen(true)}
                        className="bg-gradient-to-b from-slate-300 to-slate-500 text-slate-900 font-bold px-4 py-1.5 h-auto text-sm"
                    >
                        <ArrowUpCircle className="mr-2 h-4 w-4" />
                        Upgrade
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <UpgradeSheet
            isOpen={isUpgradeSheetOpen}
            onOpenChange={setIsUpgradeSheetOpen}
          />
        </div>
      </AppLayout>
    </>
  );
}
