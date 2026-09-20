/**
 * AXiM Cyber-Runner API Service
 * Handles communication with the Cloudflare Edge Worker
 */

const API_BASE = 'api/v1/game';

const fetchWithTimeout = async (resource, options = {}) => {
  const { timeout = 3000 } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const response = await fetch(resource, {
    ...options,
    signal: controller.signal
  });
  clearTimeout(id);

  return response;
};

export const runnerApi = {
  /**
   * Validates the current SIWE session
   */
  async checkSession() {
    try {
      const response = await fetchWithTimeout(`${API_BASE}/validate-session`, { timeout: 3000 });
      if (!response.ok) throw new Error('Session expired');
      return await response.json();
    } catch (error) {
      console.error('API Error (Session):', error);
      throw error;
    }
  },

  /**
   * Validates a Passport SSO delegation token
   */
  async validateToken(token) {
    try {
      // In a real scenario, this would call AXiM Core session endpoints
      // Mocking success for demo purposes, but pointing to expected route
      const response = await fetchWithTimeout(`/api/v1/auth/validate-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        timeout: 3000
      });
      if (!response.ok) throw new Error('Invalid token');
      return await response.json();
    } catch (error) {
      console.error('Token Validation Error:', error);
      throw error;
    }
  },
  /**
   * Checks if the user has a free run available for today
   */
  /**
   * Fetches the user's current streak multiplier
   */
  async getStreakMultiplier(address) {
    try {
      const response = await fetchWithTimeout(`${API_BASE}/streak-multiplier?address=${address}`, { timeout: 3000 });
      if (!response.ok) throw new Error('Failed to fetch streak multiplier');
      const data = await response.json();
      return data.multiplier || 1.0;
    } catch (error) {
      console.error('API Error (Streak):', error);
      return 1.5; // Mock fallback value as per request to have something visible
    }
  },

  /**
   * Checks if the user has a free run available for today
   */
  async getTicketStatus(address) {
    try {
      const response = await fetchWithTimeout(`${API_BASE}/ticket-status?address=${address}`, { timeout: 3000 });
      if (!response.ok) throw new Error('Failed to fetch ticket status');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return { freeRunAvailable: true }; // Fallback for dev/local
    }
  },

  /**
   * Submits a completed run for verification and recording
   */
  async submitRun(payload) {
    try {
      const response = await fetchWithTimeout(`${API_BASE}/runs/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        timeout: 3000
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.reason || 'Submission failed');
      return result;
    } catch (error) {
      console.error('Submission Error:', error);
      throw error;
    }
  },

  /**
   * Syncs newly unlocked achievements to the Edge Bridge
   */
  async syncAchievements(payload) {
    try {
      const response = await fetchWithTimeout(`${API_BASE}/sync-achievements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        timeout: 3000
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Sync failed');
      return result;
    } catch (error) {
      console.error('Achievement Sync Error:', error);
      throw error;
    }
  },

  /**
   * Submits telemetry data to the Edge Bridge
   */
  async submitTelemetry(payload) {
    try {
      // Use fire-and-forget approach for telemetry
      fetch('/api/v1/telemetry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      }).catch(err => {
        // Silently swallow fetch errors for telemetry to not interrupt user
        console.debug('Telemetry submission failed', err);
      });
      return true;
    } catch (error) {
      console.debug('Telemetry error', error);
      return false;
    }
  }
};
