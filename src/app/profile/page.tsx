'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppLayout } from '@/components/ribs/app-layout';
import { userProfile } from '@/lib/data';
import { Calendar, Users, HelpCircle } from 'lucide-react';
import { RibsIcon } from '@/components/ribs/ribs-icon';

function StatCard({ icon: Icon, title, value }: { icon: React.ElementType, title: string, value: string | number }) {
    return (
        <div className="text-center bg-gradient-to-br from-secondary to-card border border-border rounded-xl p-4">
            <Icon className="mx-auto h-8 w-8 text-accent mb-2" />
            <p className="text-2xl font-bold font-headline">{value}</p>
            <p className="text-sm text-muted-foreground">{title}</p>
        </div>
    );
}

export default function ProfilePage() {
    const [email, setEmail] = useState(userProfile.email || '');

    const getUserTitle = (balance: number): string => {
      if (balance >= 300000) return 'Legend';
      if (balance >= 100000) return 'Grandmaster';
      if (balance >= 50000) return 'Master';
      if (balance >= 25000) return 'Elite';
      if (balance >= 10000) return 'Skilled';
      return 'Beginner';
    };

    const userTitle = getUserTitle(userProfile.totalRibs);

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
            <p className="text-muted-foreground">You are {userTitle}</p>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-4">
            <StatCard icon={RibsIcon} title="Total RIBS" value={userProfile.totalRibs.toLocaleString('en-US')} />
            <StatCard icon={Users} title="Total Referrals" value={userProfile.totalReferrals} />
            <StatCard icon={Calendar} title="Join Date" value={userProfile.joinDate} />
            <StatCard icon={HelpCircle} title="Airdrop Status" value="Soon" />
        </div>

        <div className="rounded-xl bg-gradient-to-br from-secondary to-card border border-border p-6 space-y-2">
            <h2 className="font-headline text-2xl font-semibold leading-none tracking-tight">Submit Email</h2>
            <p className="text-sm text-muted-foreground">Provide your email for important updates and airdrop eligibility.</p>
            <div className="flex items-center gap-2 pt-2">
                <Input type="email" placeholder="your.email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                <Button className="bg-gradient-to-b from-slate-300 to-slate-500 text-slate-900 font-bold hover:brightness-95">Submit</Button>
            </div>
        </div>

      </div>
    </AppLayout>
  );
}
