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
    intervalMs = 30000, // 30 segundos - más conservador
}: OptimizedHeartbeatOptions) => {
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastHeartbeatRef = useRef<number>(Date.now());
    const lastRequestRef = useRef<number>(0);

    // Usar refs para evitar recreación constante del useCallback
    const onlineFemalesListRef = useRef(onlineFemalesList);
    const onZombieDetectedRef = useRef(onZombieDetected);

    // Actualizar refs cuando cambien los valores
    onlineFemalesListRef.current = onlineFemalesList;
    onZombieDetectedRef.current = onZombieDetected;

    const sendHeartbeatAndCheck = useCallback(async () => {
        const now = Date.now();
        console.log('[OptimizedHeartbeat] 🔄 EJECUTANDO sendHeartbeatAndCheck - timestamp:', now);

        // Rate limiting más estricto
        if (now - lastRequestRef.current < 25000) {
            console.log('[OptimizedHeartbeat] ⏭️ Rate limited - saltando');
            return;
        }
        lastRequestRef.current = now;

        try {
            // Solo enviar heartbeat si el usuario está activo
            if (localUser && currentChannelName && current_room_id && isRtcJoined) {
                const heartbeatData = {
                    user_id: localUser.user_id,
                    channel_name: currentChannelName,
                    room_id: current_room_id,
                    role: localUser.role,
                    timestamp: now,
                };

                console.log(`[OptimizedHeartbeat] 📤 Enviando heartbeat para ${localUser.role}`);

                const response = await fetch('/api/agora/channels/heartbeat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(heartbeatData),
                });

                if (response.ok) {
                    lastHeartbeatRef.current = now;
                    console.log(`[OptimizedHeartbeat] ✅ Heartbeat enviado correctamente`);
                } else {
                    console.warn(`[OptimizedHeartbeat] ⚠️ Error en heartbeat:`, response.status);
                }
            }

            // Obtener estado de heartbeats para detección de zombies
            const heartbeatResponse = await fetch('/api/agora/channels/heartbeat');
            if (heartbeatResponse.ok) {
                const heartbeatData = await heartbeatResponse.json();
                const activeHeartbeats = heartbeatData.heartbeats || [];

                // TEMPORAL: Comentar la consulta de canales hasta que funcione el handler básico
                // const channelsResponse = await fetch('/api/agora/channels/list');
                // const channelsData = channelsResponse.ok ? await channelsResponse.json() : { data: [] };
                const backendChannels = []; // Temporal: array vacío

                // Crear mapa de canales activos
                const activeChannels = new Set(
                    activeHeartbeats.map((hb: any) => hb.channel_name)
                );

                // Debug: Log del estado actual
                console.log('[OptimizedHeartbeat] 🔍 Estado actual:', {
                    totalFemales: onlineFemalesListRef.current.length,
                    activeHeartbeats: activeHeartbeats.length,
                    activeChannels: Array.from(activeChannels),
                    backendChannels: backendChannels.length,
                    femalesWithChannels: onlineFemalesListRef.current.filter(f => f.host_id).map(f => ({
                        name: f.user_name,
                        status: f.status,
                        host_id: f.host_id
                    })),
                    backendChannelsDetail: backendChannels.map(c => ({
                        host_id: c.host_id,
                        user_id: c.user_id,
                        status: c.status,
                        hasHeartbeat: activeChannels.has(c.host_id)
                    }))
                });

                // Detectar females zombie (sin heartbeat)
                console.log('[OptimizedHeartbeat] 🔍 Analizando females para zombies...');

                const zombieChannels = onlineFemalesListRef.current.filter(female => {
                    const hasChannel = !!female.host_id;
                    const hasHeartbeat = female.host_id ? activeChannels.has(female.host_id) : false;
                    const isInCall = female.status === 'in_call';
                    const isOffline = female.status === 'offline';

                    console.log(`[OptimizedHeartbeat] 👩 Analizando ${female.user_name}:`, {
                        status: female.status,
                        host_id: female.host_id,
                        hasChannel,
                        hasHeartbeat,
                        isCandidate: (isInCall && hasChannel && !hasHeartbeat) || (isOffline && hasChannel && !hasHeartbeat)
                    });

                    return (
                        // Caso 1: Female en llamada sin heartbeat
                        (isInCall && hasChannel && !hasHeartbeat) ||
                        // Caso 2: Female offline pero con canal activo (refrescó página)
                        (isOffline && hasChannel && !hasHeartbeat)
                    );
                });

                // NUEVO: Detectar canales huérfanos del backend (sin heartbeat)
                const orphanedBackendChannels = backendChannels.filter(channel => {
                    // Canal en backend pero sin heartbeat activo
                    const hasHeartbeat = activeChannels.has(channel.host_id);
                    const isWaitingOrInCall = channel.status === 'waiting' || channel.status === 'in_call';
                    
                    return isWaitingOrInCall && !hasHeartbeat;
                });

                // Convertir canales huérfanos a formato UserInformation para el handler
                const orphanedZombies = orphanedBackendChannels.map(channel => {
                    // Buscar female en la lista online por user_id
                    const femaleInList = onlineFemalesListRef.current.find(f => f.user_id === channel.user_id);
                    
                    return {
                        user_id: channel.user_id,
                        user_name: femaleInList?.user_name || `User ${channel.user_id}`,
                        host_id: channel.host_id,
                        status: 'offline', // Está offline pero tiene canal activo
                        avatar: femaleInList?.avatar || null,
                        role: 'female' as const,
                        rtcUid: channel.user_id,
                        rtmUid: channel.user_id,
                        is_active: 0, // No activa porque no tiene heartbeat
                        in_call: 0,
                    };
                });

                // Detectar females con males desconectados
                const femalesWithDisconnectedMales = onlineFemalesListRef.current.filter(female => {
                    if (female.status !== 'in_call' || !female.host_id) return false;

                    const maleHeartbeatInChannel = activeHeartbeats.find((hb: any) =>
                        hb.channel_name === female.host_id && hb.role === 'male'
                    );

                    return !maleHeartbeatInChannel;
                });

                // Procesar zombies encontrados (método original)
                zombieChannels.forEach(zombie => {
                    console.log('[OptimizedHeartbeat] 🧟 Canal zombie detectado (lobby):', zombie.host_id, {
                        status: zombie.status,
                        user_name: zombie.user_name,
                        hasHeartbeat: activeChannels.has(zombie.host_id!)
                    });
                    console.log('[OptimizedHeartbeat] 🚀 LLAMANDO onZombieDetected para:', zombie.user_name);
                    onZombieDetectedRef.current(zombie);
                    console.log('[OptimizedHeartbeat] ✅ onZombieDetected EJECUTADO para:', zombie.user_name);
                });

                // Procesar canales huérfanos del backend
                orphanedZombies.forEach(zombie => {
                    console.log('[OptimizedHeartbeat] 🏚️ Canal huérfano detectado (backend):', zombie.host_id, {
                        user_id: zombie.user_id,
                        user_name: zombie.user_name,
                        hasHeartbeat: activeChannels.has(zombie.host_id!)
                    });
                    console.log('[OptimizedHeartbeat] 🚀 LLAMANDO onZombieDetected para canal huérfano:', zombie.user_name);
                    onZombieDetectedRef.current(zombie);
                    console.log('[OptimizedHeartbeat] ✅ onZombieDetected EJECUTADO para canal huérfano:', zombie.user_name);
                });

                // Procesar females con males desconectados
                femalesWithDisconnectedMales.forEach(female => {
                    console.log('[OptimizedHeartbeat] 👨‍💻 Male desconectado detectado:', female.host_id);
                    onZombieDetectedRef.current({
                        ...female,
                        disconnectionType: 'male_disconnected'
                    } as any);
                });

                console.log('[OptimizedHeartbeat] 📊 Resumen de detección:', {
                    zombieChannels: zombieChannels.length,
                    orphanedBackendChannels: orphanedZombies.length,
                    femalesWithDisconnectedMales: femalesWithDisconnectedMales.length,
                    totalProblems: zombieChannels.length + orphanedZombies.length + femalesWithDisconnectedMales.length
                });

                if (zombieChannels.length === 0 && orphanedZombies.length === 0 && femalesWithDisconnectedMales.length === 0) {
                    console.log('[OptimizedHeartbeat] ✅ No se encontraron problemas');
                }
            }

        } catch (error) {
            console.error('[OptimizedHeartbeat] ❌ Error en heartbeat optimizado:', error);
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

        console.log('[OptimizedHeartbeat] 🚀 Iniciando sistema optimizado cada', intervalMs, 'ms');

        // Crear función estable para el intervalo
        const executeHeartbeat = () => {
            sendHeartbeatAndCheck().catch(error => {
                console.error('[OptimizedHeartbeat] Error en ejecución:', error);
            });
        };

        // Ejecutar inmediatamente
        setTimeout(executeHeartbeat, 2000);

        // Configurar intervalo
        intervalRef.current = setInterval(executeHeartbeat, intervalMs);

        return () => {
            if (intervalRef.current) {
                console.log('[OptimizedHeartbeat] 🛑 Deteniendo sistema optimizado');
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