import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // During build time on Vercel/Replit, if these are missing, we fallback to empty strings 
  // to avoid build errors, but they must be present at runtime.
  console.warn('Supabase URL or Anon Key is missing from environment variables.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

export type User = {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  ribs: number;
  referral_code: string;
  referred_by?: number;
};
