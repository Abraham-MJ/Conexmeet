import { retryChannelConnection } from '@/lib/retry-with-backoff';
import {
  connectionMonitor,
  monitoredConnection,
  measureConnectionTime,
} from '@/lib/connection-monitor';
import { deduplicateRequest } from '@/lib/requestDeduplication';

interface BackendConnectionOptions {
  userId: string | number;
  hostId: string;
  maxRetries?: number;
  enableMonitoring?: boolean;
}

export async function connectToChannelWithRetry(
  apiFunction: (url: string, options: any) => Promise<any>,
  options: BackendConnectionOptions,
): Promise<{
  success: boolean;
  message?: string;
  data?: any;
  errorType?: string;
}> {
  const { userId, hostId, maxRetries = 3, enableMonitoring = true } = options;

  const timer = measureConnectionTime();

  if (enableMonitoring) {
    connectionMonitor.logConnectionAttempt(userId, hostId, 'attempting');
  }

  try {
    const result = await retryChannelConnection(
      async () => {
        const requestOptions = {
          method: 'POST' as const,
          body: {
            user_id: userId,
            host_id: hostId,
          },
        };

        const response = await deduplicateRequest(
          '/api/agora/channels/enter-channel-male',
          () =>
            apiFunction(
              '/api/agora/channels/enter-channel-male',
              requestOptions,
            ),
          requestOptions,
        );

        if (!response.success) {
          const error: any = new Error(response.message || 'Connection failed');
          error.errorType = response.errorType;
          error.message = response.message;
          throw error;
        }

        return response;
      },
      hostId,
      userId,
    );

    if (enableMonitoring) {
      const duration = timer.end();
      connectionMonitor.logConnectionAttempt(
        userId,
        hostId,
        'success',
        undefined,
        undefined,
        duration,
      );
    }

    return result;
  } catch (error: any) {
    if (enableMonitoring) {
      const duration = timer.end();
      connectionMonitor.logConnectionAttempt(
        userId,
        hostId,
        'failed',
        error.errorType,
        error.message,
        duration,
      );
    }

    throw error;
  }
}

export async function findAvailableChannel(
  apiFunction: (url: string, options: any) => Promise<any>,
  userId: string | number,
  candidateChannels: string[],
  maxAttempts: number = 5,
): Promise<{
  success: boolean;
  channelId?: string;
  data?: any;
  message?: string;
}> {
  const attemptedChannels = new Set<string>();
  let lastError: any;

  console.log(
    `[Find Available Channel] Buscando canal disponible entre ${candidateChannels.length} candidatos para usuario ${userId}`,
  );

  for (
    let attempt = 0;
    attempt < maxAttempts && attempt < candidateChannels.length;
    attempt++
  ) {
    const remainingChannels = candidateChannels.filter(
      (channelId) => !attemptedChannels.has(channelId),
    );

    if (remainingChannels.length === 0) {
      console.warn('[Find Available Channel] No quedan canales por intentar');
      break;
    }

    const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;
    const now = Date.now();
    
    const timeSeed = now % 1000;
    const seed = userIdNum + timeSeed;
    
    const deterministicIndex = (seed + attempt * 7) % remainingChannels.length;
    const candidateChannelId = remainingChannels[deterministicIndex];

    attemptedChannels.add(candidateChannelId);

    console.log(
      `[Find Available Channel] Usuario ${userId}, Intento ${attempt + 1}/${maxAttempts}: Selección determinística [${deterministicIndex}/${remainingChannels.length - 1}] → ${candidateChannelId}`,
    );

    try {
      const result = await connectToChannelWithRetry(apiFunction, {
        userId,
        hostId: candidateChannelId,
        maxRetries: 2,
        enableMonitoring: true,
      });

      if (result.success) {
        console.log(
          `[Find Available Channel] ✅ Canal encontrado: ${candidateChannelId}`,
        );
        return {
          success: true,
          channelId: candidateChannelId,
          data: result.data,
          message: result.message,
        };
      }
    } catch (error: any) {
      lastError = error;
      console.warn(
        `[Find Available Channel] ❌ Canal ${candidateChannelId} no disponible: ${error.message}`,
      );

      if (
        error.errorType === 'CHANNEL_NOT_AVAILABLE' ||
        error.message?.includes('no disponible')
      ) {
        continue;
      }

      if (
        error.errorType === 'CHANNEL_BUSY' ||
        error.message?.includes('ocupado')
      ) {
        continue;
      }

      continue;
    }
  }

  console.error(
    '[Find Available Channel] ❌ No se encontró ningún canal disponible después de todos los intentos',
  );

  return {
    success: false,
    message:
      lastError?.message ||
      'No hay canales disponibles en este momento. Intenta más tarde.',
  };
}

export async function validateAndReserveChannel(
  apiFunction: (url: string, options: any) => Promise<any>,
  userId: string | number,
  channelId: string,
  validateFn: (
    channelId: string,
    userId: string,
    onlineFemalesList: any[],
  ) => Promise<{ isValid: boolean; reason?: string }>,
  onlineFemalesList: any[],
): Promise<{
  success: boolean;
  data?: any;
  message?: string;
}> {
  console.log(
    `[Validate And Reserve] Validando canal ${channelId} para usuario ${userId}`,
  );

  const validationResult = await validateFn(
    channelId,
    String(userId),
    onlineFemalesList,
  );

  if (!validationResult.isValid) {
    console.warn(
      `[Validate And Reserve] ❌ Validación local falló: ${validationResult.reason}`,
    );
    return {
      success: false,
      message: validationResult.reason || 'Canal no disponible',
    };
  }

  try {
    const result = await connectToChannelWithRetry(apiFunction, {
      userId,
      hostId: channelId,
      maxRetries: 3,
      enableMonitoring: true,
    });

    return result;
  } catch (error: any) {
    console.error(
      `[Validate And Reserve] ❌ Error reservando canal: ${error.message}`,
    );
    return {
      success: false,
      message: error.message || 'Error al reservar el canal',
    };
  }
}

export function detectRaceCondition(
  channelId: string,
  expectedUserId: string | number,
  actualUserId: string | number,
  context: string = 'unknown',
): void {
  if (expectedUserId !== actualUserId) {
    console.error(`[Race Condition] 🚨 Detectada en ${context}`, {
      canal: channelId,
      usuarioEsperado: expectedUserId,
      usuarioActual: actualUserId,
    });

    connectionMonitor.logRaceCondition(
      channelId,
      expectedUserId,
      actualUserId,
      'frontend',
      context,
    );
  }
}

export function printConnectionReport(): void {
  connectionMonitor.printReport();

  const warnings = connectionMonitor.detectSuspiciousPatterns();
  if (warnings.length > 0) {
    console.warn('\n⚠️ PATRONES SOSPECHOSOS DETECTADOS:');
    warnings.forEach((warning) => console.warn(warning));
  }
}

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).printConnectionReport = printConnectionReport;
  console.log(
    '[Connection Helpers] 🔍 Usa window.printConnectionReport() para ver estadísticas',
  );
}
