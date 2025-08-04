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
  intervalMs = 15000, // 15 segundos por defecto
}: HeartbeatSystemOptions) => {
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastHeartbeatRef = useRef<number>(Date.now());
  const lastRequestRef = useRef<number>(0);

  const sendHeartbeat = useCallback(async () => {
    if (!localUser || !currentChannelName || !current_room_id) {
      console.log('[Heartbeat] ⚠️ Faltan datos para enviar heartbeat:', {
        hasUser: !!localUser,
        hasChannel: !!currentChannelName,
        hasRoomId: !!current_room_id
      });
      return;
    }

    // Rate limiting: no enviar más de 1 heartbeat por cada 10 segundos
    const now = Date.now();
    if (now - lastRequestRef.current < 10000) {
      console.log('[Heartbeat] ⏭️ Rate limited - saltando heartbeat');
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

      console.log(`[Heartbeat] 📤 Enviando heartbeat para ${localUser.role}:`, heartbeatData);

      const response = await fetch('/api/agora/channels/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(heartbeatData),
      });

      if (response.ok) {
        lastHeartbeatRef.current = Date.now();
        console.log(`[Heartbeat] ✅ ${localUser.role} heartbeat enviado correctamente`);
      } else {
        console.warn(`[Heartbeat] ⚠️ Error en respuesta para ${localUser.role}:`, response.status);
      }
    } catch (error) {
      console.error(`[Heartbeat] ❌ Error enviando heartbeat para ${localUser.role}:`, error);
    }
  }, [localUser, currentChannelName, current_room_id]);

  useEffect(() => {
    // Activar para females con canal activo O males en llamada
    const shouldActivate = enabled && localUser && isRtcJoined && currentChannelName && (
      (localUser.role === 'female') || // Females con canal
      (localUser.role === 'male')      // Males en llamada
    );

    if (!shouldActivate) {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      return;
    }

    console.log(`[Heartbeat] 🚀 Iniciando sistema de heartbeat para ${localUser.role} cada`, intervalMs, 'ms');

    // Enviar heartbeat inicial
    sendHeartbeat();

    // Configurar intervalo
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, intervalMs);

    return () => {
      if (heartbeatIntervalRef.current) {
        console.log(`[Heartbeat] 🛑 Deteniendo sistema de heartbeat para ${localUser.role}`);
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    };
  }, [enabled, localUser, isRtcJoined, currentChannelName, intervalMs, sendHeartbeat]);

  return {
    lastHeartbeat: lastHeartbeatRef.current,
    isActive: !!heartbeatIntervalRef.current,
  };
};