/**
 * AXiM Cyber-Runner API Service
 * Handles communication with the Cloudflare Edge Worker
 */

const API_BASE = '/api/v1/runner';

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
      const response = await fetchWithTimeout(`${API_BASE}/submit-run`, {
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
  }
};
