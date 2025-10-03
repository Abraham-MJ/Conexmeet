/**
 * Sistema de Optimistic Locking para Channel Hopping
 * Previene que múltiples males se conecten al mismo canal simultáneamente
 */

interface ChannelLock {
  userId: string | number;
  timestamp: number;
  lockId: string;
  channelId: string;
}

const LOCK_TIMEOUT = 15000; // 15 segundos
const LOCK_PREFIX = 'channel_lock_';
const CLEANUP_INTERVAL = 5000; // Limpiar cada 5 segundos

/**
 * Genera un ID único para el lock
 */
const generateLockId = (userId: string | number): string => {
  return `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Intenta adquirir un lock optimista para un canal
 */
export const tryAcquireChannelLock = (
  channelId: string,
  userId: string | number,
): { success: boolean; lockId?: string } => {
  if (typeof window === 'undefined') {
    return { success: false };
  }

  const lockKey = `${LOCK_PREFIX}${channelId}`;
  const now = Date.now();

  try {
    // Verificar si ya existe un lock válido
    const existingLockStr = localStorage.getItem(lockKey);
    if (existingLockStr) {
      const existingLock: ChannelLock = JSON.parse(existingLockStr);

      // Si el lock no ha expirado y es de otro usuario, fallar
      if (
        now - existingLock.timestamp < LOCK_TIMEOUT &&
        existingLock.userId !== userId
      ) {
        console.log(
          `[Channel Lock] ❌ Canal ${channelId} ya está bloqueado por usuario ${existingLock.userId}`,
        );
        return { success: false };
      }

      // Si es nuestro lock y aún es válido, renovarlo
      if (
        existingLock.userId === userId &&
        now - existingLock.timestamp < LOCK_TIMEOUT
      ) {
        const renewedLock: ChannelLock = {
          ...existingLock,
          timestamp: now,
        };
        localStorage.setItem(lockKey, JSON.stringify(renewedLock));
        console.log(
          `[Channel Lock] 🔄 Lock renovado para canal ${channelId} por usuario ${userId}`,
        );
        return { success: true, lockId: existingLock.lockId };
      }
    }

    // Crear nuevo lock
    const lockId = generateLockId(userId);
    const newLock: ChannelLock = {
      userId,
      timestamp: now,
      lockId,
      channelId,
    };

    localStorage.setItem(lockKey, JSON.stringify(newLock));
    console.log(
      `[Channel Lock] ✅ Lock adquirido para canal ${channelId} por usuario ${userId} (${lockId})`,
    );

    return { success: true, lockId };
  } catch (error) {
    console.error('[Channel Lock] ❌ Error adquiriendo lock:', error);
    return { success: false };
  }
};

/**
 * Verifica si aún tenemos un lock válido
 */
export const hasValidChannelLock = (
  channelId: string,
  userId: string | number,
  lockId: string,
): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  const lockKey = `${LOCK_PREFIX}${channelId}`;

  try {
    const lockStr = localStorage.getItem(lockKey);
    if (!lockStr) {
      return false;
    }

    const lock: ChannelLock = JSON.parse(lockStr);
    const now = Date.now();

    // Verificar que sea nuestro lock, no haya expirado y el lockId coincida
    const isValid =
      lock.userId === userId &&
      lock.lockId === lockId &&
      now - lock.timestamp < LOCK_TIMEOUT;

    if (!isValid) {
      console.log(
        `[Channel Lock] ❌ Lock inválido para canal ${channelId}: userId=${lock.userId}, lockId=${lock.lockId}, age=${now - lock.timestamp}ms`,
      );
    }

    return isValid;
  } catch (error) {
    console.error('[Channel Lock] ❌ Error verificando lock:', error);
    return false;
  }
};

/**
 * Libera un lock específico
 */
export const releaseChannelLock = (
  channelId: string,
  userId: string | number,
  lockId: string,
): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  const lockKey = `${LOCK_PREFIX}${channelId}`;

  try {
    const lockStr = localStorage.getItem(lockKey);
    if (!lockStr) {
      return true; // Ya no existe
    }

    const lock: ChannelLock = JSON.parse(lockStr);

    // Solo liberar si es nuestro lock
    if (lock.userId === userId && lock.lockId === lockId) {
      localStorage.removeItem(lockKey);
      console.log(
        `[Channel Lock] 🔓 Lock liberado para canal ${channelId} por usuario ${userId}`,
      );
      return true;
    }

    console.warn(
      `[Channel Lock] ⚠️ Intento de liberar lock ajeno: canal=${channelId}, nuestroUser=${userId}, lockUser=${lock.userId}`,
    );
    return false;
  } catch (error) {
    console.error('[Channel Lock] ❌ Error liberando lock:', error);
    return false;
  }
};

/**
 * Limpia todos los locks expirados
 */
export const cleanupExpiredLocks = (): number => {
  if (typeof window === 'undefined') {
    return 0;
  }

  let cleanedCount = 0;
  const now = Date.now();

  try {
    // Iterar sobre todas las keys de localStorage
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(LOCK_PREFIX)) {
        continue;
      }

      const lockStr = localStorage.getItem(key);
      if (!lockStr) {
        continue;
      }

      try {
        const lock: ChannelLock = JSON.parse(lockStr);

        // Si el lock ha expirado, eliminarlo
        if (now - lock.timestamp >= LOCK_TIMEOUT) {
          localStorage.removeItem(key);
          cleanedCount++;
          console.log(
            `[Channel Lock] 🧹 Lock expirado limpiado: canal=${lock.channelId}, usuario=${lock.userId}`,
          );
        }
      } catch (parseError) {
        // Si no se puede parsear, eliminar la key corrupta
        localStorage.removeItem(key);
        cleanedCount++;
        console.warn(`[Channel Lock] 🧹 Lock corrupto eliminado: ${key}`);
      }
    }
  } catch (error) {
    console.error('[Channel Lock] ❌ Error en limpieza de locks:', error);
  }

  if (cleanedCount > 0) {
    console.log(
      `[Channel Lock] 🧹 Limpieza completada: ${cleanedCount} locks eliminados`,
    );
  }

  return cleanedCount;
};

/**
 * Inicia el proceso de limpieza automática
 */
export const startLockCleanupProcess = (): (() => void) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const intervalId = setInterval(() => {
    cleanupExpiredLocks();
  }, CLEANUP_INTERVAL);

  console.log('[Channel Lock] 🚀 Proceso de limpieza automática iniciado');

  // Retornar función para detener el proceso
  return () => {
    clearInterval(intervalId);
    console.log('[Channel Lock] 🛑 Proceso de limpieza automática detenido');
  };
};

/**
 * Obtiene información de todos los locks activos (para debugging)
 */
export const getActiveLocks = (): ChannelLock[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  const locks: ChannelLock[] = [];
  const now = Date.now();

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(LOCK_PREFIX)) {
        continue;
      }

      const lockStr = localStorage.getItem(key);
      if (!lockStr) {
        continue;
      }

      try {
        const lock: ChannelLock = JSON.parse(lockStr);

        // Solo incluir locks no expirados
        if (now - lock.timestamp < LOCK_TIMEOUT) {
          locks.push(lock);
        }
      } catch (parseError) {
        console.warn(`[Channel Lock] ⚠️ Lock corrupto encontrado: ${key}`);
      }
    }
  } catch (error) {
    console.error('[Channel Lock] ❌ Error obteniendo locks activos:', error);
  }

  return locks;
};
