'use client';

import { useState, useEffect, useRef } from 'react';
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

// ── Reward list & wheel config ───────────────────────────────
const rewards = [
  '1 TON',       // index 0
  '5000 RIBS',   // index 1
  'Epic Card',   // index 2
  'Try Again!',  // index 3
  '0.2 TON',     // index 4
  'Rare Card',   // index 5
  '500 RIBS',    // index 6
  'Mythic Card', // index 7
  '0.2 TON',     // index 8
  '1 TON',       // index 9
] as const;

type Reward = typeof rewards[number];

const NUM_SEGMENTS = rewards.length;          // 10
const SEGMENT_DEG = 360 / NUM_SEGMENTS;       // 36 deg per segment

const segmentColors = [
  '#818cf8', '#c084fc', '#f9a8d4', '#fde047', '#a3e635',
  '#4ade80', '#34d399', '#22d3ee', '#38bdf8', '#60a5fa',
];

const conicGradient = `conic-gradient(${segmentColors
  .map((color, i) => {
    const start = i * SEGMENT_DEG;
    const end = (i + 1) * SEGMENT_DEG;
    return `${color} ${start}deg ${end}deg`;
  })
  .join(', ')})`;

// ── Hitung rotation agar segment[index] tepat di atas ────────
// Conic gradient: 0deg = kanan, clockwise
// Penunjuk: tepat di atas = 270deg dalam koordinat conic
// Tengah segment[i] = i * 36 + 18 deg
// Supaya tengah segment[i] ada di 270deg setelah rotate:
//   rotate = (270 - midAngle + 360) % 360
function getAlignmentRotation(index: number): number {
  const midAngle = index * SEGMENT_DEG + SEGMENT_DEG / 2;
  return ((270 - midAngle) % 360 + 360) % 360;
}

// ── Default spin counts ──────────────────────────────────────
const DEFAULT_FREE_SPINS = 1;
const DEFAULT_AD_SPINS = 2;

