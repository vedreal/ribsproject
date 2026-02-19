import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type User = {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  ribs: number;
  referral_code: string;
  referred_by?: number;
};
