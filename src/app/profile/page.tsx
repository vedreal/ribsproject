'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppLayout } from '@/components/ribs/app-layout';
import { getUserProfile } from '@/lib/data';
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
    const [user, setUser] = useState<any>(null);
    const [email, setEmail] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user) {
                const tgUser = window.Telegram.WebApp.initDataUnsafe.user;
                const profile = await getUserProfile(tgUser.id);
                if (profile) setUser(profile);
            }
        };
        fetchProfile();
    }, []);

    const getUserTitle = (balance: number): string => {
      if (balance >= 300000) return 'Legend';
      if (balance >= 100000) return 'Grandmaster';
      if (balance >= 50000) return 'Master';
      if (balance >= 25000) return 'Elite';
      if (balance >= 10000) return 'Skilled';
      return 'Beginner';
    };

    const balance = user?.ribs || 0;
    const userTitle = getUserTitle(balance);
    const joinDate = user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A';

  return (
    <AppLayout>
      <div className="space-y-8">
        <header className="flex flex-col items-center text-center space-y-4">
          {user?.photo_url ? (
            <Image
              src={user.photo_url}
              alt={user?.username || 'User'}
              width={100}
              height={100}
              className="rounded-full border-4 border-primary object-cover w-24 h-24"
            />
          ) : (
             <div className="w-24 h-24 rounded-full border-4 border-primary bg-primary/10 flex items-center justify-center">
                <User className="w-12 h-12 text-primary" />
             </div>
          )}
          <div>
            <h1 className="text-3xl font-headline font-bold">{user?.username || user?.first_name || 'User'}</h1>
            <p className="text-muted-foreground">You are {userTitle}</p>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-4">
            <StatCard icon={RibsIcon} title="Total RIBS" value={balance.toLocaleString('en-US')} />
            <StatCard icon={Users} title="Total Referrals" value={0} />
            <StatCard icon={Calendar} title="Join Date" value={joinDate} />
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
