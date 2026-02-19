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
// CONTEXT - agar komponen lain bisa akses status user
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
      // Cek apakah Telegram WebApp sudah ada dan punya initDataUnsafe
      if (
        typeof window !== 'undefined' &&
        window.Telegram?.WebApp?.initDataUnsafe
      ) {
        resolve(true);
        return;
      }

      // Timeout jika sudah terlalu lama
      if (Date.now() - startTime > maxWaitMs) {
        console.warn('[TelegramProvider] Timeout waiting for Telegram WebApp');
        resolve(false);
        return;
      }

      // Coba lagi dalam 100ms
      setTimeout(check, 100);
    };

    check();
  });
}

// ============================================================
// HELPER: Sync user ke Supabase dengan retry
// ============================================================
async function syncUserToSupabase(
  tgUser: TelegramUser,
  retries = 3
): Promise<boolean> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[Supabase] Sync attempt ${attempt} for user:`, tgUser.id);

      const { data, error } = await supabase
        .from('users')
        .upsert(
          {
            id: tgUser.id,
            username: tgUser.username || `user_${tgUser.id}`,
            first_name: tgUser.first_name || '',
            last_name: tgUser.last_name || '',
            referral_code: `ref_${tgUser.id}`,
          },
          {
            onConflict: 'id',
            ignoreDuplicates: false, // Selalu update data terbaru
          }
        )
        .select()
        .single();

      if (error) {
        console.error(`[Supabase] Attempt ${attempt} error:`, error);

        // Jika error RLS policy, tidak perlu retry
        if (error.code === '42501') {
          console.error(
            '[Supabase] ❌ RLS Policy Error! Pastikan policy INSERT dan UPDATE sudah benar di Supabase Dashboard.'
          );
          console.error(
            '[Supabase] SQL yang diperlukan:\n' +
            'CREATE POLICY "Allow anon insert" ON users FOR INSERT TO anon WITH CHECK (true);\n' +
            'CREATE POLICY "Allow anon update" ON users FOR UPDATE TO anon USING (true) WITH CHECK (true);\n' +
            'CREATE POLICY "Allow anon select" ON users FOR SELECT TO anon USING (true);'
          );
          return false;
        }

        // Untuk error lain, tunggu sebentar lalu retry
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, attempt * 500));
          continue;
        }
        return false;
      }

      console.log('[Supabase] ✅ User synced successfully:', data);
      return true;
    } catch (e) {
      console.error(`[Supabase] Attempt ${attempt} exception:`, e);
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, attempt * 500));
      }
    }
  }
  return false;
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

      // 1. Tunggu Telegram WebApp script siap (polling, bukan timeout tetap)
      const isReady = await waitForTelegramWebApp(5000);

      if (cancelled) return;

      if (!isReady) {
        console.warn('[TelegramProvider] Running outside Telegram or WebApp not available');
        setIsLoading(false);
        return;
      }

      const webApp = window.Telegram.WebApp;

      // 2. Panggil ready() dan expand() untuk konfigurasi tampilan
      try {
        webApp.ready();
        webApp.expand();
      } catch (e) {
        console.error('[TelegramProvider] WebApp init error:', e);
      }

      // 3. Ambil data user dari initDataUnsafe
      const tgUser = webApp.initDataUnsafe?.user;

      if (!tgUser || !tgUser.id) {
        console.warn('[TelegramProvider] No user in initDataUnsafe. Pastikan bot dikonfigurasi dengan benar.');
        console.warn('[TelegramProvider] initDataUnsafe:', webApp.initDataUnsafe);
        setIsLoading(false);
        return;
      }

      console.log('[TelegramProvider] ✅ Got Telegram user:', tgUser);
      setUser(tgUser);

      // 4. Sync ke Supabase
      const synced = await syncUserToSupabase(tgUser);
      if (!cancelled) {
        setIsSynced(synced);
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
