'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppLayout } from '@/components/ribs/app-layout';
import { getUserProfile } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { Calendar, Users, HelpCircle, User as UserIcon } from 'lucide-react';
import { RibsIcon } from '@/components/ribs/ribs-icon';
import { useToast } from '@/hooks/use-toast';
import { useTelegram } from '@/components/telegram-provider';

function StatCard({ icon: Icon, title, value }: { icon: React.ElementType, title: string, value: string | number }) {
  return (
    <div className="text-center bg-gradient-to-br from-secondary to-card border border-border rounded-xl p-4">
      <Icon className="mx-auto h-8 w-8 text-accent mb-2" />
      <p className="text-2xl font-bold font-headline">{value}</p>
      <p className="text-sm text-muted-foreground">{title}</p>
    </div>
  );
}

// Valid domains for email submission
const VALID_EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];

function isValidEmail(email: string): boolean {
  const trimmed = email.trim().toLowerCase();
  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) return false;
  // Domain check
  const domain = trimmed.split('@')[1];
  return VALID_EMAIL_DOMAINS.includes(domain);
}

export default function ProfilePage() {
  const { user: tgUser, isLoading } = useTelegram();
  const { toast } = useToast();
  const userId = tgUser?.id ?? null;

  const [profile, setProfile]           = useState<any>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [email, setEmail]               = useState('');
  const [savedEmail, setSavedEmail]     = useState<string | null>(null);
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [isLoaded, setIsLoaded]         = useState(false);

  useEffect(() => {
    if (!userId || isLoading) return;

    (async () => {
      try {
        const data = await getUserProfile(userId);
        if (data) {
          setProfile(data);
          // If email already saved, lock the field
          if (data.email) setSavedEmail(data.email);
        }

        // Fetch referral count
        const { count } = await supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq('referred_by', userId);

        setReferralCount(count ?? 0);
        setIsLoaded(true);
      } catch (e) {
        console.error('ProfilePage load error:', e);
        setIsLoaded(true);
      }
    })();
  }, [userId, isLoading]);

  const getUserTitle = (balance: number): string => {
    if (balance >= 300000) return 'Legend';
    if (balance >= 100000) return 'Grandmaster';
    if (balance >= 50000)  return 'Master';
    if (balance >= 25000)  return 'Elite';
    if (balance >= 10000)  return 'Skilled';
    return 'Beginner';
  };

  const handleSubmitEmail = async () => {
    if (!userId || savedEmail || isSavingEmail) return;
    if (!isValidEmail(email)) {
      // Silently ignore invalid emails — no domain-specific error message
      toast({ title: 'Please enter a valid email address.', variant: 'destructive' });
      return;
    }

    setIsSavingEmail(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ email: email.trim().toLowerCase() })
        .eq('id', userId);

      if (error) throw error;

      setSavedEmail(email.trim().toLowerCase());
      toast({ title: '✅ Email saved successfully!' });
    } catch (e) {
      console.error('Save email error:', e);
      toast({ title: 'Failed to save email, please try again.', variant: 'destructive' });
    }
    setIsSavingEmail(false);
  };

  const balance    = profile?.ribs ?? 0;
  const userTitle  = getUserTitle(balance);
  const joinDate   = profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A';
  const displayName = profile?.username || profile?.first_name || 'User';

  return (
    <AppLayout>
      <div className="space-y-8">
        <header className="flex flex-col items-center text-center space-y-4">
          {profile?.photo_url ? (
            <Image
              src={profile.photo_url}
              alt={displayName}
              width={100}
              height={100}
              className="rounded-full border-4 border-primary object-cover w-24 h-24"
            />
          ) : (
            <div className="w-24 h-24 rounded-full border-4 border-primary bg-primary/10 flex items-center justify-center">
              <UserIcon className="w-12 h-12 text-primary" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-headline font-bold">{displayName}</h1>
            <p className="text-muted-foreground">You are {userTitle}</p>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-4">
          <StatCard icon={RibsIcon} title="Total RIBS" value={balance.toLocaleString('en-US')} />
          <StatCard icon={Users}    title="Total Referrals" value={isLoaded ? referralCount : '—'} />
          <StatCard icon={Calendar} title="Join Date" value={joinDate} />
          <StatCard icon={HelpCircle} title="Airdrop Status" value="Soon" />
        </div>

        <div className="rounded-xl bg-gradient-to-br from-secondary to-card border border-border p-6 space-y-2">
          <h2 className="font-headline text-2xl font-semibold leading-none tracking-tight">Submit Email</h2>
          <p className="text-sm text-muted-foreground">
            Provide your email for important updates and airdrop eligibility.
          </p>

          {savedEmail ? (
            // Locked state — email already submitted
            <div className="flex items-center gap-2 pt-2">
              <Input
                type="email"
                value={savedEmail}
                disabled
                className="opacity-70 cursor-not-allowed"
              />
              <Button disabled className="opacity-70 cursor-not-allowed">
                Saved
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pt-2">
              <Input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitEmail()}
              />
              <Button
                onClick={handleSubmitEmail}
                disabled={isSavingEmail || !email.trim() || !isLoaded}
                className="bg-gradient-to-b from-slate-300 to-slate-500 text-slate-900 font-bold hover:brightness-95"
              >
                {isSavingEmail ? 'Saving...' : 'Submit'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
