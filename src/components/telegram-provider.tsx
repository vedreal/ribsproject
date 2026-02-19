'use client';

import { SDKProvider, useLaunchParams } from '@telegram-apps/sdk-react';
import { useEffect, type PropsWithChildren, useState } from 'react';
import { syncUser } from '@/lib/data';

function AppInitializer({ children }: PropsWithChildren) {
  const lp = useLaunchParams();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && lp.initData?.user) {
      const { id, username, firstName, lastName } = lp.initData.user;
      syncUser({
        id,
        username,
        first_name: firstName,
        last_name: lastName,
      });
    }
  }, [lp, isClient]);

  if (!isClient) return null;

  return <>{children}</>;
}

export function TelegramProvider({ children }: PropsWithChildren) {
  return (
    <SDKProvider acceptCustomStyles debug>
      <AppInitializer>{children}</AppInitializer>
    </SDKProvider>
  );
}
