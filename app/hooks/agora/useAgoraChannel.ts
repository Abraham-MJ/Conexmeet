import { useState, useEffect, useCallback, useRef } from 'react';
import { RtmClient, RtmChannel } from 'agora-rtm-sdk';
import {
  AgoraAction,
  AgoraActionType,
  AgoraState,
  ChatMessage,
  FemaleCallSummaryInfo,
  UserInformation,
} from '@/app/types/streams';
import { useAgoraServer } from './useAgoraServer';
import { LOG_PREFIX_RTM_LISTEN } from '@/lib/constants';

export const useAgoraCallChannel = (
  dispatch: React.Dispatch<AgoraAction>,
  appID: string | null,
  localUser: UserInformation | null,
  rtmClient: RtmClient | null,
  isRtmLoggedIn: boolean,
  agoraBackend: ReturnType<typeof useAgoraServer>,
  initializeRtmClient: (loadingMessage?: string) => Promise<RtmClient | null>,
  state: AgoraState,
  broadcastLocalFemaleStatusUpdate: (
    statusInfo: Partial<UserInformation>,
  ) => Promise<void>,
  callTimer: string,
  femaleTotalPointsEarnedInCall: number,
) => {
  const [rtmChannel, setRtmChannel] = useState<RtmChannel | null>(null);
  const [isRtmChannelJoined, setIsRtmChannelJoined] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const pendingProfilePromisesRef = useRef(new Map<string, () => void>());

  const waitForUserProfile = useCallback(
    (uidToWaitFor: string | number) => {
      const stringUid = String(uidToWaitFor);
      if (state.remoteUsers?.find((u) => String(u.rtcUid) === stringUid)) {
        return Promise.resolve();
      }

      return new Promise<void>((resolve) => {
        pendingProfilePromisesRef.current.set(stringUid, resolve);
      });
    },
    [state.remoteUsers],
  );

  const sendCallSignal = useCallback(
    async (type: string, payload: any) => {
      if (!rtmChannel || !isRtmChannelJoined || !localUser) {
        console.warn(
          `${LOG_PREFIX_RTM_LISTEN} No se puede enviar señal. Canal RTM no unido o usuario local no disponible.`,
        );
        return;
      }
      const signalMessage = {
        type: type,
        payload: payload,
      };
      try {
        await rtmChannel.sendMessage({ text: JSON.stringify(signalMessage) });
      } catch (error) {
        console.error(
          `${LOG_PREFIX_RTM_LISTEN} Error enviando señal '${type}':`,
          error,
        );
      }
    },
    [rtmChannel, isRtmChannelJoined, localUser],
  );

  const sendProfileUpdateRtmMessage = useCallback(
    async (rtmChannelInstance: RtmChannel, userProfile: UserInformation) => {
      if (!userProfile || userProfile.role === 'admin') {
        return;
      }

      const profileMessage = {
        type: 'PROFILE_UPDATE',
        payload: {
          user_id: userProfile.user_id,
          user_name: userProfile.user_name,
          avatar: userProfile.avatar,
          rtcUid: userProfile.rtcUid,
          rtmUid: userProfile.rtmUid,
          role: userProfile.role,
        },
      };

      try {
        await rtmChannelInstance.sendMessage({
          text: JSON.stringify(profileMessage),
        });
      } catch (rtmMsgError) {
        console.error(
          `${LOG_PREFIX_RTM_LISTEN} Error enviando mensaje de perfil RTM:`,
          rtmMsgError,
        );
      }
    },
    [],
  );

  const setupCallChannelListeners = useCallback(
    (rtmChannelInstance: RtmChannel) => {
      rtmChannelInstance.removeAllListeners('ChannelMessage');
      rtmChannelInstance.on(
        'ChannelMessage',
        ({ text }: any, senderId: string) => {
          try {
            const receivedMsg = JSON.parse(text ?? '');

            if (receivedMsg.type === 'PROFILE_UPDATE') {
              const remoteUserProfile = receivedMsg.payload as UserInformation;
              dispatch({
                type: AgoraActionType.ADD_REMOTE_USER,
                payload: {
                  rtcUid: String(remoteUserProfile.rtcUid),
                  rtmUid: String(remoteUserProfile.rtmUid),
                  user_id: remoteUserProfile.user_id,
                  user_name: remoteUserProfile.user_name,
                  avatar: remoteUserProfile.avatar,
                  role: remoteUserProfile.role,
                } as any,
              });

              const stringUid = String(remoteUserProfile.rtcUid);
              if (pendingProfilePromisesRef.current.has(stringUid)) {
                const resolve =
                  pendingProfilePromisesRef.current.get(stringUid);
                if (resolve) {
                  resolve();
                }
                pendingProfilePromisesRef.current.delete(stringUid);
              }

              if (
                state.localUser?.role === 'female' &&
                remoteUserProfile.role === 'male' &&
                (state.localUser.in_call !== 1 ||
                  state.localUser.status !== 'in_call')
              ) {
                broadcastLocalFemaleStatusUpdate({
                  in_call: 1,
                  status: 'in_call',
                  host_id: state.channelName,
                });
              }
            } else if (receivedMsg.type === 'CHAT_MESSAGE') {
              const newChatMessage: ChatMessage = {
                rtmUid: receivedMsg.payload.rtmUid,
                user_name: receivedMsg.payload.user_name,
                text: receivedMsg.payload.text,
                timestamp: receivedMsg.payload.timestamp,
                type: 'channel',
                translatedText: receivedMsg.payload.translatedText,
              };
              setChatMessages((prevMessages) => [
                ...prevMessages,
                newChatMessage,
              ]);
              dispatch({
                type: AgoraActionType.ADD_CHAT_MESSAGE,
                payload: newChatMessage,
              });
            } else if (receivedMsg.type === 'HOST_ENDED_CALL') {
              dispatch({
                type: AgoraActionType.REMOTE_HOST_ENDED_CALL,
                payload: {
                  message:
                    receivedMsg.payload?.message ||
                    'La anfitriona ha finalizado esta sesión.',
                  ended: true,
                },
              });
            } else if (receivedMsg.type === 'GIFT_SENT') {
              const giftData = receivedMsg.payload;
              let messageText: string;
              let messageType: 'channel-gift' | 'self-gift';

              if (localUser?.rtmUid === giftData.sender_rtm_uid) {
                messageText = `Has enviado un ${giftData.gift_name} a ${giftData.receiver_name}!`;
                messageType = 'self-gift';
              } else if (localUser?.rtmUid === giftData.receiver_rtm_uid) {
                messageText = `${giftData.sender_name} te ha enviado un ${giftData.gift_name}!`;
                messageType = 'channel-gift';
              } else {
                messageText = `${giftData.sender_name} ha enviado un ${giftData.gift_name} a ${giftData.receiver_name}!`;
                messageType = 'channel-gift';
              }

              const newGiftMessage: ChatMessage = {
                rtmUid: giftData.sender_rtm_uid,
                user_name: giftData.sender_name,
                text: messageText,
                timestamp: Date.now(),
                type: messageType,
                gift_image: giftData.gift_image_url,
              };

              setChatMessages((prevMessages) => [
                ...prevMessages,
                newGiftMessage,
              ]);
              dispatch({
                type: AgoraActionType.ADD_CHAT_MESSAGE,
                payload: newGiftMessage,
              });

              if (
                localUser?.role === 'female' &&
                localUser.rtmUid === giftData.receiver_rtm_uid
              ) {
                dispatch({
                  type: AgoraActionType.ADD_FEMALE_POINTS_EARNED,
                  payload: giftData.gift_points,
                });
              }
            } else if (receivedMsg.type === 'MALE_CALL_SUMMARY_SIGNAL') {
              if (localUser?.role === 'female') {
                const summaryPayload =
                  receivedMsg.payload as FemaleCallSummaryInfo;
                console.log(
                  `[Female Client] Recibido resumen de llamada del male:`,
                  summaryPayload,
                );
                
                if (summaryPayload.reason !== 'Finalizada por ti') {
                  broadcastLocalFemaleStatusUpdate({
                    in_call: 0,
                    status: 'available_call',
                    host_id: summaryPayload.host_id,
                    is_active: 1,
                  });
                }

                dispatch({
                  type: AgoraActionType.SET_FEMALE_CALL_ENDED_INFO,
                  payload: summaryPayload,
                });
                dispatch({
                  type: AgoraActionType.SET_FEMALE_CALL_ENDED_MODAL,
                  payload: true,
                });
              }
            }
          } catch (e) {
            console.error(
              `${LOG_PREFIX_RTM_LISTEN} Error parseando mensaje de Canal de Llamada:`,
              e,
            );
          }
        },
      );
      rtmChannelInstance.on('MemberJoined', (memberId) => {
        if (localUser && memberId !== localUser.rtmUid && rtmChannelInstance) {
          sendProfileUpdateRtmMessage(rtmChannelInstance, localUser);
        }
      });
    },
    [
      dispatch,
      localUser,
      sendProfileUpdateRtmMessage,
      state.localUser,
      state.channelName,
      broadcastLocalFemaleStatusUpdate,
      femaleTotalPointsEarnedInCall,
    ],
  );

  const joinCallChannel = useCallback(
    async (channelName: string) => {
      if (!localUser || !localUser.rtmUid || !appID) {
        throw new Error(
          'Usuario o AppID no disponible para canal de llamada RTM.',
        );
      }

      const rtmClientInstance = await initializeRtmClient(
        'Preparando el chat de la sala...',
      );

      if (!rtmClientInstance) {
        throw new Error(
          'Cliente RTM no disponible para unirse al canal de llamada.',
        );
      }

      if (
        rtmChannel &&
        isRtmChannelJoined &&
        rtmChannel.channelId === channelName
      ) {
        return rtmChannel;
      }

      if (rtmChannel && rtmChannel.channelId !== channelName) {
        try {
          await rtmChannel.leave();
        } catch (e) {
          console.warn(
            `${LOG_PREFIX_RTM_LISTEN} Error al dejar el canal RTM anterior:`,
            e,
          );
        }
      }

      const channel = rtmClientInstance.createChannel(channelName);
      await channel.join();
      setRtmChannel(channel);
      setIsRtmChannelJoined(true);
      setChatMessages([]);
      dispatch({ type: AgoraActionType.CLEAR_CHAT_MESSAGES });

      setupCallChannelListeners(channel);

      await sendProfileUpdateRtmMessage(channel, localUser);

      dispatch({
        type: AgoraActionType.RTM_JOIN_CHANNEL_SUCCESS,
        payload: { rtmChannel: channel },
      });

      return channel;
    },
    [
      dispatch,
      appID,
      localUser,
      initializeRtmClient,
      rtmClient,
      rtmChannel,
      isRtmChannelJoined,
      setupCallChannelListeners,
      sendProfileUpdateRtmMessage,
    ],
  );

  const sendChatMessage = useCallback(
    async (messageText: string) => {
      if (
        rtmChannel &&
        isRtmChannelJoined &&
        localUser &&
        localUser.role !== 'admin'
      ) {
        let translatedText: string | undefined;
        try {
          const translateResponse = await fetch('/api/translate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: messageText }),
          });

          if (translateResponse.ok) {
            const data = await translateResponse.json();
            translatedText = data.translatedText;
          } else {
            const errorData = await translateResponse.json();
            console.error(
              `${LOG_PREFIX_RTM_LISTEN} Error al traducir mensaje:`,
              errorData.details || errorData.error,
            );
            translatedText = undefined;
          }
        } catch (translationError) {
          console.error(
            `${LOG_PREFIX_RTM_LISTEN} Excepción al llamar a la API de traducción:`,
            translationError,
          );
          translatedText = undefined;
        }

        const chatMsgPayload = {
          text: messageText,
          rtmUid: String(localUser.rtmUid),
          user_name: localUser.user_name,
          timestamp: Date.now(),
          translatedText: translatedText,
        };

        const chatMsg = {
          type: 'CHAT_MESSAGE',
          payload: chatMsgPayload,
        };

        try {
          await rtmChannel.sendMessage({ text: JSON.stringify(chatMsg) });
          const selfMessage: ChatMessage = {
            rtmUid: String(localUser.rtmUid),
            user_name: localUser.user_name,
            text: messageText,
            timestamp: Date.now(),
            type: 'self',
            translatedText: translatedText,
          };
          setChatMessages((prevMessages) => [...prevMessages, selfMessage]);
          dispatch({
            type: AgoraActionType.ADD_CHAT_MESSAGE,
            payload: selfMessage,
          });
        } catch (error) {
          console.error(
            `${LOG_PREFIX_RTM_LISTEN} Error enviando mensaje de chat (después de traducción):`,
            error,
          );
        }
      } else {
        console.warn(
          `${LOG_PREFIX_RTM_LISTEN} No se puede enviar mensaje de chat. Condiciones no cumplidas.`,
          {
            hasRtmChannel: !!rtmChannel,
            isChannelJoined: isRtmChannelJoined,
            localUser: localUser,
          },
        );
      }
    },
    [rtmChannel, isRtmChannelJoined, localUser, dispatch],
  );

  const leaveCallChannel = useCallback(async () => {
    if (rtmChannel && isRtmChannelJoined) {
      try {
        await rtmChannel.leave();
      } catch (error) {
        console.error(
          `${LOG_PREFIX_RTM_LISTEN} Error al ejecutar rtmChannel.leave():`,
          error,
        );
      } finally {
        setRtmChannel(null);
        setIsRtmChannelJoined(false);
        setChatMessages([]);
        dispatch({ type: AgoraActionType.LEAVE_RTM_CALL_CHANNEL });
      }
    }
  }, [dispatch, rtmChannel, isRtmChannelJoined]);

  useEffect(() => {
    if (!isRtmChannelJoined && chatMessages.length > 0) {
      setChatMessages([]);
    }
  }, [isRtmChannelJoined, chatMessages.length]);

  const sendGift = useCallback(
    async (
      gifId: string | number,
      giftCostInMinutes: number,
      gift_image: string,
      giftPoints: number,
    ) => {
      if (
        !localUser ||
        localUser.role !== 'male' ||
        !state.channelName ||
        !state.localUser?.user_id
      ) {
        console.warn(
          `${LOG_PREFIX_RTM_LISTEN} No se puede enviar regalo. Male no logueado o en canal.`,
        );
        return {
          success: false,
          message:
            'Usuario no autorizado para enviar regalos o no en llamada activa.',
        };
      }

      if (!state.remoteUsers || state.remoteUsers.length === 0) {
        console.warn(
          `${LOG_PREFIX_RTM_LISTEN} No se puede enviar regalo. No hay female conectada.`,
        );
        return { success: false, message: 'No hay receptores disponibles.' };
      }

      if (state.maleInitialMinutesInCall === null) {
        console.warn(
          `${LOG_PREFIX_RTM_LISTEN} No se pueden validar minutos para regalo: maleInitialMinutesInCall no está establecido.`,
        );
        dispatch({
          type: AgoraActionType.SET_SHOW_UNEXPECTED_ERROR_MODAL,
          payload: true,
        });
        return {
          success: false,
          message: 'Error de cálculo de minutos iniciales.',
          cost_in_minutes: 0,
          gift_image_url: '',
        };
      }

      const [minutesStr, secondsStr] = callTimer.split(':');
      const totalElapsedSeconds =
        parseInt(minutesStr, 10) * 60 + parseInt(secondsStr, 10);

      const initialMinutesInSeconds = state.maleInitialMinutesInCall * 60;
      const giftMinutesSpentSoFarInSeconds = state.maleGiftMinutesSpent * 60;

      const currentRemainingSeconds =
        initialMinutesInSeconds -
        totalElapsedSeconds -
        giftMinutesSpentSoFarInSeconds;

      const newGiftCostInSeconds = giftCostInMinutes * 60;

      if (currentRemainingSeconds < newGiftCostInSeconds) {
        console.warn(
          `${LOG_PREFIX_RTM_LISTEN} Minutos insuficientes para enviar regalo. Requeridos para regalo: ${giftCostInMinutes}, Segundos restantes calculados: ${currentRemainingSeconds}.`,
        );
        dispatch({
          type: AgoraActionType.SET_SHOW_INSUFFICIENT_MINUTES_MODAL,
          payload: true,
        });
        return {
          success: false,
          message: 'Minutos insuficientes para enviar el regalo.',
          cost_in_minutes: 0,
          gift_image_url: '',
        };
      }

      const receiverFemale = state.remoteUsers.find(
        (u) => u.role === 'female' || u.role === 'admin',
      );

      if (!receiverFemale) {
        console.warn(
          `${LOG_PREFIX_RTM_LISTEN} No se encontró a la female receptora.`,
        );
        return { success: false, message: 'No se encontró a la receptora.' };
      }

      try {
        const result = await agoraBackend.handleSendGift(
          String(localUser.user_id),
          String(receiverFemale.user_id),
          gifId,
          state.channelName,
          giftCostInMinutes,
        );

        if (result.success) {
          dispatch({
            type: AgoraActionType.ADD_MALE_GIFT_MINUTES_SPENT,
            payload: giftCostInMinutes,
          });

          dispatch({
            type: AgoraActionType.ADD_FEMALE_POINTS_EARNED,
            payload: giftPoints,
          });

          const selfGiftMessage: ChatMessage = {
            rtmUid: String(localUser.rtmUid),
            user_name: localUser.user_name || 'Tú',
            text: `Has enviado un regalo a ${receiverFemale.user_name || 'la modelo'}! (${giftCostInMinutes} min)`,
            timestamp: Date.now(),
            gift_image: gift_image,
            type: 'self-gift',
          };
          setChatMessages((prevMessages) => [...prevMessages, selfGiftMessage]);
          dispatch({
            type: AgoraActionType.ADD_CHAT_MESSAGE,
            payload: selfGiftMessage,
          });

          const giftRtmMessage = {
            type: 'GIFT_SENT',
            payload: {
              sender_rtm_uid: String(localUser.rtmUid),
              sender_name: localUser.user_name || 'Anónimo',
              receiver_rtm_uid: String(receiverFemale.rtmUid),
              receiver_name: receiverFemale.user_name || 'Modelo',
              gif_id: gifId,
              gift_name: 'Regalo especial',
              cost_in_minutes: giftCostInMinutes,
              gift_image: gift_image,
              gift_points: giftPoints,
            },
          };
          await rtmChannel?.sendMessage({
            text: JSON.stringify(giftRtmMessage),
          });
          console.log('[Send Gift] Mensaje RTM de regalo enviado al canal.');
        }
        return result;
      } catch (error) {
        console.error(
          `${LOG_PREFIX_RTM_LISTEN} Error al enviar regalo:`,
          error,
        );
        return {
          success: false,
          message: 'Error al enviar el regalo.',
          cost_in_minutes: 0,
        };
      }
    },
    [
      localUser,
      state.channelName,
      state.localUser?.user_id,
      state.remoteUsers,
      agoraBackend,
      dispatch,
      rtmChannel,
    ],
  );

  return {
    rtmChannel,
    isRtmChannelJoined,
    chatMessages,
    joinCallChannel,
    sendChatMessage,
    leaveCallChannel,
    sendCallSignal,
    waitForUserProfile,
    sendGift,
  };
};
