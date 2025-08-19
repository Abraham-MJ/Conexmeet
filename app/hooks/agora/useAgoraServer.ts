import {
  AgoraAction,
  AgoraActionType,
  UserInformation,
} from '@/app/types/streams';
import { AgoraApiClient } from '@/lib/agora-api-client';
import {
  LOG_PREFIX_FEMALE,
  LOG_PREFIX_LOBBY,
  LOG_PREFIX_MALE_ADMIN,
  LOG_PREFIX_PROVIDER,
} from '@/lib/constants';
import { useCallback } from 'react';

export const useAgoraServer = (dispatch: React.Dispatch<AgoraAction>) => {
  const fetchRtcToken = useCallback(
    async (
      channelName: string,
      roleForToken: 'publisher' | 'subscriber',
      rtcUid: string | number,
    ): Promise<string> => {
      try {
        return await AgoraApiClient.fetchRtcToken(
          channelName,
          roleForToken,
          rtcUid,
        );
      } catch (error: any) {
        console.error(
          `${LOG_PREFIX_PROVIDER} Error al obtener token RTC:`,
          error.message,
        );
        throw error;
      }
    },
    [],
  );

  const fetchRtmToken = useCallback(
    async (rtmUid: string | number): Promise<string> => {
      try {
        return await AgoraApiClient.fetchRtmToken(rtmUid);
      } catch (error: any) {
        console.error(
          `${LOG_PREFIX_PROVIDER} Error al obtener token RTM:`,
          error.message,
        );
        throw error;
      }
    },
    [],
  );

  const registerChannel = useCallback(
    async (
      hostId: string,
    ): Promise<{ success: boolean; message?: string; data?: any }> => {
      try {
        return await AgoraApiClient.registerChannel(hostId);
      } catch (error: any) {
        console.error(
          `${LOG_PREFIX_FEMALE} Error al registrar canal en backend:`,
          error.message,
        );
        throw error;
      }
    },
    [],
  );

  const notifyMaleJoining = useCallback(
    async (
      channelName: string,
      appUserId: string | number,
    ): Promise<{ success: boolean; message?: string; data?: any }> => {
      try {
        return await AgoraApiClient.notifyMaleJoining(channelName, appUserId);
      } catch (error: any) {
        console.error(
          `${LOG_PREFIX_MALE_ADMIN} Error al notificar unión de male al backend:`,
          error.message,
        );
        throw error;
      }
    },
    [],
  );

  const closeMaleChannel = useCallback(
    async (
      maleUserId: string | number,
      hostId: string,
      roomId: string | number,
    ): Promise<{ success: boolean; message?: string }> => {
      try {
        return await AgoraApiClient.closeMaleChannel(
          maleUserId,
          hostId,
          roomId,
        );
      } catch (error: any) {
        console.error(
          `${LOG_PREFIX_MALE_ADMIN} Error al notificar cierre de canal del male al backend:`,
          error.message,
        );
        throw error;
      }
    },
    [],
  );

  const cleanupAfterMaleDisconnect = useCallback(
    async (
      maleUserId: string | number,
      hostId: string,
      roomId: string | number,
    ): Promise<{ success: boolean; message?: string }> => {
      try {
        const result = await AgoraApiClient.cleanupAfterMaleDisconnect(
          maleUserId,
          hostId,
          roomId,
        );

        return result;
      } catch (error: any) {
        console.error(
          `${LOG_PREFIX_MALE_ADMIN} Error en limpieza después de desconexión del male para ${maleUserId} (host: ${hostId}, room: ${roomId}):`,
          error.message,
        );
        throw error;
      }
    },
    [],
  );

  const closeChannel = useCallback(
    async (
      hostId: string,
      status:
        | 'finished'
        | 'waiting'
        | 'available_call'
        | 'in_call'
        | 'online'
        | 'offline',
    ): Promise<{ success: boolean; message?: string }> => {
      try {
        const result = await AgoraApiClient.closeChannel(hostId, status);

        return result;
      } catch (error: any) {
        console.error(
          `${LOG_PREFIX_FEMALE} Error al notificar cierre/actualización de canal al backend para ${hostId} (status: ${status}):`,
          error.message,
        );
        throw error;
      }
    },
    [],
  );

  const fetchOnlineFemales = useCallback(async (): Promise<
    UserInformation[]
  > => {
    dispatch({ type: AgoraActionType.FETCH_ONLINE_FEMALES_START });
    try {
      const femalesList = await AgoraApiClient.fetchOnlineFemales();
      dispatch({
        type: AgoraActionType.FETCH_ONLINE_FEMALES_SUCCESS,
        payload: femalesList,
      });
      return femalesList;
    } catch (error: any) {
      console.error(
        `${LOG_PREFIX_LOBBY} Error al obtener lista de females online:`,
        error.message,
      );
      dispatch({
        type: AgoraActionType.FETCH_ONLINE_FEMALES_FAILURE,
        payload: error.message || 'Error desconocido al cargar modelos.',
      });
      throw error;
    }
  }, [dispatch]);

  const handleSendGift = useCallback(
    async (
      senderUserId: string | number,
      receiverUserId: string | number,
      gifId: string | number,
      hostId: string,
      giftCostInMinutes: number,
    ): Promise<{
      success: boolean;
      message?: string;
      cost_in_minutes: number;
    }> => {
      try {
        return await AgoraApiClient.sendGift(
          senderUserId,
          receiverUserId,
          gifId,
          hostId,
          giftCostInMinutes,
        );
      } catch (error: any) {
        console.error(
          `${LOG_PREFIX_PROVIDER} Error al enviar regalo:`,
          error.message,
        );
        throw error;
      }
    },
    [],
  );

  return {
    fetchRtcToken,
    fetchRtmToken,
    registerChannel,
    notifyMaleJoining,
    closeChannel,
    fetchOnlineFemales,
    closeMaleChannel,
    handleSendGift,
    cleanupAfterMaleDisconnect,
  };
};
