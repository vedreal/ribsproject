'use client';

import { SDKProvider, useLaunchParams, useMiniApp, useThemeParams, useViewport, bindMiniAppCSSVars, bindThemeParamsCSSVars, bindViewportCSSVars } from '@telegram-apps/sdk-react';
import { useEffect, type PropsWithChildren } from 'react';
import { syncUser } from '@/lib/data';

function AppInitializer({ children }: PropsWithChildren) {
  const lp = useLaunchParams();
  const miniApp = useMiniApp();
  const themeParams = useThemeParams();
  const viewport = useViewport();

  useEffect(() => {
    return bindMiniAppCSSVars(miniApp, themeParams);
  }, [miniApp, themeParams]);

  useEffect(() => {
    return bindThemeParamsCSSVars(themeParams);
  }, [themeParams]);

  useEffect(() => {
    return viewport && bindViewportCSSVars(viewport);
  }, [viewport]);

  useEffect(() => {
    if (lp.initData?.user) {
      const { id, username, firstName, lastName } = lp.initData.user;
      syncUser({
        id,
        username,
        first_name: firstName,
        last_name: lastName,
      });
    }
  }, [lp]);

  return <>{children}</>;
}

export function TelegramProvider({ children }: PropsWithChildren) {
  return (
    <SDKProvider acceptCustomStyles debug>
      <AppInitializer>{children}</AppInitializer>
    </SDKProvider>
  );
}
