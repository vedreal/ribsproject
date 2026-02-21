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

// ── Rewards & Wheel Config ────────────────────────────────────
// Urutan segment searah jarum jam dari atas (12 o'clock)
// Index 0 = segment paling atas saat wheel rotation = 0
const REWARDS = [
  '1 TON',       // index 0  — warna #818cf8
  '5000 RIBS',   // index 1  — warna #c084fc
  'Epic Card',   // index 2  — warna #f9a8d4
  'Try Again!',  // index 3  — warna #fde047
  '0.2 TON',     // index 4  — warna #a3e635
  'Rare Card',   // index 5  — warna #4ade80
  '500 RIBS',    // index 6  — warna #34d399
  'Mythic Card', // index 7  — warna #22d3ee
  '0.2 TON',     // index 8  — warna #38bdf8
  '1 TON',       // index 9  — warna #60a5fa
] as const;

type Reward = typeof REWARDS[number];

const NUM_SEG = REWARDS.length;       // 10
const SEG_DEG = 360 / NUM_SEG;       // 36 deg per segment

const SEG_COLORS = [
  '#818cf8', '#c084fc', '#f9a8d4', '#fde047', '#a3e635',
  '#4ade80', '#34d399', '#22d3ee', '#38bdf8', '#60a5fa',
];

// CSS conic-gradient: 0deg = atas (12 o'clock), clockwise
// Segment i mulai dari i*36 deg, selesai di (i+1)*36 deg
const CONIC = `conic-gradient(${SEG_COLORS.map((c, i) =>
  `${c} ${i * SEG_DEG}deg ${(i + 1) * SEG_DEG}deg`
).join(', ')})`;

// ── Baca reward dari posisi wheel ─────────────────────────────
// Setelah wheel rotate R derajat (clockwise):
//   Segment yang ada di atas = segment yang menempati posisi (360 - R%360) % 360
//   karena wheel berputar clockwise, titik yang tadinya di bawah naik ke atas
// Segment i menempati: i*36 s/d (i+1)*36 deg
function getRewardFromRotation(totalRotation: number): { index: number; reward: Reward } {
  const R = ((totalRotation % 360) + 360) % 360;
  const posAtTop = (360 - R) % 360;
  const index = Math.floor(posAtTop / SEG_DEG) % NUM_SEG;
  return { index, reward: REWARDS[index] };
}

const DEFAULT_FREE = 1;
const DEFAULT_AD   = 2;

