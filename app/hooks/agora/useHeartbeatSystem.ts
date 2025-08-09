'use client';

import { useEffect, useRef, useCallback } from 'react';
import { UserInformation } from '@/app/types/streams';

interface HeartbeatSystemOptions {
  localUser: UserInformation | null;
  isRtcJoined: boolean;
  currentChannelName: string | null;
  current_room_id: string | null;
  enabled?: boolean;
  intervalMs?: number;
}

export const useHeartbeatSystem = ({
  localUser,
  isRtcJoined,
  currentChannelName,
  current_room_id,
  enabled = true,
  intervalMs = 15000,
}: HeartbeatSystemOptions) => {
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastHeartbeatRef = useRef<number>(Date.now());
  const lastRequestRef = useRef<number>(0);

  const sendHeartbeat = useCallback(async () => {
    if (!localUser || !currentChannelName || !current_room_id) {
      return;
    }

    const now = Date.now();
    if (now - lastRequestRef.current < 10000) {
      return;
    }
    lastRequestRef.current = now;

    try {
      const heartbeatData = {
        user_id: localUser.user_id,
        channel_name: currentChannelName,
        room_id: current_room_id,
        role: localUser.role,
        timestamp: Date.now(),
      };

      const response = await fetch('/api/agora/channels/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(heartbeatData),
      });

      if (response.ok) {
        lastHeartbeatRef.current = Date.now();
      } else {
        console.warn(
          `[Heartbeat] ⚠️ Error en respuesta para ${localUser.role}:`,
          response.status,
        );
      }
    } catch (error) {
      console.error(
        `[Heartbeat] ❌ Error enviando heartbeat para ${localUser.role}:`,
        error,
      );
    }
  }, [localUser, currentChannelName, current_room_id]);

  useEffect(() => {
    const shouldActivate =
      enabled &&
      localUser &&
      isRtcJoined &&
      currentChannelName &&
      (localUser.role === 'female' || localUser.role === 'male');

    if (!shouldActivate) {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      return;
    }

    sendHeartbeat();

    heartbeatIntervalRef.current = setInterval(sendHeartbeat, intervalMs);

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    };
  }, [
    enabled,
    localUser,
    isRtcJoined,
    currentChannelName,
    intervalMs,
    sendHeartbeat,
  ]);

  return {
    lastHeartbeat: lastHeartbeatRef.current,
    isActive: !!heartbeatIntervalRef.current,
  };
};
