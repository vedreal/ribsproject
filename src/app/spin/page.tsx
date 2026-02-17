'use client';

import { useState } from 'react';
import Image from 'next/image';
import { AppLayout } from '@/components/ribs/app-layout';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { RibsIcon } from '@/components/ribs/ribs-icon';
import { Tv, Ticket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const rewards = [
  '1 TON',
  '5000 RIBS',
  'NFT Legendary',
  'Try Again!',
  '0.2 TON',
  'NFT Rare',
  '500 RIBS',
  'NFT Mytic',
  '300 RIBS',
  'NFT Common',
];

const segmentColors = [
    '#818cf8', '#c084fc', '#f9a8d4', '#fde047', '#a3e635', 
    '#4ade80', '#34d399', '#22d3ee', '#38bdf8', '#60a5fa'
];

const numRewards = rewards.length;
const segmentAngle = 360 / numRewards;
const conicGradient = `conic-gradient(${segmentColors
    .map((color, i) => {
        const startAngle = i * segmentAngle;
        const endAngle = (i + 1) * segmentAngle;
        return `${color} ${startAngle}deg ${endAngle}deg`;
    })
    .join(', ')})`;

export default function SpinPage() {
  const [freeSpins, setFreeSpins] = useState(1);
  const [adSpins, setAdSpins] = useState(2);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [result, setResult] = useState<(typeof rewards)[number] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const spinTheWheel = (isAdSpin: boolean) => {
    if (isSpinning) return;
    setIsSpinning(true);

    if (isAdSpin) {
      setAdSpins((prev) => prev - 1);
    } else {
      setFreeSpins((prev) => prev - 1);
    }

    const totalRewards = rewards.length;
    const randomRewardIndex = Math.floor(Math.random() * totalRewards);
    const selectedReward = rewards[randomRewardIndex];

    const spins = 5;
    const fullSpinsRotation = 360 * spins;
    const targetSegmentMiddleAngle = (randomRewardIndex * segmentAngle) + (segmentAngle / 2);
    
    // The required rotation to bring that middle angle to the top (270deg or -90deg position)
    const alignmentRotation = 270 - targetSegmentMiddleAngle;
    
    // Get the wheel's current position within a single 360-degree circle
    const currentAngle = wheelRotation % 360;

    // Calculate the total rotation to add for this spin, accounting for the current position
    const rotationToAdd = fullSpinsRotation + alignmentRotation - currentAngle;

    setWheelRotation(wheelRotation + rotationToAdd);

    setTimeout(() => {
      setResult(selectedReward);
      setIsModalOpen(true);
    }, 5000); // 5s animation duration
  };

  const handleSpin = (isAdSpin: boolean) => {
    if (isSpinning) return;

    if (isAdSpin) {
      if (adSpins <= 0) {
        toast({ title: 'No ad spins left for today!' });
        return;
      }
      toast({
        title: 'Watching Ad...',
        description: 'The wheel will spin shortly.',
      });
      setTimeout(() => spinTheWheel(true), 2000);
    } else {
      if (freeSpins <= 0) {
        toast({
          title: 'No free spins left!',
          description: 'Watch an ad for more spins.',
        });
        return;
      }
      spinTheWheel(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setResult(null);
    setIsSpinning(false);
  };

  const getRewardComponent = () => {
    if (!result) return null;

    if (result.includes('TON')) {
        return (
            <div className="flex items-center gap-2 text-4xl font-bold text-cyan-400">
                <Image
                  src="https://gold-defensive-cattle-30.mypinata.cloud/ipfs/bafkreib6wlrvvorkcbkma43liqxrm4dv7hgad4jbqlcjzaa6rynileb7c4"
                  alt="TON coin"
                  width={40}
                  height={40}
                />
                <span>{result}</span>
            </div>
        );
    }
    if (result.startsWith('NFT')) {
        return <div className="text-4xl font-bold text-yellow-400">{result}</div>;
    }
    if (result === 'Try Again!') {
        return <div className="text-4xl font-bold text-muted-foreground">{result}</div>;
    }
    const amount = result.split(' ')[0];
    return (
        <div className="flex items-center gap-2 text-4xl font-bold text-primary">
            <RibsIcon className="w-10 h-10" />
            {amount}
        </div>
    )
  }

  return (
    <>
    <AppLayout>
      <div className="space-y-8 text-center">
        <header>
          <h1 className="text-4xl font-headline font-bold">Spin to Win</h1>
          <p className="text-muted-foreground">Test your luck and win big!</p>
        </header>

        <div className="flex flex-col items-center gap-8">
          <div className="relative w-80 h-80 flex items-center justify-center">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
                <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-primary drop-shadow-lg"></div>
            </div>
            <div
              className="w-full h-full rounded-full border-8 border-primary/20 shadow-inner relative"
              style={{
                transition: 'transform 5s cubic-bezier(0.1, 0, 0.2, 1)',
                transform: `rotate(${wheelRotation}deg)`,
              }}
            >
              {/* Conic background */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: conicGradient,
                }}
              />
              
              {/* Reward text */}
              {rewards.map((reward, i) => {
                  const angle = 360 / rewards.length;
                  const textRotation = i * angle + angle / 2;
                  return (
                      <div
                          key={i}
                          className="absolute top-0 left-0 w-full h-full flex justify-center"
                          style={{ transform: `rotate(${textRotation}deg)` }}
                      >
                          <span
                              className="font-sans pt-4 text-xs font-bold text-black shadow-black/50 [text-shadow:_0_1px_2px_var(--tw-shadow-color)]"
                              style={{ transform: 'rotate(-90deg)'}}
                          >
                              {reward}
                          </span>
                      </div>
                  );
              })}

              {/* Center circle */}
              <div className="absolute inset-12 rounded-full bg-card flex items-center justify-center">
                <RibsIcon className="w-16 h-16" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 w-full max-w-sm">
            <Button size="lg" onClick={() => handleSpin(false)} disabled={isSpinning || freeSpins <= 0}>
              <Ticket className="mr-2" />
              Use Free Spin ({freeSpins} left)
            </Button>
            <Button size="lg" variant="secondary" onClick={() => handleSpin(true)} disabled={isSpinning || adSpins <= 0}>
                <Tv className="mr-2" />
              Watch Ad for Spin ({adSpins} left)
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>

    <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle className="text-center text-2xl font-headline">Congratulations!</AlertDialogTitle>
                <AlertDialogDescription className="text-center pt-4">
                    You won:
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex justify-center py-4">
                {getRewardComponent()}
            </div>
            <AlertDialogFooter>
                <Button onClick={closeModal} className="w-full">Awesome!</Button>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
