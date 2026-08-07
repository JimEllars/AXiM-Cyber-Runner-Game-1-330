import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Note to User:
 * Please connect to Supabase in the chat box before proceeding with database operations.
 * Ensure you have created the tables: cyber_runner_runs and cyber_runner_streaks.
 */