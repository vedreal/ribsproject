'use client';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/ribs/app-layout';
import { userProfile } from '@/lib/data';
import { Copy, Check, Gift } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { RibsIcon } from '@/components/ribs/ribs-icon';
import { Input } from '@/components/ui/input';

const referrals = [
    { name: 'cypher', ribs: 10000 },
    { name: 'vortex', ribs: 10000 },
    { name: 'nova', ribs: 5000 },
    { name: 'echo', ribs: 5000 },
    { name: 'pulse', ribs: 2500 },
];

export default function ReferralsPage() {
    const { toast } = useToast();
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        const referralLink = `https://t.me/ribs_bot?start=${userProfile.referralCode}`;
        navigator.clipboard.writeText(referralLink);
        setIsCopied(true);
        toast({
            title: 'Copied to clipboard!',
            description: 'Your referral link is ready to be shared.',
        });
        setTimeout(() => setIsCopied(false), 2000);
    };

  return (
    <AppLayout>
      <div className="space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-headline font-bold">Referrals</h1>
          <p className="text-muted-foreground">Invite friends and earn a percentage of their farm.</p>
        </header>

        <div className="rounded-xl bg-gradient-to-br from-secondary to-card border border-border p-6 space-y-2">
            <h2 className="font-headline text-2xl font-semibold leading-none tracking-tight">Your Invite Link</h2>
            <p className="text-sm text-muted-foreground">Share this link with your friends. You'll get bonus RIBS when they join and play.</p>
            <div className="flex items-center gap-2 pt-2">
                <Input type="text" readOnly value={`https://t.me/ribs_bot?start=${userProfile.referralCode}`} />
                <Button size="icon" onClick={handleCopy} className="bg-gradient-to-b from-slate-300 to-slate-500 text-slate-900 hover:brightness-95">
                    {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
            </div>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-secondary to-card border border-border p-6">
            <div className="space-y-1.5 mb-6">
                <h2 className="font-headline text-2xl font-semibold leading-none tracking-tight">Your Referrals ({referrals.length})</h2>
                <p className="text-sm text-muted-foreground">Users who joined using your link.</p>
            </div>
            <ul className="space-y-3">
                {referrals.map((ref, index) => (
                    <li key={index} className="flex items-center justify-between bg-gradient-to-br from-card to-background border border-border p-3 rounded-lg">
                        <div className="flex items-center gap-3">
                            <Image
                            src={`https://picsum.photos/seed/${ref.name}/40/40`}
                            alt={ref.name}
                            width={40}
                            height={40}
                            className="rounded-full"
                            data-ai-hint="avatar"
                            />
                            <span className="font-medium">{ref.name}</span>
                        </div>
                        <div className="flex items-center gap-2 font-semibold text-primary">
                            <Gift className="w-4 h-4" /> +{ref.ribs.toLocaleString('en-US')}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
      </div>
    </AppLayout>
  );
}
