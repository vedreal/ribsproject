'use client';

import { useState, useEffect } from 'react';
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
import { useTelegram } from '@/components/telegram-provider';
import { saveSpinReward, getUserProfile } from '@/lib/data';
import { supabase } from '@/lib/supabase';

const rewards = [
  '1 TON',
  '5000 RIBS',
  'Epic Card',
  'Try Again!',
  '0.2 TON',
  'Rare Card',
  '500 RIBS',
  'Mythic Card',
  '0.2 TON',
  '1 TON',
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
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user: tgUser, isLoading } = useTelegram();

  const [tonBalance, setTonBalance] = useState(0.0);
  const [rareCards, setRareCards] = useState(0);
  const [epicCards, setEpicCards] = useState(0);
  const [mythicCards, setMythicCards] = useState(0);
  const [ribsBalance, setRibsBalance] = useState(0);

  // ── Load existing rewards from Supabase ─────────────────
  useEffect(() => {
    if (!tgUser?.id || isLoading) return;

    const loadUserData = async () => {
      const profile = await getUserProfile(tgUser.id);
      if (profile) {
        setTonBalance(profile.ton_balance ?? 0);
        setRareCards(profile.rare_cards ?? 0);
        setEpicCards(profile.epic_cards ?? 0);
        setMythicCards(profile.mythic_cards ?? 0);
        setRibsBalance(profile.ribs ?? 0);
      }
    };

    loadUserData();
  }, [tgUser?.id, isLoading]);

  const spinTheWheel = (isAdSpin: boolean) => {
    if (isSpinning) return;
    setIsSpinning(true);

    if (isAdSpin) {
      setAdSpins((prev) => prev - 1);
    } else {
      setFreeSpins((prev) => prev - 1);
    }

    const randomRewardIndex = Math.floor(Math.random() * rewards.length);
    const selectedReward = rewards[randomRewardIndex];

    const spins = 5;
    const baseRotation = spins * 360;
    const targetSegmentStartAngle = randomRewardIndex * segmentAngle;
    const targetSegmentMiddleAngle = targetSegmentStartAngle + segmentAngle / 2;
    const alignmentRotation = 360 - targetSegmentMiddleAngle;
    const newRotation = baseRotation + alignmentRotation;

    setWheelRotation(prev => prev + newRotation);

    setTimeout(() => {
      setResult(selectedReward);
      setIsModalOpen(true);
      // isSpinning di-reset setelah user close modal
    }, 5000);
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

  const closeModal = async () => {
    if (!result || isSaving) return;

    setIsSaving(true);

    // Simpan reward ke Supabase jika user login
    if (tgUser?.id) {
      try {
        await saveSpinReward(tgUser.id, result);

        // Update local state sesuai reward
        if (result.includes('TON')) {
          const amount = parseFloat(result.split(' ')[0]);
          setTonBalance(prev => prev + amount);
          toast({
            title: '🎉 Reward Saved!',
            description: `+${amount} TON added to your balance.`
          });
        } else if (result === 'Rare Card') {
          setRareCards(prev => prev + 1);
          toast({
            title: '🎉 Card Acquired!',
            description: 'A new Rare Card added to your collection.'
          });
        } else if (result === 'Epic Card') {
          setEpicCards(prev => prev + 1);
          toast({
            title: '🎉 Card Acquired!',
            description: 'A new Epic Card added to your collection.'
          });
        } else if (result === 'Mythic Card') {
          setMythicCards(prev => prev + 1);
          toast({
            title: '🎉 Card Acquired!',
            description: 'A new Mythic Card added to your collection.'
          });
        } else if (result.includes('RIBS')) {
          const amount = parseInt(result.split(' ')[0]);
          setRibsBalance(prev => prev + amount);
          toast({
            title: '🎉 Reward Saved!',
            description: `+${amount} RIBS added to your balance.`
          });
        } else if (result === 'Try Again!') {
          toast({ title: 'Better luck next time!' });
        }
      } catch (err) {
        console.error('Failed to save spin reward:', err);
        toast({ title: 'Gagal menyimpan reward', variant: 'destructive' });
      }
    }

    setIsModalOpen(false);
    setResult(null);
    setIsSpinning(false);
    setIsSaving(false);
  };

  const getRewardComponent = () => {
    if (!result) return null;

    if (result === 'Mythic Card') {
      return (
        <div className="flex flex-col items-center gap-4">
          <Image
            src="https://gold-defensive-cattle-30.mypinata.cloud/ipfs/bafybeidqm2w7kvkcxgowstbptive5vjyuwnabl5rcammfkkasjioabrxle"
            alt="Mythic Card"
            width={120}
            height={168}
            className="rounded-lg shadow-lg"
          />
          <div className="text-4xl font-bold text-yellow-400">{result}</div>
        </div>
      );
    }
    if (result === 'Rare Card') {
      return (
        <div className="flex flex-col items-center gap-4">
          <Image
            src="https://gold-defensive-cattle-30.mypinata.cloud/ipfs/bafybeigzzuj4h2dubddoshcjm2jzbtdbvdeoyghtawnkun4mzwjz22e3sm"
            alt="Rare Card"
            width={120}
            height={168}
            className="rounded-lg shadow-lg"
          />
          <div className="text-4xl font-bold text-yellow-400">{result}</div>
        </div>
      );
    }
    if (result === 'Epic Card') {
      return (
        <div className="flex flex-col items-center gap-4">
          <Image
            src="https://gold-defensive-cattle-30.mypinata.cloud/ipfs/bafybeidw7yyryxsvkrnvt3iq265sgzlxqgdqyjof2f37boirniov3c7ene"
            alt="Epic Card"
            width={120}
            height={168}
            className="rounded-lg shadow-lg"
          />
          <div className="text-4xl font-bold text-yellow-400">{result}</div>
        </div>
      );
    }
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
    if (result === 'Try Again!') {
      return <div className="text-4xl font-bold text-muted-foreground">{result}</div>;
    }
    const amount = result.split(' ')[0];
    return (
      <div className="flex items-center gap-2 text-4xl font-bold text-primary">
        <RibsIcon className="w-10 h-10" />
        {amount}
      </div>
    );
  };

  return (
    <>
      <AppLayout>
        <div className="space-y-8 text-center">
          <header>
            <h1 className="text-4xl font-headline font-bold">Spin to Win</h1>
            <p className="text-muted-foreground">Test your luck and win big!</p>
          </header>

          <div className="flex flex-col items-center gap-8 w-full max-w-full overflow-hidden">
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center shrink-0">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
                <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-primary drop-shadow-lg"></div>
              </div>
              <div
                className="w-full h-full rounded-full border-8 border-primary/20 shadow-inner relative"
                style={{
                  transition: isSpinning ? 'transform 5s cubic-bezier(0.1, 0, 0.2, 1)' : 'none',
                  transform: `rotate(${wheelRotation}deg)`,
                }}
              >
                <div
                  className="absolute inset-0 rounded-full"
                  style={{ background: conicGradient }}
                />
                {rewards.map((reward, i) => {
                  const angle = 360 / rewards.length;
                  const textAngle = i * angle + angle / 2;
                  return (
                    <div
                      key={i}
                      className="absolute top-0 left-0 w-full h-full flex justify-center"
                      style={{ transform: `rotate(${textAngle}deg)` }}
                    >
                      <span
                        className="font-sans pt-4 text-xs font-bold text-black shadow-black/50 [text-shadow:_0_1px_2px_var(--tw-shadow-color)]"
                        style={{ transform: 'rotate(-90deg)' }}
                      >
                        {reward}
                      </span>
                    </div>
                  );
                })}
                <div className="absolute inset-12 rounded-full bg-card flex items-center justify-center">
                  <RibsIcon className="w-16 h-16" />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 w-full max-w-sm">
              <Button
                size="lg"
                onClick={() => handleSpin(false)}
                disabled={isSpinning || freeSpins <= 0}
                className="bg-gradient-to-b from-slate-300 to-slate-500 text-slate-900 font-bold hover:brightness-95"
              >
                <Ticket className="mr-2" />
                Use Free Spin ({freeSpins} left)
              </Button>
              <Button
                size="lg"
                onClick={() => handleSpin(true)}
                disabled={isSpinning || adSpins <= 0}
                className="bg-gradient-to-b from-slate-300 to-slate-500 text-slate-900 font-bold hover:brightness-95"
              >
                <Tv className="mr-2" />
                Watch Ad for Spin ({adSpins} left)
              </Button>
            </div>

            <div className="w-full max-w-sm">
              <div className="rounded-xl bg-gradient-to-br from-secondary to-card border border-border p-6 space-y-4 text-left">
                <h2 className="font-headline text-2xl font-semibold leading-none tracking-tight text-center mb-2">My Rewards</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Image
                        src="https://gold-defensive-cattle-30.mypinata.cloud/ipfs/bafkreib6wlrvvorkcbkma43liqxrm4dv7hgad4jbqlcjzaa6rynileb7c4"
                        alt="TON coin"
                        width={24}
                        height={24}
                      />
                      <span className="font-medium text-muted-foreground">TON Balance</span>
                    </div>
                    <span className="font-bold text-lg">{tonBalance.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <RibsIcon className="w-6 h-6 text-primary" />
                      <span className="font-medium text-muted-foreground">RIBS Balance</span>
                    </div>
                    <span className="font-bold text-lg">{ribsBalance.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Image
                        src="https://gold-defensive-cattle-30.mypinata.cloud/ipfs/bafybeigzzuj4h2dubddoshcjm2jzbtdbvdeoyghtawnkun4mzwjz22e3sm"
                        alt="Card icon"
                        width={24}
                        height={24}
                      />
                      <span className="font-medium text-muted-foreground">Rare Cards</span>
                    </div>
                    <span className="font-bold text-lg">{rareCards}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Image
                        src="https://gold-defensive-cattle-30.mypinata.cloud/ipfs/bafybeidw7yyryxsvkrnvt3iq265sgzlxqgdqyjof2f37boirniov3c7ene"
                        alt="Card icon"
                        width={24}
                        height={24}
                      />
                      <span className="font-medium text-muted-foreground">Epic Cards</span>
                    </div>
                    <span className="font-bold text-lg">{epicCards}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Image
                        src="https://gold-defensive-cattle-30.mypinata.cloud/ipfs/bafybeidqm2w7kvkcxgowstbptive5vjyuwnabl5rcammfkkasjioabrxle"
                        alt="Card icon"
                        width={24}
                        height={24}
                      />
                      <span className="font-medium text-muted-foreground">Mythic Cards</span>
                    </div>
                    <span className="font-bold text-lg">{mythicCards}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full max-w-sm text-center text-xs text-muted-foreground px-4">
              <p>TON withdrawals will be enabled upon the conclusion of the airdrop</p>
              <p>Accumulated cards can be redeemed for tokens and NFTs at the appropriate time</p>
            </div>
          </div>
        </div>
      </AppLayout>

      {/* Modal reward - menggunakan controlled state yang benar */}
      <AlertDialog open={isModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-2xl font-headline">
              Congratulations! 🎉
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center pt-4">
              You won:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-center py-4">
            {getRewardComponent()}
          </div>
          <AlertDialogFooter>
            <Button
              onClick={closeModal}
              disabled={isSaving}
              className="w-full"
            >
              {isSaving ? 'Saving...' : 'Awesome! 🙌'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
