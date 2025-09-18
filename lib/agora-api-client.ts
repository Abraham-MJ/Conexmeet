import { UserInformation } from '@/app/types/streams';
import {
  AGORA_API_CONFIGS,
  AGORA_LOG_PREFIXES,
  AGORA_ERROR_MESSAGES,
} from '@/app/hooks/agora/configs';
import { deduplicateRequest } from './requestDeduplication';

const createOptimizedFetch = async <T>(
  url: string,
  configType: keyof typeof AGORA_API_CONFIGS,
  options?: { method?: 'GET' | 'POST'; body?: any },
): Promise<T> => {
  const config = AGORA_API_CONFIGS[configType];
  let attempt = 0;

  while (attempt <= config.retryAttempts) {
    try {
      const fetchOptions: RequestInit = {
        method: options?.method || config.method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (options?.body) {
        fetchOptions.body = JSON.stringify(options.body);
      }

      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result as T;
    } catch (error: any) {
      attempt++;

      if (attempt > config.retryAttempts) {
        throw error;
      }

      console.warn(
        `${AGORA_LOG_PREFIXES.RETRY} Attempt ${attempt}/${config.retryAttempts} failed for ${url}:`,
        error.message,
      );

      if (attempt <= config.retryAttempts) {
        await new Promise((resolve) => setTimeout(resolve, config.retryDelay));
      }
    }
  }

  throw new Error(`All ${config.retryAttempts} attempts failed for ${url}`);
};

export const AgoraApiClient = {
  async fetchRtcToken(
    channelName: string,
    roleForToken: 'publisher' | 'subscriber',
    rtcUid: string | number,
  ): Promise<string> {
    try {
      console.log(
        `${AGORA_LOG_PREFIXES.TOKENS} Fetching RTC token for channel: ${channelName}, role: ${roleForToken}, uid: ${rtcUid}`,
      );

      const url = `/api/agora/get-token-rtc?channel=${channelName}&rol=${roleForToken}&type=uid&uid=${rtcUid}`;
      const response = await createOptimizedFetch<{ rtcToken: string }>(
        url,
        'tokens',
      );

      if (!response.rtcToken) {
        throw new Error(AGORA_ERROR_MESSAGES.TOKEN_NOT_RECEIVED);
      }

      console.log(
        `${AGORA_LOG_PREFIXES.TOKENS} RTC token obtained successfully`,
      );
      return response.rtcToken;
    } catch (error: any) {
      console.error(
        `${AGORA_LOG_PREFIXES.TOKENS} Error fetching RTC token:`,
        error.message,
      );
      throw error;
    }
  },

  async fetchRtmToken(rtmUid: string | number): Promise<string> {
    try {
      console.log(
        `${AGORA_LOG_PREFIXES.TOKENS} Fetching RTM token for uid: ${rtmUid}`,
      );

      const url = `/api/agora/get-token-rtm?uid=${rtmUid}`;
      const response = await createOptimizedFetch<{ rtmToken: string }>(
        url,
        'tokens',
      );

      if (!response.rtmToken) {
        throw new Error(AGORA_ERROR_MESSAGES.TOKEN_NOT_RECEIVED);
      }

      console.log(
        `${AGORA_LOG_PREFIXES.TOKENS} RTM token obtained successfully`,
      );
      return response.rtmToken;
    } catch (error: any) {
      console.error(
        `${AGORA_LOG_PREFIXES.TOKENS} Error fetching RTM token:`,
        error.message,
      );
      throw error;
    }
  },

  async registerChannel(
    hostId: string,
  ): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
      console.log(
        `${AGORA_LOG_PREFIXES.MANAGEMENT} Registering channel for host: ${hostId}`,
      );

      const url = `/api/agora/channels/create-channel?host_id=${hostId}`;
      const response = await createOptimizedFetch<{
        success: boolean;
        message?: string;
        data?: any;
      }>(url, 'channelManagement', { method: 'GET' });

      if (!response.success) {
        throw new Error(response.message || 'Backend no pudo registrar canal');
      }

      console.log(
        `${AGORA_LOG_PREFIXES.MANAGEMENT} Channel registered successfully for host: ${hostId}`,
      );
      return response;
    } catch (error: any) {
      console.error(
        `${AGORA_LOG_PREFIXES.MANAGEMENT} Error registering channel:`,
        error.message,
      );
      throw error;
    }
  },

  async verifyChannelAvailability(
    channelName: string,
  ): Promise<{ available: boolean; reason?: string }> {
    try {
      console.log(
        `${AGORA_LOG_PREFIXES.VERIFICATION} Verifying channel availability: ${channelName}`,
      );

      const url = `/api/agora/channels/verify-availability?host_id=${channelName}`;
      const response = await createOptimizedFetch<{
        available: boolean;
        reason?: string;
      }>(url, 'channelVerification');

      const result = {
        available: response.available || false,
        reason:
          response.reason ||
          (response.available
            ? undefined
            : AGORA_ERROR_MESSAGES.CHANNEL_NOT_AVAILABLE),
      };

      console.log(
        `${AGORA_LOG_PREFIXES.VERIFICATION} Channel ${channelName} availability: ${result.available}`,
      );
      return result;
    } catch (error: any) {
      console.warn(
        `${AGORA_LOG_PREFIXES.VERIFICATION} Error verifying channel availability:`,
        error.message,
      );
      return {
        available: false,
        reason: AGORA_ERROR_MESSAGES.CONNECTION_ERROR,
      };
    }
  },

  async notifyMaleJoining(
    channelName: string,
    appUserId: string | number,
  ): Promise<{
    success: boolean;
    message?: string;
    data?: any;
    errorType?: string;
  }> {
    try {
      console.log(
        `${AGORA_LOG_PREFIXES.MANAGEMENT} Notifying male joining - User: ${appUserId}, Channel: ${channelName}`,
      );

      const url = `/api/agora/channels/enter-channel-male-v2`;
      const response = await createOptimizedFetch<{
        success: boolean;
        message?: string;
        data?: any;
        error?: string;
      }>(url, 'channelManagement', {
        method: 'POST',
        body: { user_id: appUserId, host_id: channelName },
      });

      if (typeof response.success === 'undefined') {
        console.log(
          `${AGORA_LOG_PREFIXES.MANAGEMENT} Male joining notification completed (success undefined, assuming true)`,
        );
        return { ...response, success: true };
      }

      if (!response.success) {
        console.warn(
          `${AGORA_LOG_PREFIXES.MANAGEMENT} Male joining notification failed:`,
          response.message,
        );
        return {
          success: false,
          message: response.message || 'Backend no pudo actualizar male',
        };
      }

      console.log(
        `${AGORA_LOG_PREFIXES.MANAGEMENT} Male joining notification successful`,
      );
      return response;
    } catch (error: any) {
      console.error(
        `${AGORA_LOG_PREFIXES.MANAGEMENT} Error notifying male joining:`,
        error.message,
      );
      return {
        success: false,
        message: error.message || 'Error al notificar entrada de male',
      };
    }
  },

  async closeMaleChannel(
    maleUserId: string | number,
    hostId: string,
    roomId: string | number,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      console.log(
        `${AGORA_LOG_PREFIXES.MANAGEMENT} Closing male channel - User: ${maleUserId}, Host: ${hostId}, Room: ${roomId}`,
      );

      const url = '/api/agora/channels/close-channel-male';
      const response = await createOptimizedFetch<{
        success: boolean;
        message?: string;
      }>(url, 'channelManagement', {
        method: 'POST',
        body: {
          user_id: maleUserId,
          host_id: hostId,
          id: roomId,
        },
      });

      if (!response.success) {
        throw new Error(
          response.message ||
            'Error al notificar cierre de canal del male al backend',
        );
      }

      console.log(
        `${AGORA_LOG_PREFIXES.MANAGEMENT} Male channel closed successfully`,
      );
      return response;
    } catch (error: any) {
      console.error(
        `${AGORA_LOG_PREFIXES.MANAGEMENT} Error closing male channel for ${maleUserId} (host: ${hostId}, room: ${roomId}):`,
        error.message,
      );
      throw error;
    }
  },

  async cleanupAfterMaleDisconnect(
    maleUserId: string | number,
    hostId: string,
    roomId: string | number,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      console.log(
        `${AGORA_LOG_PREFIXES.MANAGEMENT} Cleanup after male disconnect - User: ${maleUserId}, Host: ${hostId}, Room: ${roomId}`,
      );

      const url = '/api/agora/channels/cleanup-after-male-disconnect';
      const requestOptions = {
        method: 'POST' as const,
        body: {
          user_id: maleUserId,
          host_id: hostId,
          room_id: roomId,
        },
      };

      const response = await deduplicateRequest(
        url,
        () =>
          createOptimizedFetch<{ success: boolean; message?: string }>(
            url,
            'channelManagement',
            requestOptions,
          ),
        requestOptions,
      );

      if (!response.success) {
        throw new Error(
          response.message ||
            'Error en limpieza después de desconexión del male',
        );
      }

      console.log(
        `${AGORA_LOG_PREFIXES.MANAGEMENT} Cleanup after male disconnect completed successfully`,
      );
      return response;
    } catch (error: any) {
      console.error(
        `${AGORA_LOG_PREFIXES.MANAGEMENT} Error in cleanup after male disconnect for ${maleUserId} (host: ${hostId}, room: ${roomId}):`,
        error.message,
      );
      throw error;
    }
  },

  async closeChannel(
    hostId: string,
    status:
      | 'finished'
      | 'waiting'
      | 'available_call'
      | 'in_call'
      | 'online'
      | 'offline',
  ): Promise<{ success: boolean; message?: string }> {
    try {
      console.log(
        `${AGORA_LOG_PREFIXES.MANAGEMENT} Closing channel - Host: ${hostId}, Status: ${status}`,
      );

      const url = '/api/agora/channels/close-channel';
      const response = await createOptimizedFetch<{
        success: boolean;
        message?: string;
      }>(url, 'channelManagement', {
        method: 'POST',
        body: {
          host_id: hostId,
          status: status,
        },
      });

      if (!response.success) {
        throw new Error(
          response.message ||
            `Error al notificar cierre de canal al backend (status: ${status})`,
        );
      }

      console.log(
        `${AGORA_LOG_PREFIXES.MANAGEMENT} Channel closed successfully - Host: ${hostId}, Status: ${status}`,
      );
      return response;
    } catch (error: any) {
      console.error(
        `${AGORA_LOG_PREFIXES.MANAGEMENT} Error closing channel (status: ${status}) for ${hostId}:`,
        error.message,
      );
      throw error;
    }
  },

  async fetchOnlineFemales(): Promise<UserInformation[]> {
    try {
      console.log(
        `${AGORA_LOG_PREFIXES.FEMALES_LIST} Fetching online females list`,
      );

      const url = '/api/agora/host';
      const response = await createOptimizedFetch<{
        success: boolean;
        data: any[];
        message?: string;
      }>(url, 'femalesList');

      if (response.success && Array.isArray(response.data)) {
        const femalesList = response.data.map((female: any) => ({
          user_id: female.user_id,
          rtcUid: String(female.user_id),
          rtmUid: String(female.user_id),
          user_name: female.user_name,
          avatar: female.avatar,
          role: 'female',
          is_active: female.is_active,
          in_call: female.in_call,
          host_id: female.host_id,
          status: female.status,
        })) as UserInformation[];

        console.log(
          `${AGORA_LOG_PREFIXES.FEMALES_LIST} Fetched ${femalesList.length} online females`,
        );
        return femalesList;
      } else {
        throw new Error(
          response.message || 'Respuesta inválida de API de lista de females',
        );
      }
    } catch (error: any) {
      console.error(
        `${AGORA_LOG_PREFIXES.FEMALES_LIST} Error fetching online females:`,
        error.message,
      );
      throw error;
    }
  },

  async sendGift(
    senderUserId: string | number,
    receiverUserId: string | number,
    gifId: string | number,
    hostId: string,
    giftCostInMinutes: number,
  ): Promise<{ success: boolean; message?: string; cost_in_minutes: number }> {
    try {
      console.log(
        `${AGORA_LOG_PREFIXES.GIFTS} Sending gift - From: ${senderUserId}, To: ${receiverUserId}, Gift: ${gifId}, Host: ${hostId}`,
      );

      const url = '/api/gift/send-gifts';
      const response = await createOptimizedFetch<{
        success: boolean;
        message?: string;
        cost_in_minutes?: number;
      }>(url, 'gifts', {
        method: 'POST',
        body: {
          user_id_sends: senderUserId,
          user_id_receives: receiverUserId,
          gif_id: gifId,
          host_id: hostId,
          gift_cost_in_minutes: giftCostInMinutes,
        },
      });

      if (!response.success) {
        throw new Error(
          response.message || 'Error al enviar regalo al backend',
        );
      }

      const result = {
        success: true,
        message: response.message || 'Regalo enviado.',
        cost_in_minutes: response.cost_in_minutes || giftCostInMinutes,
      };

      console.log(
        `${AGORA_LOG_PREFIXES.GIFTS} Gift sent successfully - Cost: ${result.cost_in_minutes} minutes`,
      );
      return result;
    } catch (error: any) {
      console.error(
        `${AGORA_LOG_PREFIXES.GIFTS} Error sending gift from ${senderUserId} to ${receiverUserId} (gifId: ${gifId}, hostId: ${hostId}):`,
        error.message,
      );
      throw error;
    }
  },
};
