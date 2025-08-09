'use client';

import { useEffect, useRef, useCallback } from 'react';
import { UserInformation } from '@/app/types/streams';

interface ZombieChannelDetectorOptions {
  onlineFemalesList: UserInformation[];
  onZombieChannelDetected: (female: UserInformation) => void;
  enabled?: boolean;
  checkIntervalMs?: number;
}

export const useZombieChannelDetector = ({
  onlineFemalesList,
  onZombieChannelDetected,
  enabled = true,
  checkIntervalMs = 30000,
}: ZombieChannelDetectorOptions) => {
  const detectorIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<number>(Date.now());
  const isCheckingRef = useRef<boolean>(false);
  const mountedRef = useRef<boolean>(true);

  const onZombieChannelDetectedRef = useRef(onZombieChannelDetected);
  const onlineFemalesListRef = useRef(onlineFemalesList);
  const processedZombiesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (mountedRef.current) {
      onZombieChannelDetectedRef.current = onZombieChannelDetected;
      onlineFemalesListRef.current = onlineFemalesList;
    }
  }, [onZombieChannelDetected, onlineFemalesList]);

  const checkForZombieChannels = useCallback(async () => {
    if (!enabled || !mountedRef.current || isCheckingRef.current) {
      return;
    }

    const currentFemalesList = onlineFemalesListRef.current;
    if (!currentFemalesList || currentFemalesList.length === 0) {
      return;
    }

    isCheckingRef.current = true;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/agora/channels/heartbeat', {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(
          '[Zombie Detector] ⚠️ Error obteniendo heartbeats:',
          response.status,
        );
        return;
      }

      const heartbeatData = await response.json();
      const activeHeartbeats = heartbeatData.heartbeats || [];

      const activeChannels = new Set(
        activeHeartbeats.map((hb: any) => hb.channel_name),
      );

      const zombieChannels = currentFemalesList.filter((female) => {
        return (
          female.status === 'in_call' &&
          female.host_id &&
          !activeChannels.has(female.host_id) &&
          !processedZombiesRef.current.has(female.host_id)
        );
      });

      const femalesWithDisconnectedMales = currentFemalesList.filter(
        (female) => {
          if (female.status !== 'in_call' || !female.host_id) return false;

          const maleHeartbeatInChannel = activeHeartbeats.find(
            (hb: any) =>
              hb.channel_name === female.host_id && hb.role === 'male',
          );

          const isDisconnected =
            !maleHeartbeatInChannel &&
            !processedZombiesRef.current.has(`male_${female.host_id}`);

          return isDisconnected;
        },
      );

      if (zombieChannels.length > 0 && mountedRef.current) {
        zombieChannels.forEach((zombieFemale) => {
          if (!mountedRef.current) return;

          if (zombieFemale.host_id) {
            processedZombiesRef.current.add(zombieFemale.host_id);
          }

          if (mountedRef.current && onZombieChannelDetectedRef.current) {
            onZombieChannelDetectedRef.current(zombieFemale);
          }
        });
      }

      if (femalesWithDisconnectedMales.length > 0 && mountedRef.current) {
        femalesWithDisconnectedMales.forEach((femaleWithDisconnectedMale) => {
          if (!mountedRef.current) return;

          if (femaleWithDisconnectedMale.host_id) {
            processedZombiesRef.current.add(
              `male_${femaleWithDisconnectedMale.host_id}`,
            );
          }

          const maleDisconnectionEvent = {
            ...femaleWithDisconnectedMale,
            disconnectionType: 'male_disconnected' as const,
          };

          if (mountedRef.current && onZombieChannelDetectedRef.current) {
            onZombieChannelDetectedRef.current(maleDisconnectionEvent);
          }
        });
      }

      const currentChannelIds = new Set(
        currentFemalesList.filter((f) => f.host_id).map((f) => f.host_id!),
      );

      processedZombiesRef.current.forEach((channelId) => {
        if (!currentChannelIds.has(channelId)) {
          processedZombiesRef.current.delete(channelId);
        }
      });

      lastCheckRef.current = Date.now();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn(
          '[Zombie Detector] ⏰ Request timeout - saltando verificación',
        );
      } else {
        console.error(
          '[Zombie Detector] ❌ Error verificando canales zombie:',
          error,
        );
      }
    } finally {
      if (mountedRef.current) {
        isCheckingRef.current = false;
      }
    }
  }, [enabled]);

  useEffect(() => {
    mountedRef.current = true;

    if (!enabled) {
      if (detectorIntervalRef.current) {
        clearInterval(detectorIntervalRef.current);
        detectorIntervalRef.current = null;
      }
      return;
    }

    if (detectorIntervalRef.current || !mountedRef.current) {
      return;
    }

    const initialTimeout = setTimeout(() => {
      if (mountedRef.current) {
        checkForZombieChannels();
      }
    }, 5000);

    detectorIntervalRef.current = setInterval(() => {
      if (mountedRef.current) {
        checkForZombieChannels();
      }
    }, checkIntervalMs);

    const handleForceCheck = () => {
      if (mountedRef.current) {
        checkForZombieChannels();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('forceZombieCheck', handleForceCheck);
    }

    return () => {
      mountedRef.current = false;

      clearTimeout(initialTimeout);

      if (detectorIntervalRef.current) {
        clearInterval(detectorIntervalRef.current);
        detectorIntervalRef.current = null;
      }

      if (typeof window !== 'undefined') {
        window.removeEventListener('forceZombieCheck', handleForceCheck);
      }

      isCheckingRef.current = false;
    };
  }, [enabled, checkIntervalMs]);

  return {
    lastCheck: lastCheckRef.current,
    isActive: !!detectorIntervalRef.current,
    forceCheck: checkForZombieChannels,
  };
};