export default function SpinPage() {
  // Spin state
  const [freeSpins, setFreeSpins] = useState(DEFAULT_FREE);
  const [adSpins,   setAdSpins]   = useState(DEFAULT_AD);
  const [isSpinning,  setIsSpinning]  = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [result,   setResult]   = useState<Reward | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving,    setIsSaving]    = useState(false);
  const [isLoaded,    setIsLoaded]    = useState(false);

  const { toast } = useToast();
  const { user: tgUser, isLoading } = useTelegram();

  // Rewards balance
  const [tonBalance,   setTonBalance]   = useState(0);
  const [rareCards,    setRareCards]    = useState(0);
  const [epicCards,    setEpicCards]    = useState(0);
  const [mythicCards,  setMythicCards]  = useState(0);
  const [ribsBalance,  setRibsBalance]  = useState(0);

  // Refs
  const wheelRotationRef = useRef(0); // track akumulasi rotation
  const freeSpinsRef     = useRef(DEFAULT_FREE);
  const adSpinsRef       = useRef(DEFAULT_AD);
  const userIdRef        = useRef<number | null>(null);

  useEffect(() => { userIdRef.current = tgUser?.id ?? null; }, [tgUser?.id]);

  // ── Load dari Supabase ──────────────────────────────────
  useEffect(() => {
    if (!tgUser?.id || isLoading) return;
    const uid = tgUser.id;

    (async () => {
      try {
        const profile = await getUserProfile(uid);
        if (!profile) { setIsLoaded(true); return; }

        setTonBalance(profile.ton_balance  ?? 0);
        setRareCards(profile.rare_cards    ?? 0);
        setEpicCards(profile.epic_cards    ?? 0);
        setMythicCards(profile.mythic_cards ?? 0);
        setRibsBalance(profile.ribs        ?? 0);

        const today = new Date().toISOString().split('T')[0];
        const savedDate = profile.spins_reset_date
          ? new Date(profile.spins_reset_date).toISOString().split('T')[0]
          : null;

        let fs: number, as: number;
        if (!savedDate || savedDate !== today) {
          fs = DEFAULT_FREE; as = DEFAULT_AD;
          supabase.from('users').update({
            free_spins_left: fs, ad_spins_left: as, spins_reset_date: today,
          }).eq('id', uid).then(({ error }) => error && console.error(error));
        } else {
          fs = profile.free_spins_left ?? DEFAULT_FREE;
          as = profile.ad_spins_left   ?? DEFAULT_AD;
        }

        setFreeSpins(fs); freeSpinsRef.current = fs;
        setAdSpins(as);   adSpinsRef.current   = as;
        setIsLoaded(true);
      } catch (e) {
        console.error('SpinPage load error:', e);
        setIsLoaded(true);
      }
    })();
  }, [tgUser?.id, isLoading]);

  // ── Save spin count ─────────────────────────────────────
  const saveSpinCount = (uid: number, fs: number, as: number) => {
    supabase.from('users').update({ free_spins_left: fs, ad_spins_left: as })
      .eq('id', uid).then(({ error }) => error && console.error('saveSpinCount:', error));
  };

  // ── Spin handler ────────────────────────────────────────
  const doSpin = (isAdSpin: boolean) => {
    if (isSpinning) return;
    setIsSpinning(true);

    const uid = userIdRef.current;

    // Kurangi jatah spin
    let fs = freeSpinsRef.current;
    let as = adSpinsRef.current;
    if (isAdSpin) { as = Math.max(0, as - 1); setAdSpins(as);   adSpinsRef.current   = as; }
    else          { fs = Math.max(0, fs - 1); setFreeSpins(fs); freeSpinsRef.current = fs; }
    if (uid) saveSpinCount(uid, fs, as);

    // ── KUNCI: putar wheel secara random, lalu baca hasilnya ──
    // Random sudut tambahan antara 0–359 deg (resolusi per derajat)
    const randomExtra = Math.floor(Math.random() * 360);
    const fullSpins   = 5 * 360; // 5 putaran penuh
    const added       = fullSpins + randomExtra;
    const newTotal    = wheelRotationRef.current + added;

    wheelRotationRef.current = newTotal;
    setWheelRotation(newTotal);

    // Baca reward dari posisi AKHIR wheel — 100% sinkron dengan visual
    const { reward } = getRewardFromRotation(newTotal);

    // Tampilkan modal setelah animasi selesai
    setTimeout(() => {
      setResult(reward);
      setIsModalOpen(true);
    }, 5200); // sedikit lebih dari durasi CSS transition (5s)
  };

  const handleSpin = (isAdSpin: boolean) => {
    if (isSpinning || !isLoaded) return;
    if (isAdSpin) {
      if (adSpins <= 0) { toast({ title: 'No ad spins left!', description: 'Come back tomorrow.' }); return; }
      toast({ title: '📺 Watching Ad...', description: 'Spinning shortly...' });
      setTimeout(() => doSpin(true), 2000);
    } else {
      if (freeSpins <= 0) { toast({ title: 'No free spins left!', description: 'Come back tomorrow.' }); return; }
      doSpin(false);
    }
  };

  // ── Close modal & simpan reward ─────────────────────────
  const closeModal = async () => {
    if (!result || isSaving) return;
    setIsSaving(true);

    const uid = tgUser?.id;
    if (uid && result !== 'Try Again!') {
      try {
        await saveSpinReward(uid, result);
        if (result.includes('TON')) {
          const amt = parseFloat(result.split(' ')[0]);
          setTonBalance(p => p + amt);
          toast({ title: '🎉 TON Added!', description: `+${amt} TON saved to your balance.` });
        } else if (result.includes('RIBS')) {
          const amt = parseInt(result.split(' ')[0]);
          setRibsBalance(p => p + amt);
          toast({ title: '🎉 RIBS Added!', description: `+${amt} RIBS saved.` });
        } else if (result === 'Rare Card') {
          setRareCards(p => p + 1);
          toast({ title: '🎉 Rare Card!', description: 'Added to your collection.' });
        } else if (result === 'Epic Card') {
          setEpicCards(p => p + 1);
          toast({ title: '🎉 Epic Card!', description: 'Added to your collection.' });
        } else if (result === 'Mythic Card') {
          setMythicCards(p => p + 1);
          toast({ title: '🎉 Mythic Card!', description: 'Added to your collection.' });
        }
      } catch {
        toast({ title: 'Failed to save reward', variant: 'destructive' });
      }
    } else if (result === 'Try Again!') {
      toast({ title: '🍀 Better luck next time!' });
    }

    setIsModalOpen(false);
    setResult(null);
    setIsSpinning(false);
    setIsSaving(false);
  };

  // ── Reward display ──────────────────────────────────────
  const RewardDisplay = () => {
    if (!result) return null;
    if (result === 'Mythic Card') return (
      <div className="flex flex-col items-center gap-3">
        <Image src="https://gold-defensive-cattle-30.mypinata.cloud/ipfs/bafybeidqm2w7kvkcxgowstbptive5vjyuwnabl5rcammfkkasjioabrxle" alt="Mythic" width={120} height={168} className="rounded-lg shadow-lg" />
        <p className="text-3xl font-bold text-yellow-400">Mythic Card</p>
      </div>
    );
    if (result === 'Rare Card') return (
      <div className="flex flex-col items-center gap-3">
        <Image src="https://gold-defensive-cattle-30.mypinata.cloud/ipfs/bafybeigzzuj4h2dubddoshcjm2jzbtdbvdeoyghtawnkun4mzwjz22e3sm" alt="Rare" width={120} height={168} className="rounded-lg shadow-lg" />
        <p className="text-3xl font-bold text-blue-400">Rare Card</p>
      </div>
    );
    if (result === 'Epic Card') return (
      <div className="flex flex-col items-center gap-3">
        <Image src="https://gold-defensive-cattle-30.mypinata.cloud/ipfs/bafybeidw7yyryxsvkrnvt3iq265sgzlxqgdqyjof2f37boirniov3c7ene" alt="Epic" width={120} height={168} className="rounded-lg shadow-lg" />
        <p className="text-3xl font-bold text-purple-400">Epic Card</p>
      </div>
    );
    if (result.includes('TON')) return (
      <div className="flex items-center gap-3 text-4xl font-bold text-cyan-400">
        <Image src="https://gold-defensive-cattle-30.mypinata.cloud/ipfs/bafkreib6wlrvvorkcbkma43liqxrm4dv7hgad4jbqlcjzaa6rynileb7c4" alt="TON" width={48} height={48} />
        {result}
      </div>
    );
    if (result === 'Try Again!') return <p className="text-4xl font-bold text-muted-foreground">🍀 Try Again!</p>;
    return (
      <div className="flex items-center gap-3 text-4xl font-bold text-primary">
        <RibsIcon className="w-12 h-12" />
        {result}
      </div>
    );
  };

  // ── Render ──────────────────────────────────────────────
  return (
    <>
      <AppLayout>
        <div className="space-y-8 text-center">
          <header>
            <h1 className="text-4xl font-headline font-bold">Spin to Win</h1>
            <p className="text-muted-foreground">Test your luck and win big!</p>
          </header>

          <div className="flex flex-col items-center gap-8">

            {/* ── Wheel ── */}
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">

              {/* Penunjuk — tepat di atas, center horizontal */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-20">
                <div className="w-0 h-0
                  border-l-[12px] border-l-transparent
                  border-r-[12px] border-r-transparent
                  border-t-[22px] border-t-white drop-shadow-md" />
              </div>

              {/* Wheel disc */}
              <div
                className="w-full h-full rounded-full border-4 border-white/20 shadow-2xl relative overflow-hidden"
                style={{
                  transition: isSpinning
                    ? 'transform 5s cubic-bezier(0.23, 1, 0.32, 1)'
                    : 'none',
                  transform: `rotate(${wheelRotation}deg)`,
                }}
              >
                {/* Background warna */}
                <div className="absolute inset-0 rounded-full" style={{ background: CONIC }} />

                {/* Teks tiap segment
                    Container diputar ke tengah segment (i*36+18 deg dari atas)
                    Teks ditulis vertikal dari luar ke dalam
                */}
                {REWARDS.map((reward, i) => {
                  const midDeg = i * SEG_DEG + SEG_DEG / 2; // tengah segment dari atas
                  return (
                    <div
                      key={i}
                      className="absolute inset-0 flex items-start justify-center"
                      style={{ transform: `rotate(${midDeg}deg)` }}
                    >
                      <span
                        className="mt-2 text-[9px] font-black text-slate-900 leading-tight select-none"
                        style={{
                          writingMode: 'vertical-lr',
                          transform: 'rotate(180deg)', // balik agar baca dari luar ke dalam
                          textShadow: '0 1px 2px rgba(255,255,255,0.6)',
                          maxHeight: '44%',
                        }}
                      >
                        {reward}
                      </span>
                    </div>
                  );
                })}

                {/* Center cap */}
                <div className="absolute inset-[28%] rounded-full bg-[hsl(var(--card))] shadow-inner flex items-center justify-center">
                  <RibsIcon className="w-10 h-10" />
                </div>
              </div>
            </div>

            {/* ── Tombol spin ── */}
            <div className="flex flex-col gap-3 w-full max-w-sm">
              <Button
                size="lg"
                onClick={() => handleSpin(false)}
                disabled={isSpinning || freeSpins <= 0 || !isLoaded}
                className="bg-gradient-to-b from-slate-300 to-slate-500 text-slate-900 font-bold"
              >
                <Ticket className="mr-2" />
                {isLoaded ? `Use Free Spin (${freeSpins} left)` : 'Loading...'}
              </Button>
              <Button
                size="lg"
                onClick={() => handleSpin(true)}
                disabled={isSpinning || adSpins <= 0 || !isLoaded}
                className="bg-gradient-to-b from-slate-300 to-slate-500 text-slate-900 font-bold"
              >
                <Tv className="mr-2" />
                {isLoaded ? `Watch Ad for Spin (${adSpins} left)` : 'Loading...'}
              </Button>
              {isLoaded && freeSpins <= 0 && adSpins <= 0 && (
                <p className="text-xs text-muted-foreground">
                  ⏰ All spins used up. Come back tomorrow!
                </p>
              )}
            </div>

            {/* ── My Rewards ── */}
            <div className="w-full max-w-sm rounded-xl bg-gradient-to-br from-secondary to-card border border-border p-5 text-left space-y-3">
              <h2 className="font-headline text-xl font-semibold text-center">My Rewards</h2>
              {[
                { img: 'https://gold-defensive-cattle-30.mypinata.cloud/ipfs/bafkreib6wlrvvorkcbkma43liqxrm4dv7hgad4jbqlcjzaa6rynileb7c4', label: 'TON Balance',   val: `${tonBalance.toFixed(2)} TON` },
                { icon: <RibsIcon className="w-5 h-5 text-primary" />,                                                                                label: 'RIBS Balance',  val: ribsBalance.toLocaleString() },
                { img: 'https://gold-defensive-cattle-30.mypinata.cloud/ipfs/bafybeigzzuj4h2dubddoshcjm2jzbtdbvdeoyghtawnkun4mzwjz22e3sm', label: 'Rare Cards',    val: rareCards },
                { img: 'https://gold-defensive-cattle-30.mypinata.cloud/ipfs/bafybeidw7yyryxsvkrnvt3iq265sgzlxqgdqyjof2f37boirniov3c7ene', label: 'Epic Cards',    val: epicCards },
                { img: 'https://gold-defensive-cattle-30.mypinata.cloud/ipfs/bafybeidqm2w7kvkcxgowstbptive5vjyuwnabl5rcammfkkasjioabrxle', label: 'Mythic Cards',  val: mythicCards },
              ].map(({ img, icon, label, val }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {img
                      ? <div className="w-6 h-6 flex items-center justify-center shrink-0">
                          <Image src={img} alt={label} width={24} height={24} className="object-contain w-6 h-6" />
                        </div>
                      : icon}
                    <span className="text-sm text-muted-foreground">{label}</span>
                  </div>
                  <span className="font-bold">{val}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground text-center max-w-sm px-4">
              TON withdrawals enabled after airdrop concludes.<br />
              Cards can be redeemed for tokens & NFTs later.
            </p>
          </div>
        </div>
      </AppLayout>

      {/* ── Modal hadiah ── */}
      <AlertDialog open={isModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-2xl font-headline">
              🎉 Congratulations!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              You won:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-center py-6">
            <RewardDisplay />
          </div>
          <AlertDialogFooter>
            <Button onClick={closeModal} disabled={isSaving} className="w-full text-base py-3">
              {isSaving ? '💾 Saving...' : '🙌 Awesome!'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
