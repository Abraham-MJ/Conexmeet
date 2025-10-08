export interface ConnectionAttempt {
  userId: string | number;
  channelId: string;
  timestamp: number;
  status: 'attempting' | 'success' | 'failed' | 'race_condition';
  errorType?: string;
  errorMessage?: string;
  duration?: number;
}

export interface RaceConditionEvent {
  channelId: string;
  user1: string | number;
  user2: string | number;
  timestamp: number;
  detectedAt: 'frontend' | 'backend';
  context?: string;
}

export interface ConnectionMetrics {
  totalAttempts: number;
  successfulConnections: number;
  failedConnections: number;
  raceConditionsDetected: number;
  averageConnectionTime: number;
  channelBusyErrors: number;
  channelNotAvailableErrors: number;
}

class ConnectionMonitorService {
  private attempts: ConnectionAttempt[] = [];
  private raceConditions: RaceConditionEvent[] = [];
  private maxHistorySize = 100;

  logConnectionAttempt(
    userId: string | number,
    channelId: string,
    status: ConnectionAttempt['status'],
    errorType?: string,
    errorMessage?: string,
    duration?: number,
  ): void {
    const attempt: ConnectionAttempt = {
      userId,
      channelId,
      timestamp: Date.now(),
      status,
      errorType,
      errorMessage,
      duration,
    };

    this.attempts.push(attempt);

    if (this.attempts.length > this.maxHistorySize) {
      this.attempts.shift();
    }

    const emoji = this.getStatusEmoji(status);
    const durationStr = duration ? ` (${duration}ms)` : '';

    console.log(
      `[Connection Monitor] ${emoji} Usuario ${userId} → Canal ${channelId}: ${status}${durationStr}`,
      errorMessage ? `- ${errorMessage}` : '',
    );

    if (process.env.NODE_ENV === 'production' && status === 'failed') {
      this.sendToExternalMonitoring(attempt);
    }
  }

  logRaceCondition(
    channelId: string,
    user1: string | number,
    user2: string | number,
    detectedAt: 'frontend' | 'backend',
    context?: string,
  ): void {
    const event: RaceConditionEvent = {
      channelId,
      user1,
      user2,
      timestamp: Date.now(),
      detectedAt,
      context,
    };

    this.raceConditions.push(event);

    if (this.raceConditions.length > this.maxHistorySize) {
      this.raceConditions.shift();
    }

    console.error(
      `[Connection Monitor] 🚨 RACE CONDITION DETECTADA en ${detectedAt}`,
      {
        canal: channelId,
        usuario1: user1,
        usuario2: user2,
        contexto: context,
        timestamp: new Date(event.timestamp).toISOString(),
      },
    );

    if (process.env.NODE_ENV === 'production') {
      this.sendRaceConditionAlert(event);
    }
  }

  getMetrics(): ConnectionMetrics {
    const totalAttempts = this.attempts.length;
    const successfulConnections = this.attempts.filter(
      (a) => a.status === 'success',
    ).length;
    const failedConnections = this.attempts.filter(
      (a) => a.status === 'failed',
    ).length;
    const raceConditionsDetected = this.raceConditions.length;

    const successfulWithDuration = this.attempts.filter(
      (a) => a.status === 'success' && a.duration,
    );
    const averageConnectionTime =
      successfulWithDuration.length > 0
        ? successfulWithDuration.reduce(
            (sum, a) => sum + (a.duration || 0),
            0,
          ) / successfulWithDuration.length
        : 0;

    const channelBusyErrors = this.attempts.filter(
      (a) => a.errorType === 'CHANNEL_BUSY',
    ).length;
    const channelNotAvailableErrors = this.attempts.filter(
      (a) => a.errorType === 'CHANNEL_NOT_AVAILABLE',
    ).length;

    return {
      totalAttempts,
      successfulConnections,
      failedConnections,
      raceConditionsDetected,
      averageConnectionTime: Math.round(averageConnectionTime),
      channelBusyErrors,
      channelNotAvailableErrors,
    };
  }

  getRecentAttempts(limit: number = 10): ConnectionAttempt[] {
    return this.attempts.slice(-limit);
  }

  getRecentRaceConditions(limit: number = 10): RaceConditionEvent[] {
    return this.raceConditions.slice(-limit);
  }

  clearHistory(): void {
    this.attempts = [];
    this.raceConditions = [];
    console.log('[Connection Monitor] Historial limpiado');
  }

