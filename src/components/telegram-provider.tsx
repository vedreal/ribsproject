'use client';

import { type PropsWithChildren, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// Declare global Telegram interface for TypeScript
declare global {
  interface Window {
    Telegram: {
      WebApp: {
        initDataUnsafe: {
          user?: {
            id: number;
            username?: string;
            first_name?: string;
            last_name?: string;
          };
        };
        ready: () => void;
        expand: () => void;
      };
    };
  }
}

function UserSync({ children }: PropsWithChildren) {
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    async function syncUser() {
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user && !synced) {
        const user = window.Telegram.WebApp.initDataUnsafe.user;
        console.log('Syncing user to Supabase:', user);

        try {
          const { error } = await supabase
            .from('users')
            .upsert({
              id: user.id,
              username: user.username || '',
              first_name: user.first_name || '',
              last_name: user.last_name || '',
              referral_code: `ref_${user.id}`,
            }, { onConflict: 'id' });

          if (error) {
            console.error('Error syncing user to Supabase:', error);
          } else {
            console.log('User synced successfully');
            setSynced(true);
          }
        } catch (e) {
          console.error('Exception during user sync:', e);
        }
      }
    }

    // Give some time for Telegram WebApp to initialize
    const timer = setTimeout(syncUser, 1000);
    return () => clearTimeout(timer);
  }, [synced]);

  return <>{children}</>;
}

function AppInitializer({ children }: PropsWithChildren) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      try {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
      } catch (e) {
        console.error('Error initializing Telegram WebApp:', e);
      }
    }
  }, []);

  if (!isClient) return null;

  return (
    <UserSync>
      {children}
    </UserSync>
  );
}

export function TelegramProvider({ children }: PropsWithChildren) {
  return (
    <AppInitializer>{children}</AppInitializer>
  );
}
