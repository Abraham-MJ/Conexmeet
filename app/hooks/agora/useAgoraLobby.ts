import { useState, useEffect, useCallback, useRef } from 'react';
import { RtmClient, RtmChannel } from 'agora-rtm-sdk';
import {
  AgoraAction,
  AgoraActionType,
  UserInformation,
} from '@/app/types/streams';
import { useAgoraServer } from './useAgoraServer';
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
) => {
  const [lobbyRtmChannel, setLobbyRtmChannel] = useState<RtmChannel | null>(
    null,
  );
  const [isLobbyJoined, setIsLobbyJoined] = useState(false);
  const [onlineFemalesList, setOnlineFemalesList] = useState<UserInformation[]>(
    [],
  );
  const [isLoadingOnlineFemales, setIsLoadingOnlineFemales] = useState(false);
  const [onlineFemalesError, setOnlineFemalesError] = useState<string | null>(
    null,
  );

  const onlineFemalesListRef = useRef<UserInformation[]>([]);
  useEffect(() => {
    onlineFemalesListRef.current = onlineFemalesList;
  }, [onlineFemalesList]);

  const setupLobbyRtmChannelListeners = useCallback(
    (rtmChannelInstance: RtmChannel) => {
      rtmChannelInstance.removeAllListeners('ChannelMessage');

      rtmChannelInstance.on(
        'ChannelMessage',
        ({ text }: any, senderId: string) => {
          try {
            const receivedMsg = JSON.parse(text ?? '');
            console.log(
              `[Lobby Client] Received RTM ChannelMessage from ${senderId}:`,
              receivedMsg,
            );

            if (receivedMsg.type === 'FEMALE_FULL_STATUS_UPDATE') {
              const updatedFemale = receivedMsg.payload as UserInformation;
              dispatch({
                type: AgoraActionType.UPDATE_ONE_FEMALE_IN_LIST,
                payload: updatedFemale,
              });
              console.log(
                '[Lobby Client] Dispatched UPDATE_ONE_FEMALE_IN_LIST with payload:',
                receivedMsg.payload,
              );

              setOnlineFemalesList((prevList) => {
                const existingIndex = prevList.findIndex(
                  (f) => f.rtmUid === updatedFemale.rtmUid,
                );
                if (existingIndex > -1) {
                  const newList = [...prevList];
                  newList[existingIndex] = updatedFemale;
                  return newList;
                } else {
                  return [...prevList, updatedFemale];
                }
              });
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
    [dispatch],
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
      setOnlineFemalesList(females);
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
          console.log(
            '[Female Client] Intentando actualizar el backend y el lobby con el estado de la female:',
            statusUpdatePayload,
          );

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

      setupLobbyRtmChannelListeners(channel);

      dispatch({
        type: AgoraActionType.JOIN_LOBBY_SUCCESS,
        payload: { lobbyRtmChannel: channel },
      });

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
        setLobbyRtmChannel(null);
        setIsLobbyJoined(false);
        dispatch({ type: AgoraActionType.LEAVE_LOBBY });
      }
    } else {
      if (isLobbyJoined || lobbyRtmChannel) {
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

  return {
    lobbyRtmChannel,
    isLobbyJoined,
    onlineFemalesList,
    isLoadingOnlineFemales,
    onlineFemalesError,
    fetchOnlineFemalesList,
    joinLobby,
    leaveLobby,
    broadcastLocalFemaleStatusUpdate,
  };
};
