export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  shouldRetry?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  shouldRetry: (error: any) => {
    return (
      error?.errorType === 'CHANNEL_BUSY' ||
      error?.message?.includes('CANAL_OCUPADO') ||
      error?.message?.includes('ocupado')
    );
  },
  onRetry: () => {},
};

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 0; attempt < opts.maxRetries; attempt++) {
    try {
      const result = await fn();
      if (attempt > 0) {
        console.log(`[Retry] ✅ Éxito después de ${attempt} reintentos`);
      }

      return result;
    } catch (error: any) {
      lastError = error;

      const shouldRetry = opts.shouldRetry(error);
      const isLastAttempt = attempt === opts.maxRetries - 1;

      if (!shouldRetry || isLastAttempt) {
        console.error(
          `[Retry] ❌ Error no recuperable o último intento (${attempt + 1}/${opts.maxRetries})`,
          error,
        );
        throw error;
      }

      const exponentialDelay = opts.baseDelay * Math.pow(2, attempt);
      const jitter = Math.random() * 0.3 * exponentialDelay;
      const delay = Math.min(exponentialDelay + jitter, opts.maxDelay);

      console.warn(
        `[Retry] ⚠️ Intento ${attempt + 1}/${opts.maxRetries} falló. Reintentando en ${Math.round(delay)}ms...`,
        error.message || error,
      );

      opts.onRetry(attempt + 1, error);

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

export async function retryChannelConnection<T>(
  fn: () => Promise<T>,
  channelId: string,
  userId: string | number,
): Promise<T> {
  return retryWithBackoff(fn, {
    maxRetries: 3,
    baseDelay: 1500,
    maxDelay: 5000,
    shouldRetry: (error: any) => {
      const isChannelBusy =
        error?.errorType === 'CHANNEL_BUSY' ||
        error?.message?.includes('CANAL_OCUPADO') ||
        error?.message?.includes('ocupado');

      const isChannelNotAvailable =
        error?.errorType === 'CHANNEL_NOT_AVAILABLE' ||
        error?.message?.includes('CANAL_NO_DISPONIBLE') ||
        error?.message?.includes('no disponible');

      return isChannelBusy && !isChannelNotAvailable;
    },
    onRetry: (attempt, error) => {
      console.log(
        `[Channel Retry] Usuario ${userId} reintentando conexión a canal ${channelId} (intento ${attempt})`,
      );
    },
  });
}

export async function retryRace<T>(
  fns: Array<() => Promise<T>>,
  options: RetryOptions = {},
): Promise<T> {
  const promises = fns.map((fn) => retryWithBackoff(fn, options));

  return Promise.race(promises);
}

export async function retryAll<T>(
  fns: Array<() => Promise<T>>,
  options: RetryOptions = {},
): Promise<T[]> {
  const promises = fns.map((fn) =>
    retryWithBackoff(fn, options).catch((error) => {
      console.warn('[Retry All] Una promesa falló:', error);
      return null as null;
    }),
  );

  const results = await Promise.all(promises);
  return results.filter(
    (result): result is NonNullable<typeof result> => result !== null,
  ) as T[];
}
