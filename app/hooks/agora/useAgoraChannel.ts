import { useState, useEffect, useCallback, useRef } from 'react';
import { RtmClient, RtmChannel } from 'agora-rtm-sdk';
import {
  AgoraAction,
  AgoraActionType,
  ChatMessage,
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
  remoteUsers: UserInformation[] | null,
) => {
  const [rtmChannel, setRtmChannel] = useState<RtmChannel | null>(null);
  const [isRtmChannelJoined, setIsRtmChannelJoined] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const pendingProfilePromisesRef = useRef(new Map<string, () => void>());

  const waitForUserProfile = useCallback((uidToWaitFor: string | number) => {
    const stringUid = String(uidToWaitFor);
    if (remoteUsers?.find((u) => String(u.rtcUid) === stringUid)) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      pendingProfilePromisesRef.current.set(stringUid, resolve);
    });
  }, []);

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
    [dispatch, localUser, sendProfileUpdateRtmMessage],
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
  }, [isRtmChannelJoined]);

  return {
    rtmChannel,
    isRtmChannelJoined,
    chatMessages,
    joinCallChannel,
    sendChatMessage,
    leaveCallChannel,
    sendCallSignal,
    waitForUserProfile,
  };
};
