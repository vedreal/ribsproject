'use client';

import { AppRoot } from '@telegram-apps/sdk-react';
import { type PropsWithChildren, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

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
              ribs: 0,
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

    syncUser();
  }, [synced]);

  return <>{children}</>;
}

function AppInitializer({ children }: PropsWithChildren) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <AppRoot>
      <UserSync>
        {children}
      </UserSync>
    </AppRoot>
  );
}

export function TelegramProvider({ children }: PropsWithChildren) {
  return (
    <AppInitializer>{children}</AppInitializer>
  );
}
