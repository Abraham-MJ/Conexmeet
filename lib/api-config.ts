export const API_CONFIG = {
  BASE_URL: 'https://app.conexmeet.live/api/v1',
  TIMEOUTS: {
    DEFAULT: 15000,
    QUICK: 10000,
    LONG: 30000,
  },
  RETRIES: {
    DEFAULT: 2,
    QUICK: 1,
    CRITICAL: 3,
  },
} as const;

export async function isApiHealthy(): Promise<boolean> {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
