'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppLayout } from '@/components/ribs/app-layout';
import { userProfile } from '@/lib/data';
import { Calendar, Users, HelpCircle, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RibsIcon } from '@/components/ribs/ribs-icon';

function StatCard({ icon: Icon, title, value }: { icon: React.ElementType, title: string, value: string | number }) {
    return (
        <div className="text-center bg-background/50 rounded-xl p-4 shadow-inner border border-white/5">
            <Icon className="mx-auto h-8 w-8 text-accent mb-2" />
            <p className="text-2xl font-bold font-headline">{value}</p>
            <p className="text-sm text-muted-foreground">{title}</p>
        </div>
    );
}

export default function ProfilePage() {
    const { toast } = useToast();
    const [email, setEmail] = useState(userProfile.email || '');
    const [isCopied, setIsCopied] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

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
        <header className="flex flex-col items-center text-center space-y-4">
          <Image
            src="https://picsum.photos/seed/you/100/100"
            alt={userProfile.username}
            width={100}
            height={100}
            className="rounded-full border-4 border-primary"
            data-ai-hint="avatar"
          />
          <div>
            <h1 className="text-3xl font-headline font-bold">{userProfile.username}</h1>
            <p className="text-muted-foreground">Welcome to your farm!</p>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-4">
            <StatCard icon={RibsIcon} title="Total RIBS" value={isMounted ? userProfile.totalRibs.toLocaleString() : userProfile.totalRibs.toLocaleString('en-US')} />
            <StatCard icon={Users} title="Total Referrals" value={userProfile.totalReferrals} />
            <StatCard icon={Calendar} title="Join Date" value={userProfile.joinDate} />
            <StatCard icon={HelpCircle} title="Airdrop Status" value="Soon" />
        </div>

        <div className="rounded-xl bg-background/50 p-6 space-y-2 shadow-inner border border-white/5">
            <h2 className="font-headline text-2xl font-semibold leading-none tracking-tight">Referral Link</h2>
            <p className="text-sm text-muted-foreground">Invite friends and earn more RIBS for each referral.</p>
            <div className="flex items-center gap-2 pt-2">
                <Input type="text" readOnly value={`https://t.me/ribs_bot?start=${userProfile.referralCode}`} />
                <Button size="icon" onClick={handleCopy}>
                    {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
            </div>
        </div>

        <div className="rounded-xl bg-background/50 p-6 space-y-2 shadow-inner border border-white/5">
            <h2 className="font-headline text-2xl font-semibold leading-none tracking-tight">Submit Email</h2>
            <p className="text-sm text-muted-foreground">Provide your email for important updates and airdrop eligibility.</p>
            <div className="flex items-center gap-2 pt-2">
                <Input type="email" placeholder="your.email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                <Button>Submit</Button>
            </div>
        </div>

      </div>
    </AppLayout>
  );
}
