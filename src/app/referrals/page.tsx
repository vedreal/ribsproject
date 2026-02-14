'use client';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLayout } from '@/components/lumion/app-layout';
import { userProfile } from '@/lib/data';
import { Copy, Check, Gift } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { LumionIcon } from '@/components/lumion/lumion-icon';

const referrals = [
    { name: 'cypher', lumions: 10000 },
    { name: 'vortex', lumions: 10000 },
    { name: 'nova', lumions: 5000 },
    { name: 'echo', lumions: 5000 },
    { name: 'pulse', lumions: 2500 },
];

export default function ReferralsPage() {
    const { toast } = useToast();
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        const referralLink = `https://t.me/lumion_bot?start=${userProfile.referralCode}`;
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

        <Card className="bg-gradient-to-br from-primary/20 to-accent/20">
            <CardHeader>
                <CardTitle className="font-headline text-center">Your Invite Link</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
                <p className="text-center text-sm">Share this link with your friends. You'll get bonus LUMION when they join and play.</p>
                <Button onClick={handleCopy} size="lg" className="w-full max-w-sm font-bold">
                    {isCopied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                    Copy Invite Link
                </Button>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Your Referrals ({referrals.length})</CardTitle>
                <CardDescription>Users who joined using your link.</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-3">
                    {referrals.map((ref, index) => (
                        <li key={index} className="flex items-center justify-between bg-card p-3 rounded-lg">
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
                                <Gift className="w-4 h-4" /> +{ref.lumions.toLocaleString()}
                            </div>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
