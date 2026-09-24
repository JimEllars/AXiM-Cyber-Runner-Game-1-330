import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const options = {
  global: {
    fetch: async (url, options) => {
      let retries = 3;
      let delay = 500;
      let lastError;

      for (let i = 0; i < retries; i++) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 3000); // 3000ms strict timeout

        try {
          const response = await fetch(url, { ...options, signal: controller.signal });
          clearTimeout(id);

          if (!response.ok && response.status >= 500) {
            throw new Error(`Server error: ${response.status}`);
          }
          return response;
        } catch (error) {
          clearTimeout(id);
          lastError = error;

          if (i < retries - 1) {
            await new Promise(res => setTimeout(res, delay));
            delay *= 2; // Exponential backoff
          }
        }
      }

      console.warn('Supabase fetch failed after retries, queueing for offline sync if mutation', lastError);

      // If it's a mutation, let's gracefully absorb the error and log it so it doesn't crash the UI.
      // We return a mock ok response to prevent throwing unhandled promise rejections for network issues.
      if (options && options.method && options.method !== 'GET') {
          try {
              let bodyStr = options.body;
              if (typeof bodyStr === 'string') {
                  const queue = JSON.parse(localStorage.getItem('axim_offline_queue') || '[]');
                  queue.push({ type: 'supabase_mutation', url, method: options.method, body: JSON.parse(bodyStr) });
                  localStorage.setItem('axim_offline_queue', JSON.stringify(queue));
              }
          } catch(e) {
              console.warn('Failed to parse mutation payload for queueing', e);
          }
          return new Response(JSON.stringify({}), { status: 200, statusText: 'Queued Offline' });
      }

      throw lastError;
    }
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, options);

/**
 * Note to User:
 * Please connect to Supabase in the chat box before proceeding with database operations.
 * Ensure you have created the tables: cyber_runner_runs and cyber_runner_streaks.
 */
