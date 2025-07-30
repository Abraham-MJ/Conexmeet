import { useCallback, useRef } from 'react';
import { UserInformation } from '@/app/types/streams';

interface ChannelValidationResult {
  isValid: boolean;
  reason?: string;
  shouldRetry?: boolean;
}

// Cache local para tracking de intentos de conexión
const connectionAttempts = new Map<string, { timestamp: number; userId: string }>();
const ATTEMPT_COOLDOWN = 3000; // 3 segundos entre intentos al mismo canal

export const useChannelValidation = () => {
  const lastValidationRef = useRef<{ channelId: string; timestamp: number } | null>(null);

  const validateChannelAvailability = useCallback(
    async (
      targetChannel: string,
      currentUserId: string,
      onlineFemalesList: UserInformation[],
      authToken?: string
    ): Promise<ChannelValidationResult> => {
      const now = Date.now();

      // Validación 1: Cooldown local
      const lastAttempt = connectionAttempts.get(targetChannel);
      if (lastAttempt && now - lastAttempt.timestamp < ATTEMPT_COOLDOWN) {
        if (lastAttempt.userId !== currentUserId) {
          return {
            isValid: false,
            reason: 'Otro usuario está intentando conectarse a este canal.',
            shouldRetry: true
          };
        }
      }

      // Registrar intento actual
      connectionAttempts.set(targetChannel, {
        timestamp: now,
        userId: currentUserId
      });

      // Validación 2: Estado local de la lista
      const targetFemale = onlineFemalesList.find(f => f.host_id === targetChannel);
      if (!targetFemale) {
        return {
          isValid: false,
          reason: 'El canal seleccionado ya no está disponible.',
          shouldRetry: false
        };
      }

      if (targetFemale.status !== 'available_call') {
        return {
          isValid: false,
          reason: targetFemale.status === 'in_call' 
            ? 'El canal ya está ocupado.' 
            : 'La modelo no está disponible.',
          shouldRetry: targetFemale.status === 'in_call'
        };
      }

      // Validación 3: Verificación en tiempo real con el backend
      if (authToken) {
        try {
          const verificationResponse = await fetch(
            `/api/agora/channels/verify-availability?host_id=${targetChannel}&user_id=${currentUserId}`,
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (verificationResponse.ok) {
            const verificationData = await verificationResponse.json();
            if (!verificationData.available) {
              return {
                isValid: false,
                reason: verificationData.reason || 'Canal no disponible.',
                shouldRetry: verificationData.reason?.includes('ocupado')
              };
            }
          }
        } catch (error) {
          console.warn('[Channel Validation] Error en verificación backend:', error);
          // Continuar con validaciones locales si el backend falla
        }
      }

      // Validación 4: Prevenir validaciones muy frecuentes del mismo canal
      if (
        lastValidationRef.current?.channelId === targetChannel &&
        now - lastValidationRef.current.timestamp < 1000
      ) {
        return {
          isValid: false,
          reason: 'Validación muy frecuente. Espera un momento.',
          shouldRetry: true
        };
      }

      lastValidationRef.current = { channelId: targetChannel, timestamp: now };

      return { isValid: true };
    },
    []
  );

  const clearChannelAttempt = useCallback((channelId: string) => {
    connectionAttempts.delete(channelId);
  }, []);

  const getChannelAttemptInfo = useCallback((channelId: string) => {
    return connectionAttempts.get(channelId);
  }, []);

  // Limpiar intentos antiguos periódicamente
  const cleanupOldAttempts = useCallback(() => {
    const now = Date.now();
    for (const [channelId, attempt] of connectionAttempts.entries()) {
      if (now - attempt.timestamp > ATTEMPT_COOLDOWN * 2) {
        connectionAttempts.delete(channelId);
      }
    }
  }, []);

  return {
    validateChannelAvailability,
    clearChannelAttempt,
    getChannelAttemptInfo,
    cleanupOldAttempts
  };
};