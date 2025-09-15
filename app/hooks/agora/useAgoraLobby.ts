import { useState, useEffect, useCallback, useRef } from 'react';
import { RtmClient, RtmChannel } from 'agora-rtm-sdk';
import {
  AgoraAction,
  AgoraActionType,
  UserInformation,
} from '@/app/types/streams';
import { useAgoraServer } from './useAgoraServer';
import { useUser } from '@/app/context/useClientContext';
import {
  LOBBY_RTM_CHANNEL_NAME,
  LOG_PREFIX_LOBBY,
  LOG_PREFIX_RTM_LISTEN,
} from '@/lib/constants';

export const useAgoraLobby = (
  dispatch: React.Dispatch<AgoraAction>,
  appID: string | null,
  localUser: UserInformation | null,
  rtmClient: RtmClient | null,
  isRtmLoggedIn: boolean,
  agoraBackend: ReturnType<typeof useAgoraServer>,
  initializeRtmClient: (loadingMessage?: string) => Promise<RtmClient | null>,
  globalOnlineFemalesList: UserInformation[],
) => {
  const { state: userState } = useUser();
  const [lobbyRtmChannel, setLobbyRtmChannel] = useState<RtmChannel | null>(
    null,
  );
  const [isLobbyJoined, setIsLobbyJoined] = useState(false);
  const [isLoadingOnlineFemales, setIsLoadingOnlineFemales] = useState(false);
  const [onlineFemalesError, setOnlineFemalesError] = useState<string | null>(
    null,
  );

  const presenceCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const onlineFemalesListRef = useRef<UserInformation[]>(
    globalOnlineFemalesList,
  );

  useEffect(() => {
    onlineFemalesListRef.current = globalOnlineFemalesList;
  }, [globalOnlineFemalesList]);

  const verifyLobbyPresence = useCallback(
    async (channelInstance: RtmChannel, reason = 'manual') => {
      try {
        // Verificar que el canal y el cliente RTM estén en buen estado
        if (!channelInstance || !isLobbyJoined) {
          console.warn(
            `${LOG_PREFIX_LOBBY} Saltando verificación de presencia - canal no disponible (${reason})`,
          );
          return;
        }

        // Verificar que el cliente RTM esté logueado
        if (!rtmClient || !isRtmLoggedIn) {
          console.warn(
            `${LOG_PREFIX_LOBBY} Saltando verificación de presencia - cliente RTM no logueado (${reason})`,
          );
          return;
        }

        const currentMembers = await channelInstance.getMembers();
        const currentList = onlineFemalesListRef.current;

        currentList.forEach((female) => {
          if (female.role === 'female') {
            const isPresent = currentMembers.includes(String(female.rtmUid));
            const currentStatus = female.status;

            if (!isPresent && currentStatus !== 'offline') {
              const updatedFemale = {
                ...female,
                status: 'offline',
              } as typeof female;

              dispatch({
                type: AgoraActionType.UPDATE_ONE_FEMALE_IN_LIST,
                payload: updatedFemale,
              });
            } else if (isPresent && currentStatus === 'offline') {
              const newStatus =
                female.in_call === 1
                  ? 'in_call'
                  : female.host_id
                    ? 'available_call'
                    : 'online';

              const updatedFemale = {
                ...female,
                status: newStatus,
              } as typeof female;

              dispatch({
                type: AgoraActionType.UPDATE_ONE_FEMALE_IN_LIST,
                payload: updatedFemale,
              });
            }
          }
        });
      } catch (error: any) {
        const errorCode = error?.code;
        const errorMessage = error?.message || error;

        // Error 102: Cliente no logueado - intentar reconectar
        if (errorCode === 102) {
          console.warn(
            `${LOG_PREFIX_LOBBY} Cliente RTM no logueado durante verificación de presencia (${reason}). Intentando reconectar...`,
          );
          
          // Intentar reinicializar RTM client
          try {
            await initializeRtmClient('Reconectando servicios de lobby...');
          } catch (reconnectError) {
            console.error(
              `${LOG_PREFIX_LOBBY} Error en reconexión RTM:`,
              reconnectError,
            );
          }
        }
        // Error 4: Timeout - no es crítico, solo log
        else if (errorCode === 4) {
          console.warn(
            `${LOG_PREFIX_LOBBY} Timeout en verificación de presencia (${reason}) - continuando...`,
          );
        }
        // Otros errores
        else {
          console.warn(
            `${LOG_PREFIX_LOBBY} Error en verificación de presencia (${reason}):`,
            errorMessage,
          );
        }
      }
    },
    [dispatch, isLobbyJoined, rtmClient, isRtmLoggedIn, initializeRtmClient],
  );

  useEffect(() => {
    return () => {
      if (presenceCheckIntervalRef.current) {
        clearInterval(presenceCheckIntervalRef.current);
        presenceCheckIntervalRef.current = null;
      }
    };
  }, []);

  const setupLobbyRtmChannelListeners = useCallback(
    (rtmChannelInstance: RtmChannel, rtmClientInstance: RtmClient) => {
      rtmChannelInstance.removeAllListeners('ChannelMessage');
      rtmChannelInstance.removeAllListeners('MemberJoined');
      rtmChannelInstance.removeAllListeners('MemberLeft');

      rtmClientInstance.removeAllListeners('ConnectionStateChanged');

      rtmChannelInstance.on('MemberJoined', (memberId: string) => {
        const currentList = onlineFemalesListRef.current;
        const femaleToUpdate = currentList.find(
          (female) =>
            String(female.rtmUid) === memberId && female.role === 'female',
        );

        if (femaleToUpdate) {
          const updatedFemale = {
            ...femaleToUpdate,
            status:
              femaleToUpdate.in_call === 1
                ? 'in_call'
                : femaleToUpdate.host_id
                  ? 'available_call'
                  : 'online',
          } as typeof femaleToUpdate;

          dispatch({
            type: AgoraActionType.UPDATE_ONE_FEMALE_IN_LIST,
            payload: updatedFemale,
          });
        }
      });

      rtmChannelInstance.on('MemberLeft', (memberId: string) => {
        const currentList = onlineFemalesListRef.current;
        const femaleToUpdate = currentList.find(
          (female) =>
            String(female.rtmUid) === memberId && female.role === 'female',
        );

        if (femaleToUpdate) {
          const updatedFemale = {
            ...femaleToUpdate,
            status: 'offline',
            in_call: 0,
            host_id: null,
            is_active: 0,
          } as typeof femaleToUpdate;

          dispatch({
            type: AgoraActionType.UPDATE_ONE_FEMALE_IN_LIST,
            payload: updatedFemale,
          });

          if (femaleToUpdate.host_id && femaleToUpdate.status === 'in_call') {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('femaleDisconnectedFromCall', {
                  detail: {
                    femaleName: femaleToUpdate.user_name || 'La modelo',
                    femaleId: femaleToUpdate.user_id,
                    channelId: femaleToUpdate.host_id,
                    reason: 'connection_lost',
                  },
                }),
              );
            }

            fetch('/api/agora/channels/emergency-cleanup', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                user_id: femaleToUpdate.user_id,
                channel_name: femaleToUpdate.host_id,
                room_id: null,
                role: 'female',
                reason: 'member_left_lobby',
                backend_action: 'close_channel_finished',
              }),
            }).catch((error) => {
              console.warn('Error en limpieza de backend:', error);
            });
          }
        }
      });

      rtmClientInstance.on(
        'ConnectionStateChanged',
        (newState: string, reason: string) => {
          if (
            newState === 'ABORTED' ||
            newState === 'FAILED' ||
            newState === 'DISCONNECTED' ||
            newState === 'RECONNECTING'
          ) {
            if (newState === 'ABORTED' || newState === 'FAILED') {
              verifyLobbyPresence(
                rtmChannelInstance,
                `connection-${newState.toLowerCase()}`,
              );
            } else {
              setTimeout(
                () =>
                  verifyLobbyPresence(
                    rtmChannelInstance,
                    `connection-${newState.toLowerCase()}`,
                  ),
                500,
              );
            }
          }
        },
      );

      rtmChannelInstance.on(
        'ChannelMessage',
        ({ text }: any, senderId: string) => {
          try {
            const receivedMsg = JSON.parse(text ?? '');

            if (receivedMsg.type === 'FEMALE_FULL_STATUS_UPDATE') {
              const updatedFemale = receivedMsg.payload as UserInformation;
              dispatch({
                type: AgoraActionType.UPDATE_ONE_FEMALE_IN_LIST,
                payload: updatedFemale,
              });
            } else if (
              receivedMsg.type === 'CONTACT_ADDED_NOTIFICATION' ||
              receivedMsg.type === 'CONTACT_REMOVED_NOTIFICATION'
            ) {
              const notification = receivedMsg.payload;

              const currentUserId = userState.user?.id;

              if (notification.toUserId === currentUserId) {
                const action =
                  receivedMsg.type === 'CONTACT_ADDED_NOTIFICATION'
                    ? 'agregado'
                    : 'eliminado';

                if (typeof window !== 'undefined') {
                  window.dispatchEvent(
                    new CustomEvent('contactNotificationReceived', {
                      detail: notification,
                    }),
                  );
                }
              }
            }
          } catch (e) {
            console.error(
              `${LOG_PREFIX_RTM_LISTEN} Error parseando mensaje de Lobby:`,
              e,
            );
          }
        },
      );
    },
    [dispatch, verifyLobbyPresence],
  );

  const fetchOnlineFemalesList = useCallback(async () => {
    if (isLoadingOnlineFemales || !localUser) {
      return;
    }

    setIsLoadingOnlineFemales(true);
    setOnlineFemalesError(null);
    dispatch({ type: AgoraActionType.FETCH_ONLINE_FEMALES_START });

    try {
      const females = await agoraBackend.fetchOnlineFemales();
      dispatch({
        type: AgoraActionType.FETCH_ONLINE_FEMALES_SUCCESS,
        payload: females,
      });
    } catch (error: any) {
      const errMsg = error.message || 'Error al cargar lista de modelos.';
      setOnlineFemalesError(errMsg);
      dispatch({
        type: AgoraActionType.FETCH_ONLINE_FEMALES_FAILURE,
        payload: errMsg,
      });
    } finally {
      setIsLoadingOnlineFemales(false);
    }
  }, [dispatch, localUser, isLoadingOnlineFemales, agoraBackend]);

  const broadcastLocalFemaleStatusUpdate = useCallback(
    async (statusUpdatePayload: Partial<UserInformation>) => {
      if (
        lobbyRtmChannel &&
        isLobbyJoined &&
        localUser &&
        localUser.role === 'female'
      ) {
        const currentProfile =
          onlineFemalesListRef.current.find(
            (f) => f.rtmUid === localUser.rtmUid,
          ) || localUser;

        const payloadToSend: UserInformation = {
          ...(currentProfile as UserInformation),
          ...(statusUpdatePayload as UserInformation),
          user_id: localUser.user_id,
          rtmUid: localUser.rtmUid,
          rtcUid: localUser.rtcUid,
          user_name:
            statusUpdatePayload.user_name ??
            currentProfile.user_name ??
            localUser.user_name,
          avatar:
            statusUpdatePayload.avatar ??
            currentProfile.avatar ??
            localUser.avatar,
          role: 'female',
          is_active:
            typeof statusUpdatePayload.is_active === 'number'
              ? statusUpdatePayload.is_active
              : (currentProfile.is_active ?? 1),
        };
        if (!payloadToSend.status) {
          if (payloadToSend.in_call === 1 && payloadToSend.host_id)
            payloadToSend.status = 'in_call';
          else if (payloadToSend.host_id)
            payloadToSend.status = 'available_call';
          else if (payloadToSend.is_active === 1)
            payloadToSend.status = 'online';
          else payloadToSend.status = 'offline';
        }
        const rtmMessage = {
          type: 'FEMALE_FULL_STATUS_UPDATE',
          payload: payloadToSend,
        };
        try {
          await lobbyRtmChannel.sendMessage({
            text: JSON.stringify(rtmMessage),
          });
        } catch (error) {
          console.error(
            `${LOG_PREFIX_LOBBY} Error enviando FEMALE_FULL_STATUS_UPDATE a lobby o actualizando backend:`,
            error,
          );
        }
      } else {
        console.warn(
          `${LOG_PREFIX_LOBBY} No se puede hacer broadcast de female status. Condiciones no cumplidas.`,
          {
            hasLobbyChannel: !!lobbyRtmChannel,
            isLobbyJoined: isLobbyJoined,
            isLocalUserFemale: localUser?.role === 'female',
            localUser: localUser,
          },
        );
      }
    },
    [lobbyRtmChannel, isLobbyJoined, localUser, agoraBackend],
  );

  const joinLobby = useCallback(async () => {
    if (!localUser || !localUser.rtmUid || !appID) {
      const msg = 'Usuario o AppID no disponible para lobby.';
      setOnlineFemalesError(msg);
      dispatch({ type: AgoraActionType.JOIN_LOBBY_FAILURE, payload: msg });
      return;
    }
    if (isLobbyJoined && lobbyRtmChannel) {
      return;
    }

    const rtmClientInstance = await initializeRtmClient(
      'Conectando al lobby para actualizaciones...',
    );

    if (!rtmClientInstance) {
      const msg = 'Cliente RTM no disponible para el lobby.';
      setOnlineFemalesError(msg);
      dispatch({ type: AgoraActionType.JOIN_LOBBY_FAILURE, payload: msg });
      throw new Error(msg);
    }

    dispatch({ type: AgoraActionType.JOIN_LOBBY_START });
    setOnlineFemalesError(null);

    try {
      const channel = rtmClientInstance.createChannel(LOBBY_RTM_CHANNEL_NAME);
      await channel.join();
      setLobbyRtmChannel(channel);
      setIsLobbyJoined(true);

      setupLobbyRtmChannelListeners(channel, rtmClientInstance);

      try {
        const members = await channel.getMembers();
        const currentList = onlineFemalesListRef.current;

        currentList.forEach((female) => {
          if (
            members.includes(String(female.rtmUid)) &&
            female.role === 'female'
          ) {
            const updatedStatus =
              female.in_call === 1
                ? 'in_call'
                : female.host_id
                  ? 'available_call'
                  : 'online';

            if (female.status !== updatedStatus) {
              const updatedFemale = {
                ...female,
                status: updatedStatus,
              } as typeof female;

              dispatch({
                type: AgoraActionType.UPDATE_ONE_FEMALE_IN_LIST,
                payload: updatedFemale,
              });
            }
          }
        });
      } catch (error) {
        console.warn(
          `${LOG_PREFIX_LOBBY} No se pudieron obtener miembros del lobby:`,
          error,
        );
      }

      dispatch({
        type: AgoraActionType.JOIN_LOBBY_SUCCESS,
        payload: { lobbyRtmChannel: channel },
      });

      presenceCheckIntervalRef.current = setInterval(async () => {
        // Solo verificar si estamos en buen estado
        if (isLobbyJoined && isRtmLoggedIn && channel) {
          try {
            await verifyLobbyPresence(channel, 'periodic-check');
          } catch (error: any) {
            const errorCode = error?.code;
            
            // Si es error 102 (no logueado), parar las verificaciones periódicas
            if (errorCode === 102) {
              console.warn(
                `${LOG_PREFIX_LOBBY} Deteniendo verificaciones periódicas - cliente RTM no logueado`,
              );
              if (presenceCheckIntervalRef.current) {
                clearInterval(presenceCheckIntervalRef.current);
                presenceCheckIntervalRef.current = null;
              }
            } else {
              console.warn(
                `${LOG_PREFIX_LOBBY} Error en verificación periódica de presencia:`,
                error,
              );
            }
          }
        } else {
          console.warn(
            `${LOG_PREFIX_LOBBY} Saltando verificación periódica - estado no válido`,
            { isLobbyJoined, isRtmLoggedIn, hasChannel: !!channel }
          );
        }
      }, 30000); 

      if (localUser.role === 'female' && localUser.is_active === 1) {
        await broadcastLocalFemaleStatusUpdate({});
      }
    } catch (error: any) {
      console.error(`${LOG_PREFIX_LOBBY} Error al unirse al lobby:`, error);
      const errMsg = error.message || 'Error al unirse al lobby.';
      setOnlineFemalesError(errMsg);
      dispatch({ type: AgoraActionType.JOIN_LOBBY_FAILURE, payload: errMsg });
    }
  }, [
    dispatch,
    appID,
    localUser,
    isLobbyJoined,
    lobbyRtmChannel,
    rtmClient,
    initializeRtmClient,
    setupLobbyRtmChannelListeners,
    broadcastLocalFemaleStatusUpdate,
  ]);

  const leaveLobby = useCallback(async () => {
    if (lobbyRtmChannel && isLobbyJoined) {
      try {
        if (localUser?.role === 'female') {
          await broadcastLocalFemaleStatusUpdate({
            host_id: null,
            status: 'online',
            in_call: 0,
            is_active: 1,
          });
        }
        await lobbyRtmChannel.leave();
      } catch (error) {
        console.error(
          `${LOG_PREFIX_LOBBY} Error al ejecutar lobbyRtmChannel.leave():`,
          error,
        );
      } finally {
        if (presenceCheckIntervalRef.current) {
          clearInterval(presenceCheckIntervalRef.current);
          presenceCheckIntervalRef.current = null;
        }

        setLobbyRtmChannel(null);
        setIsLobbyJoined(false);
        dispatch({ type: AgoraActionType.LEAVE_LOBBY });
      }
    } else {
      if (isLobbyJoined || lobbyRtmChannel) {
        if (presenceCheckIntervalRef.current) {
          clearInterval(presenceCheckIntervalRef.current);
          presenceCheckIntervalRef.current = null;
        }

        setLobbyRtmChannel(null);
        setIsLobbyJoined(false);
        dispatch({ type: AgoraActionType.LEAVE_LOBBY });
      }
    }
  }, [
    dispatch,
    lobbyRtmChannel,
    isLobbyJoined,
    localUser,
    broadcastLocalFemaleStatusUpdate,
  ]);

  const sendContactNotificationThroughLobby = useCallback(
    async (
      targetUserId: string | number,
      targetUserName: string,
      action: 'added' | 'removed',
    ) => {
      if (!lobbyRtmChannel || !isLobbyJoined || !localUser) {
        console.warn(
          `[Lobby Client] No se puede enviar notificación de contacto. Lobby no disponible.`,
          {
            hasLobbyChannel: !!lobbyRtmChannel,
            isLobbyJoined,
            hasLocalUser: !!localUser,
          },
        );
        return false;
      }

      try {
        const notificationMessage = {
          type:
            action === 'added'
              ? 'CONTACT_ADDED_NOTIFICATION'
              : 'CONTACT_REMOVED_NOTIFICATION',
          payload: {
            fromUserId: localUser.user_id,
            fromUserName: localUser.user_name || 'Usuario',
            fromUserAvatar: localUser.avatar,
            toUserId: targetUserId,
            timestamp: Date.now(),
            action,
          },
        };

        await lobbyRtmChannel.sendMessage({
          text: JSON.stringify(notificationMessage),
        });

        return true;
      } catch (error) {
        console.error(
          `[Lobby Client] ❌ Error enviando notificación de contacto a través del lobby para ${targetUserName} (${targetUserId}):`,
          error,
        );
        return false;
      }
    },
    [lobbyRtmChannel, isLobbyJoined, localUser],
  );

  return {
    lobbyRtmChannel,
    isLobbyJoined,
    onlineFemalesList: globalOnlineFemalesList,
    isLoadingOnlineFemales,
    onlineFemalesError,
    fetchOnlineFemalesList,
    joinLobby,
    leaveLobby,
    broadcastLocalFemaleStatusUpdate,
    sendContactNotificationThroughLobby,
  };
};
