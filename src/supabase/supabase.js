import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const options = {
  global: {
    fetch: async (url, options) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 3000); // 3000ms strict timeout

      try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
      } catch (error) {
        clearTimeout(id);
        console.warn('Supabase fetch timed out or failed, falling back', error);
        throw error;
      }
    }
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, options);

/**
 * Note to User:
 * Please connect to Supabase in the chat box before proceeding with database operations.
 * Ensure you have created the tables: cyber_runner_runs and cyber_runner_streaks.
 */
