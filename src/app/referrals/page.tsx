'use client';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/ribs/app-layout';
import { userProfile } from '@/lib/data';
import { Copy, Check, Gift } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { RibsIcon } from '@/components/ribs/ribs-icon';
import { Input } from '@/components/ui/input';

// Mocking useTelegram and supabase since they aren't imported or defined
const useTelegram = () => ({ user: { id: '123', username: 'testuser', first_name: 'Test' } });
const supabase = {
    from: (table: string) => ({
        select: (query: string) => ({
            eq: (column: string, value: any) => Promise.resolve({ data: [], error: null })
        })
    })
};

export default function ReferralsPage() {
    const { toast } = useToast();
    const [isCopied, setIsCopied] = useState(false);
    const [referrals, setReferrals] = useState<{ name: string; ribs: number }[]>([]);
    const { user: tgUser } = useTelegram();

    useEffect(() => {
        if (!tgUser?.id) return;
        const fetchReferrals = async () => {
            const { data, error } = await supabase
                .from('users')
                .select('username, first_name')
                .eq('referrer_id', tgUser.id);
            
            if (data) {
                setReferrals(data.map((u: any) => ({
                    name: u.username || u.first_name || 'Anonymous',
                    ribs: 100 // Example reward per referral
                })));
            }
        };
        fetchReferrals();
    }, [tgUser?.id]);

    const handleCopy = () => {
        const referralLink = `https://t.me/ribs_bot?start=${userProfile?.referralCode || ''}`;
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
                <Input type="text" readOnly value={`https://t.me/ribs_bot?start=${userProfile?.referralCode || ''}`} />
                <Button size="icon" onClick={handleCopy} className="bg-gradient-to-b from-slate-300 to-slate-500 text-slate-900 font-bold hover:brightness-95">
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
