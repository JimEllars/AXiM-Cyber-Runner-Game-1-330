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
      return 1.5;
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
      return { freeRunAvailable: true };
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
      fetch('/api/v1/telemetry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      }).catch(err => {
        console.debug('Telemetry submission failed', err);
      });
      return true;
    } catch (error) {
      console.debug('Telemetry error', error);
      return false;
    }
  },

  /**
   * Stubs fetching a claim signature for Web3 minting
   */
  async getClaimSignature(amount, walletAddress) {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      // Return a mock signature
      return "0xmocksignaturedeadbeef1234567890abcdef";
    } catch (error) {
      console.error('Claim Signature Error:', error);
      throw error;
    }
  }
};

/**
 * Submits general telemetry event to the Edge Bridge
 */
export const logTelemetryEvent = (type, payload) => {
  try {
    fetch('/api/v1/telemetry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, payload })
    }).catch(err => {
      console.debug('Telemetry submission failed', err);
    });
  } catch (error) {
    console.debug('Telemetry error', error);
  }
};
