import { useCallback, useEffect, useRef } from 'react';
import { UserInformation, AgoraAction, AgoraActionType } from '@/app/types/streams';

interface ConnectionAttempt {
  userId: string;
  channelId: string;
  timestamp: number;
  status: 'attempting' | 'connected' | 'failed';
}

export const useConnectionMonitor = (
  dispatch: React.Dispatch<AgoraAction>,
  localUser: UserInformation | null,
  onlineFemalesList: UserInformation[]
) => {
  const activeConnectionsRef = useRef<Map<string, ConnectionAttempt>>(new Map());
  const monitoringIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Detectar cambios sospechosos en el estado de las females
  const detectSimultaneousConnections = useCallback(() => {
    if (!localUser || localUser.role !== 'male') return;

    const now = Date.now();
    const recentlyChangedFemales = onlineFemalesList.filter(female => {
      // Buscar females que cambiaron de available_call a in_call recientemente
      return female.status === 'in_call' && female.host_id;
    });

    recentlyChangedFemales.forEach(female => {
      const channelId = female.host_id!;
      const existingConnection = activeConnectionsRef.current.get(channelId);

      if (existingConnection && existingConnection.status === 'attempting') {
        // Posible conexión simultánea detectada
        console.warn(
          `[Connection Monitor] Posible conexión simultánea detectada en canal ${channelId}`
        );

        // Si no somos nosotros los que nos conectamos, mostrar advertencia
        if (existingConnection.userId !== String(localUser.user_id)) {
          dispatch({
            type: AgoraActionType.SET_SHOW_CHANNEL_IS_BUSY_MODAL,
            payload: true,
          });
        }
      }
    });
  }, [localUser, onlineFemalesList, dispatch]);

  // Registrar intento de conexión
  const registerConnectionAttempt = useCallback((channelId: string, userId: string) => {
    activeConnectionsRef.current.set(channelId, {
      userId,
      channelId,
      timestamp: Date.now(),
      status: 'attempting'
    });
  }, []);

  // Marcar conexión como exitosa
  const markConnectionSuccessful = useCallback((channelId: string) => {
    const connection = activeConnectionsRef.current.get(channelId);
    if (connection) {
      connection.status = 'connected';
    }
  }, []);

  // Marcar conexión como fallida
  const markConnectionFailed = useCallback((channelId: string) => {
    const connection = activeConnectionsRef.current.get(channelId);
    if (connection) {
      connection.status = 'failed';
      // Limpiar después de un tiempo
      setTimeout(() => {
        activeConnectionsRef.current.delete(channelId);
      }, 5000);
    }
  }, []);

  // Limpiar conexiones antiguas
  const cleanupOldConnections = useCallback(() => {
    const now = Date.now();
    const CLEANUP_THRESHOLD = 30000; // 30 segundos

    for (const [channelId, connection] of activeConnectionsRef.current.entries()) {
      if (now - connection.timestamp > CLEANUP_THRESHOLD) {
        activeConnectionsRef.current.delete(channelId);
      }
    }
  }, []);

  // Iniciar monitoreo
  useEffect(() => {
    if (localUser?.role === 'male') {
      monitoringIntervalRef.current = setInterval(() => {
        detectSimultaneousConnections();
        cleanupOldConnections();
      }, 2000); // Verificar cada 2 segundos

      return () => {
        if (monitoringIntervalRef.current) {
          clearInterval(monitoringIntervalRef.current);
        }
      };
    }
  }, [localUser, detectSimultaneousConnections, cleanupOldConnections]);

  // Verificar si hay conflictos de conexión activos
  const hasActiveConnectionConflict = useCallback((channelId: string, userId: string) => {
    const connection = activeConnectionsRef.current.get(channelId);
    return connection && 
           connection.status === 'attempting' && 
           connection.userId !== userId &&
           Date.now() - connection.timestamp < 10000; // Dentro de los últimos 10 segundos
  }, []);

  return {
    registerConnectionAttempt,
    markConnectionSuccessful,
    markConnectionFailed,
    hasActiveConnectionConflict,
    detectSimultaneousConnections
  };
};