export default function SpinPage() {
  const [freeSpins, setFreeSpins] = useState(DEFAULT_FREE_SPINS);
  const [adSpins, setAdSpins] = useState(DEFAULT_AD_SPINS);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [result, setResult] = useState<Reward | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const { toast } = useToast();
  const { user: tgUser, isLoading } = useTelegram();

  // Rewards dari Supabase
  const [tonBalance, setTonBalance] = useState(0.0);
  const [rareCards, setRareCards] = useState(0);
  const [epicCards, setEpicCards] = useState(0);
  const [mythicCards, setMythicCards] = useState(0);
  const [ribsBalance, setRibsBalance] = useState(0);

  // Ref untuk akses terkini di callbacks
  const freeSpinsRef = useRef(DEFAULT_FREE_SPINS);
  const adSpinsRef = useRef(DEFAULT_AD_SPINS);
  const userIdRef = useRef<number | null>(null);

  useEffect(() => {
    userIdRef.current = tgUser?.id ?? null;
  }, [tgUser?.id]);

  // ── Load data dari Supabase ───────────────────────────────
  useEffect(() => {
    if (!tgUser?.id || isLoading) return;

    const loadData = async () => {
      try {
        const profile = await getUserProfile(tgUser.id);
        if (!profile) {
          setIsLoaded(true);
          return;
        }

        // Rewards
        setTonBalance(profile.ton_balance ?? 0);
        setRareCards(profile.rare_cards ?? 0);
        setEpicCards(profile.epic_cards ?? 0);
        setMythicCards(profile.mythic_cards ?? 0);
        setRibsBalance(profile.ribs ?? 0);

        // Spin counts — cek reset harian
        const todayDate = new Date().toISOString().split('T')[0];
        const savedResetDate = profile.spins_reset_date
          ? new Date(profile.spins_reset_date).toISOString().split('T')[0]
          : null;

        if (!savedResetDate || savedResetDate !== todayDate) {
          // Hari baru → reset spin ke penuh
          const resetData = {
            free_spins_left: DEFAULT_FREE_SPINS,
            ad_spins_left: DEFAULT_AD_SPINS,
            spins_reset_date: todayDate,
          };
          setFreeSpins(DEFAULT_FREE_SPINS);
          setAdSpins(DEFAULT_AD_SPINS);
          freeSpinsRef.current = DEFAULT_FREE_SPINS;
          adSpinsRef.current = DEFAULT_AD_SPINS;

          // Fire and forget
          supabase
            .from('users')
            .update(resetData)
            .eq('id', tgUser.id)
            .then(({ error }) => {
              if (error) console.error('Reset spins error:', error);
            });
        } else {
          // Hari sama → restore dari DB
          const fs = profile.free_spins_left ?? DEFAULT_FREE_SPINS;
          const as = profile.ad_spins_left ?? DEFAULT_AD_SPINS;
          setFreeSpins(fs);
          setAdSpins(as);
          freeSpinsRef.current = fs;
          adSpinsRef.current = as;
        }

        setIsLoaded(true);
      } catch (e) {
        console.error('SpinPage loadData error:', e);
        setIsLoaded(true);
      }
    };

    loadData();
  }, [tgUser?.id, isLoading]);

  // ── Save spin counts ke Supabase ─────────────────────────
  const saveSpinCounts = async (uid: number, fs: number, as: number) => {
    try {
      await supabase
        .from('users')
        .update({ free_spins_left: fs, ad_spins_left: as })
        .eq('id', uid);
    } catch (e) {
      console.error('saveSpinCounts error:', e);
    }
  };

  // ── Core spin logic ───────────────────────────────────────
  const spinTheWheel = (isAdSpin: boolean) => {
    if (isSpinning) return;
    setIsSpinning(true);

    const uid = userIdRef.current;

    // Kurangi jatah spin
    let newFs = freeSpinsRef.current;
    let newAs = adSpinsRef.current;

    if (isAdSpin) {
      newAs = Math.max(0, newAs - 1);
      setAdSpins(newAs);
      adSpinsRef.current = newAs;
    } else {
      newFs = Math.max(0, newFs - 1);
      setFreeSpins(newFs);
      freeSpinsRef.current = newFs;
    }

    // Simpan ke DB
    if (uid) saveSpinCounts(uid, newFs, newAs);

    // Pilih reward secara random
    const randomIndex = Math.floor(Math.random() * NUM_SEGMENTS);
    const selectedReward = rewards[randomIndex];

    // Hitung rotation:
    // 5 putaran penuh + alignment agar segment[randomIndex] tepat di atas
    const fullSpins = 5 * 360;
    const alignmentRot = getAlignmentRotation(randomIndex);
    const addedRotation = fullSpins + alignmentRot;

    // Tambahkan ke rotasi akumulatif (agar animasi selalu maju, tidak balik)
    setWheelRotation(prev => prev + addedRotation);

    // Tampilkan hasil setelah animasi selesai (5 detik)
    setTimeout(() => {
      setResult(selectedReward);
      setIsModalOpen(true);
    }, 5000);
  };

  // ── Trigger spin ─────────────────────────────────────────
  const handleSpin = (isAdSpin: boolean) => {
    if (isSpinning || !isLoaded) return;

    if (isAdSpin) {
      if (adSpins <= 0) {
        toast({ title: 'No ad spins left!', description: 'Come back tomorrow.' });
        return;
      }
      toast({ title: 'Watching Ad...', description: 'The wheel will spin shortly.' });
      setTimeout(() => spinTheWheel(true), 2000);
    } else {
      if (freeSpins <= 0) {
        toast({ title: 'No free spins left!', description: 'Watch an ad or come back tomorrow.' });
        return;
      }
      spinTheWheel(false);
    }
  };

  // ── Close modal & save reward ─────────────────────────────
  const closeModal = async () => {
    if (!result || isSaving) return;
    setIsSaving(true);

    const uid = tgUser?.id;
    if (uid && result !== 'Try Again!') {
      try {
        await saveSpinReward(uid, result);

        // Update local state
        if (result.includes('TON')) {
          const amt = parseFloat(result.split(' ')[0]);
          setTonBalance(prev => prev + amt);
          toast({ title: '🎉 TON Added!', description: `+${amt} TON saved to your balance.` });
        } else if (result.includes('RIBS')) {
          const amt = parseInt(result.split(' ')[0]);
          setRibsBalance(prev => prev + amt);
          toast({ title: '🎉 RIBS Added!', description: `+${amt} RIBS saved.` });
        } else if (result === 'Rare Card') {
          setRareCards(prev => prev + 1);
          toast({ title: '🎉 Rare Card!', description: 'Added to your collection.' });
        } else if (result === 'Epic Card') {
          setEpicCards(prev => prev + 1);
          toast({ title: '🎉 Epic Card!', description: 'Added to your collection.' });
        } else if (result === 'Mythic Card') {
          setMythicCards(prev => prev + 1);
          toast({ title: '🎉 Mythic Card!', description: 'Added to your collection.' });
        }
      } catch {
        toast({ title: 'Gagal menyimpan reward', variant: 'destructive' });
      }
    } else if (result === 'Try Again!') {
      toast({ title: 'Better luck next time! 🍀' });
    }

    setIsModalOpen(false);
    setResult(null);
    setIsSpinning(false);
    setIsSaving(false);
  };

  // ── Reward display ────────────────────────────────────────
  const getRewardComponent = () => {
    if (!result) return null;

    if (result === 'Mythic Card') return (
      <div className="flex flex-col items-center gap-4">
        <Image src="https://gold-defensive-cattle-30.mypinata.cloud/ipfs/bafybeidqm2w7kvkcxgowstbptive5vjyuwnabl5rcammfkkasjioabrxle" alt="Mythic Card" width={120} height={168} className="rounded-lg shadow-lg" />
        <div className="text-4xl font-bold text-yellow-400">{result}</div>
      </div>
    );
    if (result === 'Rare Card') return (
      <div className="flex flex-col items-center gap-4">
        <Image src="https://gold-defensive-cattle-30.mypinata.cloud/ipfs/bafybeigzzuj4h2dubddoshcjm2jzbtdbvdeoyghtawnkun4mzwjz22e3sm" alt="Rare Card" width={120} height={168} className="rounded-lg shadow-lg" />
        <div className="text-4xl font-bold text-blue-400">{result}</div>
      </div>
    );
    if (result === 'Epic Card') return (
      <div className="flex flex-col items-center gap-4">
        <Image src="https://gold-defensive-cattle-30.mypinata.cloud/ipfs/bafybeidw7yyryxsvkrnvt3iq265sgzlxqgdqyjof2f37boirniov3c7ene" alt="Epic Card" width={120} height={168} className="rounded-lg shadow-lg" />
        <div className="text-4xl font-bold text-purple-400">{result}</div>
      </div>
    );
    if (result.includes('TON')) return (
      <div className="flex items-center gap-3 text-4xl font-bold text-cyan-400">
        <Image src="https://gold-defensive-cattle-30.mypinata.cloud/ipfs/bafkreib6wlrvvorkcbkma43liqxrm4dv7hgad4jbqlcjzaa6rynileb7c4" alt="TON" width={48} height={48} />
        <span>{result}</span>
      </div>
    );
    if (result === 'Try Again!') return (
      <div className="text-4xl font-bold text-muted-foreground">🍀 {result}</div>
    );
    // RIBS
    const amount = result.split(' ')[0];
    return (
      <div className="flex items-center gap-3 text-4xl font-bold text-primary">
        <RibsIcon className="w-12 h-12" />
        <span>{amount} RIBS</span>
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <>
      <AppLayout>
        <div className="space-y-8 text-center">
          <header>
            <h1 className="text-4xl font-headline font-bold">Spin to Win</h1>
            <p className="text-muted-foreground">Test your luck and win big!</p>
          </header>

          <div className="flex flex-col items-center gap-8 w-full max-w-full overflow-hidden">

            {/* ── Wheel ── */}
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center shrink-0">
              {/* Penunjuk di atas */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 drop-shadow-lg">
                <div className="w-0 h-0
                  border-l-[14px] border-l-transparent
                  border-r-[14px] border-r-transparent
                  border-t-[24px] border-t-primary" />
              </div>

              {/* Wheel disc */}
              <div
                className="w-full h-full rounded-full border-8 border-primary/30 shadow-2xl relative"
                style={{
                  transition: isSpinning
                    ? 'transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99)'
                    : 'none',
                  transform: `rotate(${wheelRotation}deg)`,
                }}
              >
                {/* Conic gradient background */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{ background: conicGradient }}
                />

                {/* Teks reward di setiap segment */}
                {rewards.map((reward, i) => {
                  // Teks di tengah tiap segment
                  // Rotasi teks: agar dapat dibaca dari luar ke dalam (tegak lurus dari tepi)
                  // Tengah segment ada di sudut: i*36 + 18 dari kanan (conic coords)
                  // Dalam CSS rotate: 0 = atas, clockwise
                  // Kita perlu rotate element ke arah tengah segment
                  // Conic 0deg = kanan, CSS rotate 0deg = atas
                  // Konversi: cssAngle = conicAngle - 90
                  const conicMid = i * SEGMENT_DEG + SEGMENT_DEG / 2;
                  const cssAngle = conicMid - 90; // rotate container ke arah segment

                  return (
                    <div
                      key={i}
                      className="absolute inset-0 flex items-start justify-center"
                      style={{ transform: `rotate(${cssAngle}deg)` }}
                    >
                      <span
                        className="mt-3 text-[10px] font-extrabold text-slate-900 leading-tight max-w-[60px] text-center"
                        style={{
                          textShadow: '0 1px 2px rgba(255,255,255,0.5)',
                          // Teks tidak ikut rotate (tegak)
                          writingMode: 'vertical-rl',
                          transform: 'rotate(180deg)',
                        }}
                      >
                        {reward}
                      </span>
                    </div>
                  );
                })}

                {/* Center circle */}
                <div className="absolute inset-10 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center shadow-inner">
                  <RibsIcon className="w-14 h-14" />
                </div>
              </div>
            </div>

            {/* ── Spin buttons ── */}
            <div className="flex flex-col gap-4 w-full max-w-sm">
              <Button
                size="lg"
                onClick={() => handleSpin(false)}
                disabled={isSpinning || freeSpins <= 0 || !isLoaded}
                className="bg-gradient-to-b from-slate-300 to-slate-500 text-slate-900 font-bold hover:brightness-95 disabled:opacity-50"
              >
                <Ticket className="mr-2" />
                {isLoaded
                  ? `Use Free Spin (${freeSpins} left)`
                  : 'Loading...'}
              </Button>
              <Button
                size="lg"
                onClick={() => handleSpin(true)}
                disabled={isSpinning || adSpins <= 0 || !isLoaded}
                className="bg-gradient-to-b from-slate-300 to-slate-500 text-slate-900 font-bold hover:brightness-95 disabled:opacity-50"
              >
                <Tv className="mr-2" />
                {isLoaded
                  ? `Watch Ad for Spin (${adSpins} left)`
                  : 'Loading...'}
              </Button>
              {isLoaded && freeSpins <= 0 && adSpins <= 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  ⏰ Spin habis! Kembali besok untuk jatah spin baru.
                </p>
              )}
            </div>

            {/* ── My Rewards ── */}
            <div className="w-full max-w-sm">
              <div className="rounded-xl bg-gradient-to-br from-secondary to-card border border-border p-6 space-y-4 text-left">
                <h2 className="font-headline text-2xl font-semibold text-center">My Rewards</h2>
                <div className="space-y-3">
                  {[
                    {
                      img: 'https://gold-defensive-cattle-30.mypinata.cloud/ipfs/bafkreib6wlrvvorkcbkma43liqxrm4dv7hgad4jbqlcjzaa6rynileb7c4',
                      label: 'TON Balance',
                      value: tonBalance.toFixed(2),
                    },
                    {
                      icon: <RibsIcon className="w-6 h-6 text-primary" />,
                      label: 'RIBS Balance',
                      value: ribsBalance.toLocaleString(),
                    },
                    {
                      img: 'https://gold-defensive-cattle-30.mypinata.cloud/ipfs/bafybeigzzuj4h2dubddoshcjm2jzbtdbvdeoyghtawnkun4mzwjz22e3sm',
                      label: 'Rare Cards',
                      value: rareCards,
                    },
                    {
                      img: 'https://gold-defensive-cattle-30.mypinata.cloud/ipfs/bafybeidw7yyryxsvkrnvt3iq265sgzlxqgdqyjof2f37boirniov3c7ene',
                      label: 'Epic Cards',
                      value: epicCards,
                    },
                    {
                      img: 'https://gold-defensive-cattle-30.mypinata.cloud/ipfs/bafybeidqm2w7kvkcxgowstbptive5vjyuwnabl5rcammfkkasjioabrxle',
                      label: 'Mythic Cards',
                      value: mythicCards,
                    },
                  ].map(({ img, icon, label, value }) => (
                    <div key={label} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {img
                          ? <Image src={img} alt={label} width={24} height={24} />
                          : icon}
                        <span className="font-medium text-muted-foreground">{label}</span>
                      </div>
                      <span className="font-bold text-lg">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="w-full max-w-sm text-center text-xs text-muted-foreground px-4 space-y-1">
              <p>TON withdrawals will be enabled upon the conclusion of the airdrop</p>
              <p>Accumulated cards can be redeemed for tokens and NFTs at the appropriate time</p>
            </div>
          </div>
        </div>
      </AppLayout>

      {/* ── Reward modal ── */}
      <AlertDialog open={isModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-2xl font-headline">
              🎉 Congratulations!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center pt-2">
              You won:
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex justify-center py-6">
            {getRewardComponent()}
          </div>

          <AlertDialogFooter>
            <Button
              onClick={closeModal}
              disabled={isSaving}
              className="w-full text-lg py-3"
            >
              {isSaving ? '💾 Saving...' : '🙌 Awesome!'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