  printReport(): void {
    const metrics = this.getMetrics();
    const successRate =
      metrics.totalAttempts > 0
        ? (
            (metrics.successfulConnections / metrics.totalAttempts) *
            100
          ).toFixed(1)
        : 0;

    console.log('\n========== CONNECTION MONITOR REPORT ==========');
    console.log(`Total de intentos: ${metrics.totalAttempts}`);
    console.log(`Conexiones exitosas: ${metrics.successfulConnections}`);
    console.log(`Conexiones fallidas: ${metrics.failedConnections}`);
    console.log(`Tasa de éxito: ${successRate}%`);
    console.log(
      `Tiempo promedio de conexión: ${metrics.averageConnectionTime}ms`,
    );
    console.log(`\nErrores:`);
    console.log(`  - Canal ocupado: ${metrics.channelBusyErrors}`);
    console.log(
      `  - Canal no disponible: ${metrics.channelNotAvailableErrors}`,
    );
    console.log(
      `\n🚨 Race conditions detectadas: ${metrics.raceConditionsDetected}`,
    );
    console.log('===============================================\n');
  }


  detectSuspiciousPatterns(): string[] {
    const warnings: string[] = [];
    const metrics = this.getMetrics();

    if (
      metrics.totalAttempts > 10 &&
      metrics.raceConditionsDetected / metrics.totalAttempts > 0.05
    ) {
      warnings.push(
        `⚠️ Tasa de race conditions alta: ${((metrics.raceConditionsDetected / metrics.totalAttempts) * 100).toFixed(1)}%`,
      );
    }

    if (
      metrics.totalAttempts > 10 &&
      metrics.channelBusyErrors / metrics.totalAttempts > 0.3
    ) {
      warnings.push(
        `⚠️ Muchos errores de canal ocupado: ${((metrics.channelBusyErrors / metrics.totalAttempts) * 100).toFixed(1)}%`,
      );
    }

    if (metrics.averageConnectionTime > 5000) {
      warnings.push(
        `⚠️ Tiempo de conexión promedio muy alto: ${metrics.averageConnectionTime}ms`,
      );
    }

    const successRate =
      metrics.totalAttempts > 0
        ? (metrics.successfulConnections / metrics.totalAttempts) * 100
        : 100;
    if (metrics.totalAttempts > 10 && successRate < 70) {
      warnings.push(`⚠️ Tasa de éxito baja: ${successRate.toFixed(1)}%`);
    }

    return warnings;
  }

  private getStatusEmoji(status: ConnectionAttempt['status']): string {
    switch (status) {
      case 'attempting':
        return '🔄';
      case 'success':
        return '✅';
      case 'failed':
        return '❌';
      case 'race_condition':
        return '🚨';
      default:
        return '❓';
    }
  }

  private sendToExternalMonitoring(attempt: ConnectionAttempt): void {
    // Aquí integrarías con Sentry, DataDog, etc.
    // Ejemplo con Sentry:
    // Sentry.captureMessage('Connection failed', {
    //   level: 'warning',
    //   extra: attempt,
    // });
  }

  private sendRaceConditionAlert(event: RaceConditionEvent): void {
    // Aquí enviarías alertas críticas
    // Ejemplo con Sentry:
    // Sentry.captureException(new Error('Race condition detected'), {
    //   level: 'error',
    //   extra: event,
    // });
  }
}

// Singleton instance
export const connectionMonitor = new ConnectionMonitorService();

// Exponer en window para debugging en desarrollo
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).connectionMonitor = connectionMonitor;
  console.log(
    '[Connection Monitor] 🔍 Disponible en window.connectionMonitor para debugging',
  );
}

/**
 * Hook para medir el tiempo de una operación
 */
export function measureConnectionTime() {
  const startTime = Date.now();

  return {
    end: () => Date.now() - startTime,
  };
}

/**
 * Wrapper para funciones de conexión con monitoreo automático
 */
export async function monitoredConnection<T>(
  userId: string | number,
  channelId: string,
  connectionFn: () => Promise<T>,
): Promise<T> {
  const timer = measureConnectionTime();

  connectionMonitor.logConnectionAttempt(userId, channelId, 'attempting');

  try {
    const result = await connectionFn();
    const duration = timer.end();

    connectionMonitor.logConnectionAttempt(
      userId,
      channelId,
      'success',
      undefined,
      undefined,
      duration,
    );

    return result;
  } catch (error: any) {
    const duration = timer.end();

    connectionMonitor.logConnectionAttempt(
      userId,
      channelId,
      'failed',
      error.errorType,
      error.message,
      duration,
    );

    throw error;
  }
}
