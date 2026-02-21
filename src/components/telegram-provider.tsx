'use client';

import { type PropsWithChildren, useEffect, useState, createContext, useContext } from 'react';
import { supabase } from '@/lib/supabase';

// ============================================================
// TYPE DECLARATIONS
// ============================================================
declare global {
  interface Window {
    Telegram: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            username?: string;
            first_name?: string;
            last_name?: string;
          };
          start_param?: string;
        };
        ready: () => void;
        expand: () => void;
        enableClosingConfirmation: () => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
      };
    };
  }
}

// ============================================================
// CONTEXT
// ============================================================
type TelegramUser = {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
};

type TelegramContextType = {
  user: TelegramUser | null;
  isSynced: boolean;
  isLoading: boolean;
};

const TelegramContext = createContext<TelegramContextType>({
  user: null,
  isSynced: false,
  isLoading: true,
});

export const useTelegram = () => useContext(TelegramContext);

// ============================================================
// HELPER: Tunggu sampai Telegram WebApp siap
// ============================================================
function waitForTelegramWebApp(maxWaitMs = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    const startTime = Date.now();

    const check = () => {
      if (
        typeof window !== 'undefined' &&
        window.Telegram?.WebApp?.initDataUnsafe
      ) {
        resolve(true);
        return;
      }

      if (Date.now() - startTime > maxWaitMs) {
        console.warn('[TelegramProvider] Timeout waiting for Telegram WebApp');
        resolve(false);
        return;
      }

      setTimeout(check, 100);
    };

    check();
  });
}

// ============================================================
// HELPER: Sync user ke Supabase
// ============================================================
async function syncUserToSupabase(
  tgUser: TelegramUser,
  startParam: string | undefined,
  retries = 3
): Promise<any> {
  // ── Parse referrer ID ──────────────────────────────────────
  // start_param bisa berupa:
  //   "7123867002"       (format baru — hanya angka)
  //   "ref_7123867002"   (format lama — dengan prefix)
  let referredBy: number | null = null;
  if (startParam) {
    const cleaned = startParam.replace(/^ref_/, '');
    const parsed = parseInt(cleaned, 10);
    if (!isNaN(parsed) && parsed !== tgUser.id) {
      referredBy = parsed;
    }
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(
        `[Supabase] Sync attempt ${attempt} for user:`,
        tgUser.id,
        referredBy ? `referred by ${referredBy}` : '(no referrer)'
      );

      // Cek apakah user sudah ada (untuk tidak overwrite referred_by)
      const { data: existing } = await supabase
        .from('users')
        .select('id, referred_by')
        .eq('id', tgUser.id)
        .maybeSingle();

      const upsertPayload: Record<string, any> = {
        id: tgUser.id,
        username: tgUser.username || `user_${tgUser.id}`,
        first_name: tgUser.first_name || '',
        last_name: tgUser.last_name || '',
        photo_url: (tgUser as any).photo_url || '',
        // referral_code = pure numeric user ID (no prefix)
        referral_code: String(tgUser.id),
      };

      // Hanya set referred_by jika:
      // 1. Ada start_param valid, DAN
      // 2. User baru (belum ada di DB) atau belum punya referred_by
      if (referredBy && (!existing || !existing.referred_by)) {
        upsertPayload.referred_by = referredBy;
      }

      const { data, error } = await supabase
        .from('users')
        .upsert(upsertPayload, {
          onConflict: 'id',
          ignoreDuplicates: false,
        })
        .select()
        .single();

      if (error) {
        console.error(`[Supabase] Attempt ${attempt} error:`, error);
        if (error.code === '42501') return null;
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, attempt * 500));
          continue;
        }
        return null;
      }

      console.log('[Supabase] ✅ User synced successfully:', data);
      return data;
    } catch (e) {
      console.error(`[Supabase] Attempt ${attempt} exception:`, e);
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, attempt * 500));
      }
    }
  }
  return null;
}

// ============================================================
// MAIN PROVIDER COMPONENT
// ============================================================
export function TelegramProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isSynced, setIsSynced] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      console.log('[TelegramProvider] Initializing...');

      const isReady = await waitForTelegramWebApp(5000);

      if (cancelled) return;

      if (!isReady) {
        console.warn('[TelegramProvider] Running outside Telegram or WebApp not available');
        setIsLoading(false);
        return;
      }

      const webApp = window.Telegram.WebApp;

      try {
        webApp.ready();
        webApp.expand();
      } catch (e) {
        console.error('[TelegramProvider] WebApp init error:', e);
      }

      const tgUser = webApp.initDataUnsafe?.user;
      const startParam = webApp.initDataUnsafe?.start_param;

      console.log('[TelegramProvider] start_param:', startParam);

      if (!tgUser || !tgUser.id) {
        console.warn('[TelegramProvider] No user in initDataUnsafe.');
        setIsLoading(false);
        return;
      }

      console.log('[TelegramProvider] ✅ Got Telegram user:', tgUser);
      setUser(tgUser);

      // Sync ke Supabase — pass start_param agar referred_by tersimpan
      const syncedData = await syncUserToSupabase(tgUser, startParam);
      if (!cancelled) {
        setIsSynced(!!syncedData);
        setIsLoading(false);
      }
    }

    initialize();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <TelegramContext.Provider value={{ user, isSynced, isLoading }}>
      {children}
    </TelegramContext.Provider>
  );
}
