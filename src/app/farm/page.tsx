'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Gem } from 'lucide-react';
import { AppLayout } from '@/components/ribs/app-layout';
import { RibsIcon } from '@/components/ribs/ribs-icon';
import { UpgradeSheet } from '@/components/ribs/upgrade-sheet';
import { cn } from '@/lib/utils';

type FloatingNumber = {
  id: number;
  x: number;
  y: number;
};

const TWO_HOURS_IN_MS = 2 * 60 * 60 * 1000;
const DAILY_TAPS = 1000;

export default function FarmPage() {
  const [balance, setBalance] = useState(9800000);
  const [tapsLeft, setTapsLeft] = useState(DAILY_TAPS);
  const [claimTime, setClaimTime] = useState<number | null>(null);
  const [timeToClaim, setTimeToClaim] = useState('');
  const [isUpgradeSheetOpen, setIsUpgradeSheetOpen] = useState(false);
  const [floatingNumbers, setFloatingNumbers] = useState<FloatingNumber[]>([]);
  const [isMounted, setIsMounted] = useState(false);

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
    setClaimTime(Date.now() + TWO_HOURS_IN_MS);
    setTapsLeft(850); // Example
    setIsMounted(true);
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
    setClaimTime(Date.now() + TWO_HOURS_IN_MS);
  };

  return (
    <>
      <AppLayout>
        <div className="relative pt-8">
          <div className="absolute top-0 right-0">
            <div
              className={cn(
                'text-xs font-bold px-3 py-1.5 rounded-full shadow-md',
                getTitleClasses(userTitle)
              )}
            >
              {userTitle}
            </div>
          </div>
          <div className="text-center space-y-8">
            <div>
              <h1 className="font-headline text-5xl font-bold text-primary">
                {isMounted
                  ? balance.toLocaleString('en-US')
                  : balance.toLocaleString('en-US')}
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
                {isMounted && tapsLeft <= 0 ? (
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
                      {isMounted
                        ? tapsLeft.toLocaleString('en-US')
                        : '...'}{' '}
                      / {DAILY_TAPS.toLocaleString('en-US')}
                    </p>
                    <Progress
                      value={isMounted ? (tapsLeft / DAILY_TAPS) * 100 : 0}
                      className="h-3"
                    />
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg bg-card/50 p-6 space-y-4 text-center">
                <h2 className="font-headline text-2xl font-semibold leading-none tracking-tight">Farming Claim</h2>
                <p className="text-3xl font-bold font-mono">
                  {timeToClaim || 'Loading...'}
                </p>
                <Button
                  className="w-full"
                  onClick={handleClaim}
                  disabled={timeToClaim !== 'Ready to Claim'}
                  size="lg"
                >
                  Claim
                </Button>
                <p className="text-sm text-muted-foreground pt-2">
                  Farming: 250 RIBS/2hr
                </p>
              </div>

              <div className="rounded-lg bg-card/50 p-6 flex flex-col items-center justify-center">
                <h2 className="font-headline text-2xl font-semibold leading-none tracking-tight text-center w-full mb-4">Upgrades</h2>
                <div className="space-y-4 flex flex-col items-center justify-center flex-grow w-full">
                  <p className="text-muted-foreground text-center">
                    Boost your farming rate and tap power.
                  </p>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => setIsUpgradeSheetOpen(true)}
                    size="lg"
                  >
                    <Gem className="mr-2 h-4 w-4" />
                    Open Upgrades
                  </Button>
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
