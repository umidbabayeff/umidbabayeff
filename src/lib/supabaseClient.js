import { createClient } from '@supabase/supabase-js';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const supabaseUrl = /** @type {string} */ (import.meta.env.VITE_SUPABASE_URL);
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const supabaseAnonKey = /** @type {string} */ (import.meta.env.VITE_SUPABASE_ANON_KEY);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
