'use client';

import { useEffect, useRef, useCallback } from 'react';
import { UserInformation } from '@/app/types/streams';

interface OptimizedHeartbeatOptions {
  localUser: UserInformation | null;
  isRtcJoined: boolean;
  currentChannelName: string | null;
  current_room_id: string | null;
  onlineFemalesList: UserInformation[];
  onZombieDetected: (zombie: UserInformation) => void;
  enabled?: boolean;
  intervalMs?: number;
}

export const useOptimizedHeartbeat = ({
  localUser,
  isRtcJoined,
  currentChannelName,
  current_room_id,
  onlineFemalesList,
  onZombieDetected,
  enabled = true,
  intervalMs = 30000,
}: OptimizedHeartbeatOptions) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastHeartbeatRef = useRef<number>(Date.now());
  const lastRequestRef = useRef<number>(0);

  const onlineFemalesListRef = useRef(onlineFemalesList);
  const onZombieDetectedRef = useRef(onZombieDetected);

  onlineFemalesListRef.current = onlineFemalesList;
  onZombieDetectedRef.current = onZombieDetected;

  const sendHeartbeatAndCheck = useCallback(async () => {
    const now = Date.now();

    if (now - lastRequestRef.current < 45000) {
      return;
    }
    lastRequestRef.current = now;

    try {
      if (localUser && currentChannelName && current_room_id && isRtcJoined) {
        const heartbeatData = {
          user_id: localUser.user_id,
          channel_name: currentChannelName,
          room_id: current_room_id,
          role: localUser.role,
          timestamp: now,
        };

        const response = await fetch('/api/agora/channels/heartbeat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(heartbeatData),
        });

        if (response.ok) {
          lastHeartbeatRef.current = now;
          const heartbeatData = await response.json();
          const activeHeartbeats = heartbeatData.heartbeats || [];

          const backendChannels: any[] = [];

          const activeChannels = new Set(
            activeHeartbeats.map((hb: any) => hb.channel_name),
          );

          const zombieChannels = onlineFemalesListRef.current.filter(
            (female) => {
              const hasChannel = !!female.host_id;
              const hasHeartbeat = female.host_id
                ? activeChannels.has(female.host_id)
                : false;
              const isInCall = female.status === 'in_call';

              return isInCall && hasChannel && !hasHeartbeat;
            },
          );

          const orphanedBackendChannels = backendChannels.filter((channel) => {
            const hasHeartbeat = activeChannels.has(channel.host_id);
            const isWaitingOrInCall =
              channel.status === 'waiting' || channel.status === 'in_call';

            return isWaitingOrInCall && !hasHeartbeat;
          });

          const orphanedZombies = orphanedBackendChannels.map((channel) => {
            const femaleInList = onlineFemalesListRef.current.find(
              (f) => f.user_id === channel.user_id,
            );

            return {
              user_id: channel.user_id,
              user_name: femaleInList?.user_name || `User ${channel.user_id}`,
              host_id: channel.host_id,
              status: 'offline' as const,
              avatar: femaleInList?.avatar || undefined,
              role: 'female' as const,
              rtcUid: channel.user_id,
              rtmUid: channel.user_id,
              is_active: 0 as 0,
              in_call: 0 as 0,
            };
          });

          const femalesWithDisconnectedMales =
            onlineFemalesListRef.current.filter((female) => {
              if (female.status !== 'in_call' || !female.host_id) return false;

              const maleHeartbeatInChannel = activeHeartbeats.find(
                (hb: any) =>
                  hb.channel_name === female.host_id && hb.role === 'male',
              );

              if (!maleHeartbeatInChannel) {
                const femaleHeartbeat = activeHeartbeats.find(
                  (hb: any) =>
                    hb.channel_name === female.host_id && hb.role === 'female',
                );

                if (femaleHeartbeat) {
                  const timeSinceLastFemaleHeartbeat =
                    now - femaleHeartbeat.lastSeen;
                  return timeSinceLastFemaleHeartbeat < 60000;
                }
              }

              return false;
            });

          zombieChannels.forEach((zombie) => {
            onZombieDetectedRef.current(zombie);
          });

          orphanedZombies.forEach((zombie) => {
            onZombieDetectedRef.current(zombie);
          });

          femalesWithDisconnectedMales.forEach((female) => {
            onZombieDetectedRef.current({
              ...female,
              disconnectionType: 'male_disconnected',
            } as any);
          });
        } else {
          console.warn(
            '[OptimizedHeartbeat] ⚠️ Error en heartbeat:',
            response.status,
          );
        }
      } else {
        if (now - lastHeartbeatRef.current > 120000) {
          const heartbeatResponse = await fetch(
            '/api/agora/channels/heartbeat',
          );
          if (heartbeatResponse.ok) {
            const heartbeatData = await heartbeatResponse.json();
            const activeHeartbeats = heartbeatData.heartbeats || [];

            const zombieChannels = onlineFemalesListRef.current.filter(
              (female) => {
                const hasChannel = !!female.host_id;
                const hasHeartbeat = female.host_id
                  ? activeHeartbeats.some(
                      (hb: any) => hb.channel_name === female.host_id,
                    )
                  : false;
                const isInCall = female.status === 'in_call';

                return isInCall && hasChannel && !hasHeartbeat;
              },
            );

            zombieChannels.forEach((zombie) => {
              onZombieDetectedRef.current(zombie);
            });

            lastHeartbeatRef.current = now;
          }
        }
      }
    } catch (error) {
      console.error(
        '[OptimizedHeartbeat] ❌ Error en heartbeat optimizado:',
        error,
      );
    }
  }, [localUser, currentChannelName, current_room_id, isRtcJoined]);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const executeHeartbeat = () => {
      sendHeartbeatAndCheck().catch((error) => {
        console.error('[OptimizedHeartbeat] Error en ejecución:', error);
      });
    };

    setTimeout(executeHeartbeat, 5000);

    intervalRef.current = setInterval(
      executeHeartbeat,
      Math.max(intervalMs, 60000),
    );

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, intervalMs]);

  return {
    lastHeartbeat: lastHeartbeatRef.current,
    isActive: !!intervalRef.current,
  };
};
