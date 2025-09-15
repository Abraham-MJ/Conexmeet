import { useCallback, useEffect, useRef } from 'react';
import {
  UserInformation,
  AgoraAction,
  AgoraActionType,
} from '@/app/types/streams';

interface ConnectionAttempt {
  userId: string;
  channelId: string;
  timestamp: number;
  status: 'attempting' | 'connected' | 'failed';
}

export const useConnectionMonitor = (
  dispatch: React.Dispatch<AgoraAction>,
  localUser: UserInformation | null,
  onlineFemalesList: UserInformation[],
) => {
  const activeConnectionsRef = useRef<Map<string, ConnectionAttempt>>(
    new Map(),
  );
  const monitoringIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const detectSimultaneousConnections = useCallback(() => {
    if (!localUser || localUser.role !== 'male') return;

    const now = Date.now();
    const recentlyChangedFemales = onlineFemalesList.filter((female) => {
      return female.status === 'in_call' && female.host_id;
    });

    recentlyChangedFemales.forEach((female) => {
      const channelId = female.host_id!;
      const existingConnection = activeConnectionsRef.current.get(channelId);

      if (existingConnection && existingConnection.status === 'attempting') {
        console.warn(
          `[Connection Monitor] Posible conexión simultánea detectada en canal ${channelId}`,
        );

        if (existingConnection.userId !== String(localUser.user_id)) {
          dispatch({
            type: AgoraActionType.SET_SHOW_CHANNEL_IS_BUSY_MODAL,
            payload: true,
          });
        }
      }
    });
  }, [localUser, onlineFemalesList, dispatch]);

  const registerConnectionAttempt = useCallback(
    (channelId: string, userId: string) => {
      activeConnectionsRef.current.set(channelId, {
        userId,
        channelId,
        timestamp: Date.now(),
        status: 'attempting',
      });
    },
    [],
  );

  const markConnectionSuccessful = useCallback((channelId: string) => {
    const connection = activeConnectionsRef.current.get(channelId);
    if (connection) {
      connection.status = 'connected';
    }
  }, []);

  const markConnectionFailed = useCallback((channelId: string) => {
    const connection = activeConnectionsRef.current.get(channelId);
    if (connection) {
      connection.status = 'failed';
      setTimeout(() => {
        activeConnectionsRef.current.delete(channelId);
      }, 5000);
    }
  }, []);

  const cleanupOldConnections = useCallback(() => {
    const now = Date.now();
    const CLEANUP_THRESHOLD = 30000;

    for (const [
      channelId,
      connection,
    ] of activeConnectionsRef.current.entries()) {
      if (now - connection.timestamp > CLEANUP_THRESHOLD) {
        activeConnectionsRef.current.delete(channelId);
      }
    }
  }, []);

  useEffect(() => {
    if (localUser?.role === 'male') {
      monitoringIntervalRef.current = setInterval(() => {
        detectSimultaneousConnections();
        cleanupOldConnections();
      }, 2000);

      return () => {
        if (monitoringIntervalRef.current) {
          clearInterval(monitoringIntervalRef.current);
        }
      };
    }
  }, [localUser, detectSimultaneousConnections, cleanupOldConnections]);

  const hasActiveConnectionConflict = useCallback(
    (channelId: string, userId: string): boolean => {
      const connection = activeConnectionsRef.current.get(channelId);
      return Boolean(
        connection &&
          connection.status === 'attempting' &&
          connection.userId !== userId &&
          Date.now() - connection.timestamp < 10000,
      );
    },
    [],
  );

  return {
    registerConnectionAttempt,
    markConnectionSuccessful,
    markConnectionFailed,
    hasActiveConnectionConflict,
    detectSimultaneousConnections,
  };
};
