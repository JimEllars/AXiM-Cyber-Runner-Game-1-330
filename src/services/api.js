
let telemetryQueue = [];
let telemetryTimeout = null;

const flushTelemetry = () => {
  if (telemetryQueue.length === 0) return;

  const payload = [...telemetryQueue];
  telemetryQueue = [];

  if (telemetryTimeout) {
    clearTimeout(telemetryTimeout);
    telemetryTimeout = null;
  }

  if (!navigator.onLine) {
    const stored = JSON.parse(localStorage.getItem('axim_telemetry_queue') || '[]');
    const newStored = [...stored, ...payload].slice(-20); // Keep max 20
    localStorage.setItem('axim_telemetry_queue', JSON.stringify(newStored));
    return;
  }

  const sendData = (data) => {
    try {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/telemetry', blob);
      } else {
        fetch('/api/telemetry', {
          method: 'POST',
          body: blob,
          keepalive: true
        }).catch(() => {});
      }
    } catch (e) {
      console.debug('Telemetry flush error', e);
    }
  };

  sendData(payload);
};

const queueTelemetry = (type, payload) => {
  telemetryQueue.push({
    type,
    payload,
    timestamp: new Date().toISOString(),
    sessionId: sessionStorage.getItem('axim_session_id') || 'unknown',
    appVersion: '1.0.0'
  });

  if (telemetryQueue.length >= 5) {
    flushTelemetry();
  } else if (!telemetryTimeout) {
    telemetryTimeout = setTimeout(flushTelemetry, 5000);
  }
};

window.addEventListener('online', () => {
  const stored = JSON.parse(localStorage.getItem('axim_telemetry_queue') || '[]');
  if (stored.length > 0) {
    telemetryQueue = [...telemetryQueue, ...stored];
    localStorage.removeItem('axim_telemetry_queue');
    flushTelemetry();
  }
});

window.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    flushTelemetry();
  }
});

window.addEventListener('pagehide', () => {
  flushTelemetry();
});

// Setup session id
if (!sessionStorage.getItem('axim_session_id')) {
  sessionStorage.setItem('axim_session_id', Math.random().toString(36).substring(2, 15));
}

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
    if (!navigator.onLine) {
      // Offline: Queue the score
      const pendingScores = JSON.parse(localStorage.getItem('axim_pending_scores') || '[]');
      pendingScores.push(payload);
      localStorage.setItem('axim_pending_scores', JSON.stringify(pendingScores));
      console.log('Network offline, score queued locally.');
      // Return a mock success response to allow the game to transition to game over state
      return { success: true, queued: true };
    }

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
      // If fetch fails (e.g. timeout), also queue it
      console.error('Submission Error:', error);
      const pendingScores = JSON.parse(localStorage.getItem('axim_pending_scores') || '[]');
      pendingScores.push(payload);
      localStorage.setItem('axim_pending_scores', JSON.stringify(pendingScores));
      console.log('Submission failed, score queued locally.');
      return { success: true, queued: true }; // return success to unblock UI
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
    queueTelemetry('submit_telemetry', payload);
    return true;
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
  queueTelemetry(type, payload);
};
