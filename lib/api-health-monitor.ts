class ApiHealthMonitor {
  private static instance: ApiHealthMonitor;
  private healthStatus: Map<string, { isHealthy: boolean; lastCheck: number }> =
    new Map();
  private readonly CHECK_INTERVAL = 60000;

  static getInstance(): ApiHealthMonitor {
    if (!ApiHealthMonitor.instance) {
      ApiHealthMonitor.instance = new ApiHealthMonitor();
    }
    return ApiHealthMonitor.instance;
  }

  async checkHealth(apiUrl: string): Promise<boolean> {
    const now = Date.now();
    const cached = this.healthStatus.get(apiUrl);

    if (cached && now - cached.lastCheck < this.CHECK_INTERVAL) {
      return cached.isHealthy;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(apiUrl, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const isHealthy = response.ok;

      this.healthStatus.set(apiUrl, {
        isHealthy,
        lastCheck: now,
      });

      return isHealthy;
    } catch {
      this.healthStatus.set(apiUrl, {
        isHealthy: false,
        lastCheck: now,
      });
      return false;
    }
  }

  getLastKnownStatus(apiUrl: string): boolean | null {
    const status = this.healthStatus.get(apiUrl);
    return status ? status.isHealthy : null;
  }
}

export const apiHealthMonitor = ApiHealthMonitor.getInstance();
