'use client';

import { useEffect, type PropsWithChildren, useState } from 'react';

function AppInitializer({ children }: PropsWithChildren) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <>
      {children}
    </>
  );
}

export function TelegramProvider({ children }: PropsWithChildren) {
  return (
    <AppInitializer>{children}</AppInitializer>
  );
}
