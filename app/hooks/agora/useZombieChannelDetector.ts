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
  checkIntervalMs = 30000, // 30 segundos - más conservador
}: ZombieChannelDetectorOptions) => {
  const detectorIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<number>(Date.now());
  const isCheckingRef = useRef<boolean>(false);
  const mountedRef = useRef<boolean>(true);

  // Usar ref para evitar dependencias que cambien constantemente
  const onZombieChannelDetectedRef = useRef(onZombieChannelDetected);
  const onlineFemalesListRef = useRef(onlineFemalesList);
  const processedZombiesRef = useRef<Set<string>>(new Set());

  // Actualizar refs cuando cambien los valores - SOLO si el componente está montado
  useEffect(() => {
    if (mountedRef.current) {
      onZombieChannelDetectedRef.current = onZombieChannelDetected;
      onlineFemalesListRef.current = onlineFemalesList;
    }
  }, [onZombieChannelDetected, onlineFemalesList]);

  const checkForZombieChannels = useCallback(async () => {
    console.log('[Zombie Detector] 🔍 Iniciando verificación de canales zombie...');
    
    // Verificaciones de seguridad más estrictas
    if (!enabled || !mountedRef.current || isCheckingRef.current) {
      console.log('[Zombie Detector] ⏭️ Saltando verificación:', {
        enabled,
        mounted: mountedRef.current,
        checking: isCheckingRef.current
      });
      return;
    }

    // Verificar que tenemos datos válidos
    const currentFemalesList = onlineFemalesListRef.current;
    if (!currentFemalesList || currentFemalesList.length === 0) {
      console.log('[Zombie Detector] ⏭️ No hay females para verificar');
      return;
    }

    console.log(`[Zombie Detector] 📊 Verificando ${currentFemalesList.length} females...`);
    isCheckingRef.current = true;

    try {
      // Obtener estado actual de heartbeats con timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout

      const response = await fetch('/api/agora/channels/heartbeat', {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn('[Zombie Detector] ⚠️ Error obteniendo heartbeats:', response.status);
        return;
      }

      const heartbeatData = await response.json();
      const activeHeartbeats = heartbeatData.heartbeats || [];

      // Crear mapa de heartbeats activos
      const activeChannels = new Set(
        activeHeartbeats.map((hb: any) => hb.channel_name)
      );

      // Verificar females que dicen estar en llamada pero no tienen heartbeat
      const zombieChannels = currentFemalesList.filter(female => {
        return (
          female.status === 'in_call' &&
          female.host_id &&
          !activeChannels.has(female.host_id) &&
          !processedZombiesRef.current.has(female.host_id) // No procesar el mismo zombie repetidamente
        );
      });

      // NUEVO: También verificar females que están in_call pero el male se desconectó
      console.log('[Zombie Detector] 🔍 Buscando females con males desconectados...');
      
      // Buscar females que están in_call pero no hay heartbeat de male en su canal
      const femalesWithDisconnectedMales = currentFemalesList.filter(female => {
        if (female.status !== 'in_call' || !female.host_id) return false;
        
        console.log(`[Zombie Detector] 🔍 Verificando female ${female.user_name} en canal ${female.host_id}`);
        
        // Verificar si hay heartbeat de male en este canal
        const maleHeartbeatInChannel = activeHeartbeats.find((hb: any) => 
          hb.channel_name === female.host_id && hb.role === 'male'
        );
        
        console.log(`[Zombie Detector] 📊 Male heartbeat en canal ${female.host_id}:`, !!maleHeartbeatInChannel);
        
        // Si no hay heartbeat de male pero la female está in_call, es un problema
        const isDisconnected = !maleHeartbeatInChannel && !processedZombiesRef.current.has(`male_${female.host_id}`);
        
        if (isDisconnected) {
          console.log(`[Zombie Detector] 🚨 Male desconectado detectado en canal ${female.host_id}`);
        }
        
        return isDisconnected;
      });

      console.log(`[Zombie Detector] 📊 Females con males desconectados encontradas: ${femalesWithDisconnectedMales.length}`);

      // Procesar canales zombie (females desconectadas)
      if (zombieChannels.length > 0 && mountedRef.current) {
        console.log(`[Zombie Detector] 🧟 Encontrados ${zombieChannels.length} canales zombie nuevos`);

        zombieChannels.forEach(zombieFemale => {
          if (!mountedRef.current) return;

          console.log('[Zombie Detector] 🧟 Canal zombie detectado:', {
            femaleName: zombieFemale.user_name,
            channelId: zombieFemale.host_id,
            status: zombieFemale.status,
          });
          
          if (zombieFemale.host_id) {
            processedZombiesRef.current.add(zombieFemale.host_id);
          }
          
          if (mountedRef.current && onZombieChannelDetectedRef.current) {
            onZombieChannelDetectedRef.current(zombieFemale);
          }
        });
      }

      // NUEVO: Procesar females con males desconectados
      if (femalesWithDisconnectedMales.length > 0 && mountedRef.current) {
        console.log(`[Zombie Detector] 👨‍💻 Encontradas ${femalesWithDisconnectedMales.length} females con males desconectados`);

        femalesWithDisconnectedMales.forEach(femaleWithDisconnectedMale => {
          if (!mountedRef.current) return;

          console.log('[Zombie Detector] 👨‍💻 Male desconectado detectado:', {
            femaleName: femaleWithDisconnectedMale.user_name,
            channelId: femaleWithDisconnectedMale.host_id,
            femaleStatus: femaleWithDisconnectedMale.status,
          });
          
          // Marcar como procesado para evitar repeticiones
          if (femaleWithDisconnectedMale.host_id) {
            processedZombiesRef.current.add(`male_${femaleWithDisconnectedMale.host_id}`);
          }
          
          // Crear un objeto especial para indicar que es una desconexión de male
          const maleDisconnectionEvent = {
            ...femaleWithDisconnectedMale,
            disconnectionType: 'male_disconnected' as const,
          };
          
          if (mountedRef.current && onZombieChannelDetectedRef.current) {
            onZombieChannelDetectedRef.current(maleDisconnectionEvent);
          }
        });
      }

      if (zombieChannels.length === 0 && femalesWithDisconnectedMales.length === 0 && mountedRef.current) {
        console.log('[Zombie Detector] ✅ No se encontraron problemas de conexión');
      }

      // Limpiar zombies procesados que ya no están en la lista
      const currentChannelIds = new Set(
        currentFemalesList
          .filter(f => f.host_id)
          .map(f => f.host_id!)
      );
      
      processedZombiesRef.current.forEach(channelId => {
        if (!currentChannelIds.has(channelId)) {
          processedZombiesRef.current.delete(channelId);
        }
      });

      lastCheckRef.current = Date.now();

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('[Zombie Detector] ⏰ Request timeout - saltando verificación');
      } else {
        console.error('[Zombie Detector] ❌ Error verificando canales zombie:', error);
      }
    } finally {
      if (mountedRef.current) {
        isCheckingRef.current = false;
      }
    }
  }, [enabled]); // Solo 'enabled' como dependencia

  useEffect(() => {
    // Marcar como montado
    mountedRef.current = true;

    if (!enabled) {
      if (detectorIntervalRef.current) {
        clearInterval(detectorIntervalRef.current);
        detectorIntervalRef.current = null;
      }
      return;
    }

    // Solo iniciar si no hay un intervalo activo Y el componente está montado
    if (detectorIntervalRef.current || !mountedRef.current) {
      return;
    }

    console.log('[Zombie Detector] 🚀 Iniciando detector de canales zombie cada', checkIntervalMs, 'ms');

    // Verificación inicial después de un delay más largo para evitar conflictos
    const initialTimeout = setTimeout(() => {
      if (mountedRef.current) {
        checkForZombieChannels();
      }
    }, 5000); // 5 segundos de delay inicial

    // Configurar intervalo
    detectorIntervalRef.current = setInterval(() => {
      if (mountedRef.current) {
        checkForZombieChannels();
      }
    }, checkIntervalMs);

    // Listener para force check manual
    const handleForceCheck = () => {
      console.log('[Zombie Detector] 🧪 Force check solicitado');
      if (mountedRef.current) {
        checkForZombieChannels();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('forceZombieCheck', handleForceCheck);
    }

    return () => {
      // Marcar como desmontado
      mountedRef.current = false;
      
      // Limpiar timeout inicial
      clearTimeout(initialTimeout);
      
      // Limpiar intervalo
      if (detectorIntervalRef.current) {
        console.log('[Zombie Detector] 🛑 Deteniendo detector de canales zombie');
        clearInterval(detectorIntervalRef.current);
        detectorIntervalRef.current = null;
      }
      
      // Limpiar listener
      if (typeof window !== 'undefined') {
        window.removeEventListener('forceZombieCheck', handleForceCheck);
      }
      
      // Limpiar estado
      isCheckingRef.current = false;
    };
  }, [enabled, checkIntervalMs]); // Remover checkForZombieChannels de las dependencias

  return {
    lastCheck: lastCheckRef.current,
    isActive: !!detectorIntervalRef.current,
    forceCheck: checkForZombieChannels,
  };
};