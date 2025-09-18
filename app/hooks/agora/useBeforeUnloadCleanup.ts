'use client';

import { useEffect, useCallback, useRef } from 'react';
import { UserInformation } from '@/app/types/streams';
import useApi from '@/app/hooks/useAPi';
import {
  AGORA_API_CONFIGS,
  AGORA_LOG_PREFIXES,
} from '@/app/hooks/agora/configs';

interface BeforeUnloadCleanupOptions {
  localUser: UserInformation | null;
  isRtcJoined: boolean;
  isRtmChannelJoined: boolean;
  currentChannelName: string | null;
  current_room_id: string | null;
  leaveCallChannel: () => Promise<void>;
  leaveRtcChannel: () => Promise<void>;
  broadcastLocalFemaleStatusUpdate: (
    statusInfo: Partial<UserInformation>,
  ) => Promise<void>;
  enableVisibilityCleanup?: boolean;
  visibilityCleanupDelay?: number;
}

export const useBeforeUnloadCleanup = ({
  localUser,
  isRtcJoined,
  isRtmChannelJoined,
  currentChannelName,
  current_room_id,
  leaveCallChannel,
  leaveRtcChannel,
  broadcastLocalFemaleStatusUpdate,
  enableVisibilityCleanup = false,
  visibilityCleanupDelay = 30000,
}: BeforeUnloadCleanupOptions) => {
  const cleanupExecutedRef = useRef(false);
  const isCleaningUpRef = useRef(false);
  const visibilityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { execute: emergencyCleanupApi } = useApi<{
    success: boolean;
    message?: string;
  }>(
    '/api/agora/channels/emergency-cleanup',
    AGORA_API_CONFIGS.emergencyCleanup,
    false,
  );

  const performCleanup = useCallback(
    async (reason: 'beforeunload' | 'pagehide' | 'visibilitychange') => {
      if (isCleaningUpRef.current || cleanupExecutedRef.current) {
        return;
      }

      isCleaningUpRef.current = true;

      try {
        if (!localUser || (!isRtcJoined && !isRtmChannelJoined)) {
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem('channelHopping_in_progress');
            console.log(`${AGORA_LOG_PREFIXES.CLEANUP} 🧹 Bandera de channel hopping limpiada en ${reason}`);
          }
          return;
        }

        if (currentChannelName && localUser.role === 'female') {
          const cleanupData = {
            user_id: localUser.user_id,
            channel_name: currentChannelName,
            role: 'female',
            backend_action: 'close_channel_finished',
          };

          try {
            if (navigator.sendBeacon) {
              const blob = new Blob([JSON.stringify(cleanupData)], {
                type: 'application/json',
              });
              navigator.sendBeacon(
                '/api/agora/channels/emergency-cleanup',
                blob,
              );
            } else {
              console.log(
                `${AGORA_LOG_PREFIXES.CLEANUP} Emergency cleanup (fetch fallback) for user: ${localUser.user_id}`,
              );
              emergencyCleanupApi('/api/agora/channels/emergency-cleanup', {
                method: 'POST',
                body: cleanupData,
              }).catch((error) => {
                console.warn(
                  `${AGORA_LOG_PREFIXES.CLEANUP} Error con fetch fallback:`,
                  error,
                );
              });
            }
          } catch (error) {
            console.error(
              '[BeforeUnload] ❌ Error enviando limpieza de backend:',
              error,
            );
          }

          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        if (
          currentChannelName &&
          current_room_id &&
          localUser.role === 'male'
        ) {
          const cleanupData = {
            user_id: localUser.user_id,
            channel_name: currentChannelName,
            room_id: current_room_id,
            role: 'male',
            backend_action: 'close_channel_waiting_and_male',
          };

          try {
            if (navigator.sendBeacon) {
              const blob = new Blob([JSON.stringify(cleanupData)], {
                type: 'application/json',
              });
              navigator.sendBeacon(
                '/api/agora/channels/emergency-cleanup',
                blob,
              );
            } else {
              fetch('/api/agora/channels/emergency-cleanup', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(cleanupData),
                keepalive: true,
              }).catch((error) => {
                console.warn(
                  '[BeforeUnload] Error con fetch fallback para male:',
                  error,
                );
              });
            }
          } catch (error) {
            console.error(
              '[BeforeUnload] ❌ Error enviando limpieza de backend para male:',
              error,
            );
          }

          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        const cleanupPromises: Promise<void>[] = [];

        if (localUser.role === 'female') {
          cleanupPromises.push(
            broadcastLocalFemaleStatusUpdate({
              status: 'offline',
              in_call: 0,
              host_id: null,
              is_active: 0,
            }).catch((error) => {
              console.warn(
                '[BeforeUnload] Error actualizando estado female:',
                error,
              );
            }),
          );
        }

        if (isRtmChannelJoined) {
          cleanupPromises.push(
            leaveCallChannel().catch((error) => {
              console.warn('[BeforeUnload] Error cerrando canal RTM:', error);
            }),
          );
        }

        if (isRtcJoined) {
          cleanupPromises.push(
            leaveRtcChannel().catch((error) => {
              console.warn('[BeforeUnload] Error cerrando canal RTC:', error);
            }),
          );
        }

        await Promise.race([
          Promise.allSettled(cleanupPromises),
          new Promise((resolve) => setTimeout(resolve, 1000)),
        ]);

        cleanupExecutedRef.current = true;
      } catch (error) {
        console.error(
          `[BeforeUnload] Error durante limpieza por ${reason}:`,
          error,
        );
      } finally {
        isCleaningUpRef.current = false;
      }
    },
    [
      localUser,
      isRtcJoined,
      isRtmChannelJoined,
      currentChannelName,
      current_room_id,
      leaveCallChannel,
      leaveRtcChannel,
      broadcastLocalFemaleStatusUpdate,
    ],
  );

  useEffect(() => {
    if (!localUser || (!isRtcJoined && !isRtmChannelJoined)) {
      return;
    }

    const shouldActivateCleanup =
      (localUser.role === 'female' && currentChannelName && isRtcJoined) ||
      (localUser.role === 'male' && isRtcJoined);

    if (!shouldActivateCleanup) {
      return;
    }

    cleanupExecutedRef.current = false;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (currentChannelName && localUser?.role === 'female') {
        const cleanupData = {
          user_id: localUser.user_id,
          channel_name: currentChannelName,
          role: 'female',
          backend_action: 'close_channel_finished',
        };

        if (navigator.sendBeacon) {
          const blob = new Blob([JSON.stringify(cleanupData)], {
            type: 'application/json',
          });
          navigator.sendBeacon('/api/agora/channels/emergency-cleanup', blob);

          sessionStorage.setItem(
            `female_disconnected_${currentChannelName}`,
            Date.now().toString(),
          );
        } else {
          console.error(
            '[BeforeUnload] ⚠️ BEFOREUNLOAD: sendBeacon no disponible',
          );
        }
      }

      if (currentChannelName && current_room_id && localUser?.role === 'male') {
        const cleanupData = {
          user_id: localUser.user_id,
          channel_name: currentChannelName,
          room_id: current_room_id,
          role: 'male',
          backend_action: 'close_channel_waiting_and_male',
        };

        if (navigator.sendBeacon) {
          const blob = new Blob([JSON.stringify(cleanupData)], {
            type: 'application/json',
          });
          navigator.sendBeacon('/api/agora/channels/emergency-cleanup', blob);
        } else {
          console.log(
            `${AGORA_LOG_PREFIXES.CLEANUP} Emergency cleanup (fetch fallback) for male user: ${localUser.user_id}`,
          );
          emergencyCleanupApi('/api/agora/channels/emergency-cleanup', {
            method: 'POST',
            body: cleanupData,
          }).catch((error) => {
            console.warn(
              `${AGORA_LOG_PREFIXES.CLEANUP} Error con fetch fallback para male:`,
              error,
            );
          });
        }
      }

      if (localUser?.role === 'female' && typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('femaleDisconnectedFromCall', {
            detail: {
              femaleName: localUser.user_name || 'La modelo',
              femaleId: localUser.user_id,
              channelId: currentChannelName,
              reason: 'refresh',
            },
          }),
        );
      }

      performCleanup('beforeunload').catch((error) => {
        console.warn('[BeforeUnload] ⚠️ Error en limpieza asíncrona:', error);
      });
    };

    const handlePageHide = (event: PageTransitionEvent) => {
      if (!event.persisted) {
        if (currentChannelName && localUser?.role === 'female') {
          const cleanupData = {
            user_id: localUser.user_id,
            channel_name: currentChannelName,
            role: 'female',
            backend_action: 'close_channel_finished',
          };

          if (navigator.sendBeacon) {
            const blob = new Blob([JSON.stringify(cleanupData)], {
              type: 'application/json',
            });
            navigator.sendBeacon('/api/agora/channels/emergency-cleanup', blob);
          }
        }

        if (
          currentChannelName &&
          current_room_id &&
          localUser?.role === 'male'
        ) {
          const cleanupData = {
            user_id: localUser.user_id,
            channel_name: currentChannelName,
            room_id: current_room_id,
            role: 'male',
            backend_action: 'close_channel_waiting_and_male',
          };

          if (navigator.sendBeacon) {
            const blob = new Blob([JSON.stringify(cleanupData)], {
              type: 'application/json',
            });
            navigator.sendBeacon('/api/agora/channels/emergency-cleanup', blob);
          }
        }

        performCleanup('pagehide');
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (visibilityTimeoutRef.current) {
          clearTimeout(visibilityTimeoutRef.current);
        }

        visibilityTimeoutRef.current = setTimeout(() => {
          if (document.visibilityState === 'hidden') {
            performCleanup('visibilitychange');
          }
        }, visibilityCleanupDelay);
      } else if (document.visibilityState === 'visible') {
        if (visibilityTimeoutRef.current) {
          clearTimeout(visibilityTimeoutRef.current);
          visibilityTimeoutRef.current = null;
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);

    if (enableVisibilityCleanup) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      if (enableVisibilityCleanup) {
        document.removeEventListener(
          'visibilitychange',
          handleVisibilityChange,
        );
      }

      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
      }
    };
  }, [
    localUser,
    isRtcJoined,
    isRtmChannelJoined,
    currentChannelName,
    current_room_id,
    performCleanup,
    enableVisibilityCleanup,
    visibilityCleanupDelay,
  ]);

  const forceCleanup = useCallback(() => {
    cleanupExecutedRef.current = false;
    return performCleanup('beforeunload');
  }, [performCleanup]);

  return {
    forceCleanup,
    isCleaningUp: isCleaningUpRef.current,
    cleanupExecuted: cleanupExecutedRef.current,
  };
};
