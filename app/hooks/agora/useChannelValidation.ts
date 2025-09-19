import { useCallback, useRef } from 'react';
import { UserInformation } from '@/app/types/streams';
import useApi from '@/app/hooks/useAPi';
import {
  AGORA_API_CONFIGS,
  AGORA_LOG_PREFIXES,
} from '@/app/hooks/agora/configs';

interface ChannelValidationResult {
  isValid: boolean;
  reason?: string;
  shouldRetry?: boolean;
}

const connectionAttempts = new Map<
  string,
  { timestamp: number; userId: string }
>();
const ATTEMPT_COOLDOWN = 3000;

export const useChannelValidation = () => {
  const lastValidationRef = useRef<{
    channelId: string;
    timestamp: number;
  } | null>(null);

  const { execute: verifyChannelApi } = useApi<{
    available: boolean;
    reason?: string;
  }>('', AGORA_API_CONFIGS.channelVerification, false);

  const validateChannelAvailability = useCallback(
    async (
      targetChannel: string,
      currentUserId: string,
      onlineFemalesList: UserInformation[],
      authToken?: string,
    ): Promise<ChannelValidationResult> => {
      const now = Date.now();

      const lastAttempt = connectionAttempts.get(targetChannel);
      if (lastAttempt && now - lastAttempt.timestamp < ATTEMPT_COOLDOWN) {
        if (lastAttempt.userId !== currentUserId) {
          return {
            isValid: false,
            reason: 'Otro usuario está intentando conectarse a este canal.',
            shouldRetry: true,
          };
        }
      }

      connectionAttempts.set(targetChannel, {
        timestamp: now,
        userId: currentUserId,
      });

      const targetFemale = onlineFemalesList.find(
        (f) => f.host_id === targetChannel,
      );
      if (!targetFemale) {
        return {
          isValid: false,
          reason: 'El canal seleccionado ya no está disponible.',
          shouldRetry: false,
        };
      }

      if (targetFemale.status !== 'available_call') {
        return {
          isValid: false,
          reason:
            targetFemale.status === 'in_call'
              ? 'El canal ya está ocupado.'
              : 'La modelo no está disponible.',
          shouldRetry: targetFemale.status === 'in_call',
        };
      }

      if (authToken) {
        try {
          const url = `/api/agora/channels/verify-availability?host_id=${targetChannel}&user_id=${currentUserId}`;
          const verificationData = await verifyChannelApi(url, {
            headers: {
              Authorization: `Bearer ${authToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (verificationData && !verificationData.available) {
            return {
              isValid: false,
              reason: verificationData.reason || 'Canal no disponible.',
              shouldRetry: verificationData.reason?.includes('ocupado'),
            };
          }
        } catch (error: any) {
          console.warn(
            `${AGORA_LOG_PREFIXES.VERIFICATION} Error en verificación backend:`,
            error.message,
          );
        }
      }

      if (
        lastValidationRef.current?.channelId === targetChannel &&
        now - lastValidationRef.current.timestamp < 1000
      ) {
        return {
          isValid: false,
          reason: 'Validación muy frecuente. Espera un momento.',
          shouldRetry: true,
        };
      }

      lastValidationRef.current = { channelId: targetChannel, timestamp: now };

      return { isValid: true };
    },
    [],
  );

  const clearChannelAttempt = useCallback((channelId: string) => {
    connectionAttempts.delete(channelId);
  }, []);

  const getChannelAttemptInfo = useCallback((channelId: string) => {
    return connectionAttempts.get(channelId);
  }, []);

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
    cleanupOldAttempts,
  };
};
