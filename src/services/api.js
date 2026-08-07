/**
 * AXiM Cyber-Runner API Service
 * Handles communication with the Cloudflare Edge Worker
 */

const API_BASE = '/api/v1/runner';

export const runnerApi = {
  /**
   * Checks if the user has a free run available for today
   */
  async getTicketStatus(address) {
    try {
      const response = await fetch(`${API_BASE}/ticket-status?address=${address}`);
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
      const response = await fetch(`${API_BASE}/submit-run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
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