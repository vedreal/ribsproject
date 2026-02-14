'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Gem } from 'lucide-react';
import { AppLayout } from '@/components/lumion/app-layout';
import { LumionIcon } from '@/components/lumion/lumion-icon';
import { UpgradeSheet } from '@/components/lumion/upgrade-sheet';
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

  useEffect(() => {
    // Initialize client-side state
    setClaimTime(Date.now() + TWO_HOURS_IN_MS / 2); // Example: start halfway through
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

    setBalance((prev) => prev + 5);
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
    <AppLayout>
      <div className="text-center space-y-8">
        <div>
          <h1 className="font-headline text-5xl font-bold text-primary">
            {isMounted ? balance.toLocaleString('en-US') : balance.toLocaleString('en-US')}
          </h1>
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            <LumionIcon className="w-5 h-5" /> Your LUMION Balance
          </p>
        </div>

        <div className="flex flex-col items-center space-y-4">
          <button
            onClick={handleTap}
            disabled={tapsLeft <= 0}
            className={cn(
                "relative w-64 h-64 rounded-full bg-primary/20 border-4 border-primary/50 shadow-lg transition-transform duration-100 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                "flex items-center justify-center text-center"
            )}
          >
            <LumionIcon className="w-24 h-24 text-primary" />
             {floatingNumbers.map((num) => (
              <span
                key={num.id}
                className="tap-float-animation absolute text-3xl font-bold text-primary pointer-events-none"
                style={{ left: num.x, top: num.y }}
              >
                +5
              </span>
            ))}
          </button>
          <div className="w-full max-w-xs text-center space-y-1">
            <p className="text-lg font-bold">
              {isMounted ? tapsLeft.toLocaleString('en-US') : '...'} / {DAILY_TAPS.toLocaleString('en-US')}
            </p>
            <Progress value={isMounted ? (tapsLeft / DAILY_TAPS) * 100 : 0} className="h-3" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Hourly Claim</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Upgrades</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 flex flex-col items-center justify-center h-[calc(100%-4rem)]">
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
            </CardContent>
          </Card>
        </div>
      </div>
      <UpgradeSheet
        isOpen={isUpgradeSheetOpen}
        onOpenChange={setIsUpgradeSheetOpen}
      />
    </AppLayout>
  );
}
