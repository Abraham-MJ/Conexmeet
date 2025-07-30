import { UserInformation } from '@/app/types/streams';

export const AgoraApiClient = {
  async fetchRtcToken(
    channelName: string,
    roleForToken: 'publisher' | 'subscriber',
    rtcUid: string | number,
  ): Promise<string> {
    const response = await fetch(
      `/api/agora/get-token-rtc?channel=${channelName}&rol=${roleForToken}&type=uid&uid=${rtcUid}`,
    );

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: 'Error desconocido al obtener token RTC.' }));
      throw new Error(
        errorData.message || `Failed to get RTC token: ${response.statusText}`,
      );
    }

    const { rtcToken } = await response.json();

    if (!rtcToken) {
      throw new Error('Token RTC no recibido en la respuesta.');
    }
    return rtcToken;
  },

  async fetchRtmToken(rtmUid: string | number): Promise<string> {
    const response = await fetch(`/api/agora/get-token-rtm?uid=${rtmUid}`);

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: 'Error desconocido al obtener token RTM.' }));
      throw new Error(
        errorData.message || `Failed to get RTM token: ${response.statusText}`,
      );
    }

    const { rtmToken } = await response.json();

    if (!rtmToken) {
      throw new Error('Token RTM no recibido en la respuesta.');
    }
    return rtmToken;
  },

  async registerChannel(
    hostId: string,
  ): Promise<{ success: boolean; message?: string; data?: any }> {
    const backendRegisterResponse = await fetch(
      `/api/agora/channels/create-channel?host_id=${hostId}`,
    );

    if (!backendRegisterResponse.ok) {
      const errorData = await backendRegisterResponse
        .json()
        .catch(() => ({ message: 'Error desconocido al registrar sesión.' }));
      throw new Error(
        errorData.message ||
          `Failed to register session: ${backendRegisterResponse.statusText}`,
      );
    }

    const backendResult = await backendRegisterResponse.json();

    if (!backendResult.success) {
      throw new Error(backendResult.message || 'Backend no pudo registrar F.');
    }
    return backendResult;
  },

  async notifyMaleJoining(
    channelName: string,
    appUserId: string | number,
  ): Promise<{ success: boolean; message?: string; data?: any }> {
    const enterChannelResponse = await fetch(
      `/api/agora/channels/enter-channel-male-v2`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: appUserId, host_id: channelName }),
      },
    );
    let enterChannelResult: {
      success: boolean;
      message?: string;
      data?: any;
      error?: string;
    };
    if (!enterChannelResponse.ok) {
      let e = { m: `Err M backend: ${enterChannelResponse.statusText}` };
      try {
        const d = await enterChannelResponse.json();
        e.m = d.message || d.error || e.m;
        enterChannelResult = { success: false, message: e.m, data: d };
      } catch (er) {
        enterChannelResult = { success: false, message: e.m };
      }
      return enterChannelResult;
    }
    enterChannelResult = await enterChannelResponse.json();

    if (typeof enterChannelResult.success === 'undefined') {
      return { ...enterChannelResult, success: true };
    }

    if (!enterChannelResult.success) {
      return {
        success: false,
        message: enterChannelResult.message || 'Backend no pudo actualizar M.',
      };
    }
    return enterChannelResult;
  },

  async closeMaleChannel(
    maleUserId: string | number,
    hostId: string,
    roomId: string | number,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch('/api/agora/channels/close-channel-male', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: maleUserId,
          host_id: hostId,
          id: roomId,
        }),
      });

      const responseData = await response.json();
      if (!response.ok || !responseData.success) {
        throw new Error(
          responseData.message ||
            `Error al notificar cierre de canal del male al backend: ${response.status}`,
        );
      }
      return responseData;
    } catch (error: any) {
      console.error(
        `Excepción al notificar cierre de canal del male al backend para ${maleUserId} (host: ${hostId}, room: ${roomId}):`,
        error,
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
      const response = await fetch(`/api/agora/channels/close-channel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host_id: hostId,
          status: status,
        }),
      });

      const responseData = await response.json();
      if (!response.ok || !responseData.success) {
        throw new Error(
          responseData.message ||
            `Error al notificar cierre de canal al backend (status: ${status}): ${response.status}`,
        );
      }
      return responseData;
    } catch (error: any) {
      console.error(
        `Excepción al notificar cierre de canal (status: ${status}) al backend para ${hostId}:`,
        error,
      );
      throw error;
    }
  },

  async fetchOnlineFemales(): Promise<UserInformation[]> {
    const response = await fetch('/api/agora/host');

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: 'Error desconocido al obtener lista de females.',
      }));
      throw new Error(
        errorData.message ||
          `Failed to fetch female list: ${response.statusText}`,
      );
    }

    const result = await response.json();

    if (result.success && Array.isArray(result.data)) {
      const femalesList = result.data.map((female: any) => ({
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
      return femalesList;
    } else {
      throw new Error(
        result.message || 'Respuesta inválida de API de lista de females.',
      );
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
      const response = await fetch('/api/gift/send-gifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id_sends: senderUserId,
          user_id_receives: receiverUserId,
          gif_id: gifId,
          host_id: hostId,
          gift_cost_in_minutes: giftCostInMinutes,
        }),
      });

      const responseData = await response.json();
      if (!response.ok || !responseData.success) {
        throw new Error(
          responseData.message ||
            `Error al enviar regalo al backend: ${response.status}`,
        );
      }
      return {
        success: true,
        message: responseData.message || 'Regalo enviado.',
        cost_in_minutes: responseData.cost_in_minutes || giftCostInMinutes,
      };
    } catch (error: any) {
      console.error(
        `Excepción al enviar regalo de ${senderUserId} a ${receiverUserId} (gifId: ${gifId}, hostId: ${hostId}):`,
        error,
      );
      throw error;
    }
  },
};
