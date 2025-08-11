export interface FetchWithTimeoutOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export async function fetchWithTimeout(
  url: string,
  options: FetchWithTimeoutOptions = {},
): Promise<Response> {
  const {
    timeout = 30000,
    retries = 2,
    retryDelay = 1000,
    ...fetchOptions
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  let lastError: Error;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      lastError = error as Error;

      if (attempt === retries) {
        clearTimeout(timeoutId);
        throw lastError;
      }

      if (retryDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  clearTimeout(timeoutId);
  throw lastError!;
}

export async function checkApiHealth(baseUrl: string): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(`${baseUrl}/health`, {
      method: 'GET',
      timeout: 5000,
      retries: 1,
    });
    return response.ok;
  } catch {
    return false;
  }
}
