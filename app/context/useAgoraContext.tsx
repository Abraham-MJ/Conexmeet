'use client';

import {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { useRouter } from 'next/navigation';
import AgoraRTC, {
  IAgoraRTCClient,
  IMicrophoneAudioTrack,
  ICameraVideoTrack,
} from 'agora-rtc-sdk-ng';
import AgoraRTM, { RtmClient, RtmChannel } from 'agora-rtm-sdk';
import { useUser } from './useClientContext';
import { createHost } from '@/lib/generate-token';
import { agoraReducer, initialState } from './agoraReducer';
import {
  AgoraAction,
  AgoraActionType,
  AgoraState,
  UserInformation,
  ChatMessage,
  LoadingStatus,
} from '../types/streams';

AgoraRTC.setLogLevel(1);

const LOBBY_RTM_CHANNEL_NAME = 'CONEXMEET_GLOBAL_LOBBY_CHANNEL';
const LOG_PREFIX_PROVIDER = '[AgoraProvider]';
const LOG_PREFIX_FEMALE = '[FemaleFlow]';
const LOG_PREFIX_MALE_ADMIN = '[MaleAdminFlow]';
const LOG_PREFIX_LOBBY = '[LobbyFlow]';
const LOG_PREFIX_RTM_LISTEN = '[RTM Listener]';

const AgoraContext = createContext<{
  state: AgoraState;
  dispatch: React.Dispatch<AgoraAction>;
  sendRtmChannelMessage: (messageText: string) => Promise<void>;
  handleVideoChatMale: (channelToJoin?: string) => Promise<void>;
  handleVideoChatFemale: () => Promise<void>;
  fetchInitialOnlineFemalesList: () => Promise<void>;
  joinLobbyForRealtimeUpdates: () => Promise<void>;
  leaveLobbyChannel: () => Promise<void>;
  broadcastLocalFemaleStatusUpdate: (
    statusInfo: Partial<UserInformation>,
  ) => Promise<void>;
  loadingStatus: LoadingStatus;
  toggleLocalAudio: () => Promise<void>;
  toggleLocalVideo: () => Promise<void>;
  handleLeaveCall: () => Promise<void>;
}>({
  state: initialState,
  dispatch: () => undefined,
  sendRtmChannelMessage: async () => {},
  handleVideoChatMale: async () => {},
  handleVideoChatFemale: async () => {},
  fetchInitialOnlineFemalesList: async () => {},
  joinLobbyForRealtimeUpdates: async () => {},
  leaveLobbyChannel: async () => {},
  broadcastLocalFemaleStatusUpdate: async () => {},
  loadingStatus: { message: '', isLoading: false },
  toggleLocalAudio: async () => {},
  toggleLocalVideo: async () => {},
  handleLeaveCall: async () => {},
});

export function AgoraProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { state: user } = useUser();

  const [state, dispatch] = useReducer(agoraReducer, initialState);

  useEffect(() => {
    if (user.user) {
      let role: 'female' | 'male' | 'admin' | undefined = undefined;
      if (user.user.name === 'Abraham Moreno') {
        role = 'admin';
      } else if (user.user.gender === 'female' || user.user.type === 'host') {
        role = 'female';
      } else if (user.user.gender === 'male') {
        role = 'male';
      }
      const localUserProfile: UserInformation = {
        user_id: user.user.id,
        rtcUid: user.user.id,
        rtmUid: user.user.id,
        user_name: user.user.name,
        avatar: user.user.profile_photo_path,
        role: role,
        is_active: 1,
        in_call: 0,
        host_id: null,
      };
      dispatch({
        type: AgoraActionType.SET_LOCAL_USER_PROFILE,
        payload: localUserProfile,
      });
    } else if (!user.user) {
      dispatch({ type: AgoraActionType.SET_LOCAL_USER_PROFILE, payload: null });
    }
  }, [user.user, dispatch]);

  const broadcastLocalFemaleStatusUpdate = useCallback(
    async (statusUpdatePayload: Partial<UserInformation>) => {
      if (
        state.lobbyRtmChannel &&
        state.isLobbyJoined &&
        state.localUser &&
        state.localUser.role === 'female'
      ) {
        const currentProfile =
          state.onlineFemalesList.find(
            (f) => f.rtmUid === state.localUser!.rtmUid,
          ) || state.localUser;
        const payloadToSend: UserInformation = {
          ...(currentProfile as UserInformation),
          ...(statusUpdatePayload as UserInformation),
          user_id: state.localUser.user_id,
          rtmUid: state.localUser.rtmUid,
          rtcUid: state.localUser.rtcUid,
          user_name:
            statusUpdatePayload.user_name ??
            currentProfile.user_name ??
            state.localUser.user_name,
          avatar:
            statusUpdatePayload.avatar ??
            currentProfile.avatar ??
            state.localUser.avatar,
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
          await state.lobbyRtmChannel.sendMessage({
            text: JSON.stringify(rtmMessage),
          });
        } catch (error) {
          console.log(
            `${LOG_PREFIX_LOBBY} Error sending FEMALE_FULL_STATUS_UPDATE:`,
            error,
          );
        }
      } else {
        console.log(
          `${LOG_PREFIX_LOBBY} Cannot broadcast female status. Conditions not met. Lobby joined: ${state.isLobbyJoined}, Has lobby channel: ${!!state.lobbyRtmChannel}, Is female: ${state.localUser?.role === 'female'} (Full localUser: ${JSON.stringify(state.localUser)})`,
        );
      }
    },
    [
      state.lobbyRtmChannel,
      state.isLobbyJoined,
      state.localUser,
      state.onlineFemalesList,
      state.rtmClient,
      state.isRtmLoggedIn,
    ],
  );

  const setupRtmChannelListeners = useCallback(
    (rtmChannelInstance: RtmChannel, isLobbyChannel: boolean = false) => {
      rtmChannelInstance.removeAllListeners('ChannelMessage');
      rtmChannelInstance.on(
        'ChannelMessage',
        ({ text }: any, senderId: string) => {
          try {
            const receivedMsg = JSON.parse(text ?? '');
            console.log('RECEIVED MESSAGE:', receivedMsg);

            if (isLobbyChannel) {
              if (receivedMsg.type === 'FEMALE_FULL_STATUS_UPDATE') {
                dispatch({
                  type: AgoraActionType.UPDATE_ONE_FEMALE_IN_LIST,
                  payload: receivedMsg.payload as UserInformation,
                });
              }
            } else {
              if (receivedMsg.type === 'PROFILE_UPDATE') {
                const remoteUserProfile =
                  receivedMsg.payload as UserInformation;

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
                dispatch({
                  type: AgoraActionType.ADD_CHAT_MESSAGE,
                  payload: {
                    rtmUid: receivedMsg.payload.rtmUid,
                    user_name: receivedMsg.payload.user_name,
                    text: receivedMsg.payload.text,
                    timestamp: receivedMsg.payload.timestamp,
                    type: 'channel',
                  } as ChatMessage,
                });
              } else if (receivedMsg.type === 'HOST_ENDED_CALL') {
                console.log(
                  `${LOG_PREFIX_RTM_LISTEN} Anfitriona ha finalizado la llamada en el canal ${state.channelName}. Despachando REMOTE_HOST_ENDED_CALL.`,
                );
                dispatch({
                  type: AgoraActionType.REMOTE_HOST_ENDED_CALL,
                  payload: {
                    message: 'La anfitriona ha finalizado esta sesión.',
                  },
                });
              }
            }
          } catch (e) {}
        },
      );
    },
    [
      dispatch,
      state.remoteUsers,
      state.localUser,
      state.channelName,
      broadcastLocalFemaleStatusUpdate,
    ],
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

  const setupRtcClientListeners = useCallback(
    (currentRtcClient: IAgoraRTCClient) => {
      currentRtcClient.removeAllListeners();

      // currentRtcClient.on(
      //   'connection-state-change',
      //   (curState, prevState, reason) => {
      //     console.log(
      //       `${LOG_PREFIX_PROVIDER} RTC Estado conexión: ${prevState} -> ${curState}, Razón: ${reason}`,
      //     );
      //   },
      // );

      currentRtcClient.on('user-published', async (remoteUser, mediaType) => {
        if (mediaType !== 'audio' && mediaType !== 'video') return;
        try {
          await currentRtcClient!.subscribe(remoteUser, mediaType);

          dispatch({
            type: AgoraActionType.UPDATE_REMOTE_USER_TRACK_STATE,
            payload: {
              rtcUid: String(remoteUser.uid),
              mediaType,
              isPublishing: true,
              track:
                mediaType === 'audio'
                  ? remoteUser.audioTrack
                  : remoteUser.videoTrack,
            },
          });

          if (mediaType === 'audio' && remoteUser.audioTrack) {
            remoteUser.audioTrack.play();
          }
        } catch (subError) {
          console.error(
            `${LOG_PREFIX_PROVIDER} RTC Error al suscribir:`,
            subError,
          );
        }
      });

      currentRtcClient.on(
        'user-unpublished',
        (remoteUserUnpublishing, mediaType) => {
          if (mediaType !== 'audio' && mediaType !== 'video') return;
          dispatch({
            type: AgoraActionType.UPDATE_REMOTE_USER_TRACK_STATE,
            payload: {
              rtcUid: String(remoteUserUnpublishing.uid),
              mediaType,
              isPublishing: false,
            },
          });

          if (state.localUser?.role === 'female' && mediaType === 'video') {
            // O relevante para audio también
            const userWhoUnpublished = state.remoteUsers.find(
              (u) => u.rtcUid === String(remoteUserUnpublishing.uid),
            );

            if (userWhoUnpublished?.role === 'male') {
              // Se actualiza el estado de hasAudio/hasVideo en UPDATE_REMOTE_USER_TRACK_STATE
              // Luego, se verifica si este usuario ya no tiene ni audio ni video activo
              const remoteUserAfterUpdate = state.remoteUsers.find(
                (u) => u.rtcUid === String(remoteUserUnpublishing.uid),
              );

              if (
                remoteUserAfterUpdate &&
                !remoteUserAfterUpdate.hasAudio &&
                !remoteUserAfterUpdate.hasVideo
              ) {
                console.log(
                  `${LOG_PREFIX_FEMALE} El último male ha dejado de publicar. Actualizando estado a available_call.`,
                );
                broadcastLocalFemaleStatusUpdate({
                  in_call: 0,
                  status: 'available_call',
                });
              }
            }
          }
        },
      );

      currentRtcClient.on('user-left', (remoteUserLeaving) => {
        const userWhoLeft = state.remoteUsers.find(
          (u) => u.rtcUid === String(remoteUserLeaving.uid),
        ); // Es importante obtener el perfil del usuario que se va ANTES de quitarlo del estado.

        dispatch({
          type: AgoraActionType.REMOVE_REMOTE_USER,
          payload: { rtcUid: String(remoteUserLeaving.uid) },
        });

        if (state.localUser?.role === 'female') {
          // Verificar si el usuario que salió era 'male'
          if (userWhoLeft?.role === 'male') {
            // Verificar si aún quedan otros usuarios 'male' activos en la llamada
            // Se revisa state.remoteUsers DESPUÉS de haber despachado REMOVE_REMOTE_USER.
            const remainingActiveMales = state.remoteUsers.filter(
              (u) => u.role === 'male' && (u.hasAudio || u.hasVideo),
            );

            if (remainingActiveMales.length === 0) {
              // Si no quedan otros 'males' activos, la 'female' ahora está disponible para otra llamada.
              console.log(
                `${LOG_PREFIX_FEMALE} El último male ha salido. Actualizando estado a available_call.`,
              );
              broadcastLocalFemaleStatusUpdate({
                in_call: 0,
                status: 'available_call',
                // host_id sigue siendo el suyo, no se cambia aquí a menos que la llamada haya terminado por completo.
                // Pero como el male se fue, su in_call es 0 y status available_call.
              });
            } else {
              console.log(
                `${LOG_PREFIX_FEMALE} Un male ha salido, pero aún quedan otros. Estado in_call permanece.`,
              );
            }
          }
        }
      });
    },
    [
      dispatch,
      state.localUser,
      state.channelName,
      state.remoteUsers,
      broadcastLocalFemaleStatusUpdate,
    ],
  );

  const initializeRtc = useCallback(
    async (
      appID: string,
      channelName: string,
      rtcUid: string,
      roleForToken: 'publisher' | 'subscriber',
      publishTracksFlag: boolean,
      loadingMessage?: string,
    ): Promise<{
      rtcClient: IAgoraRTCClient;
      localAudioTrack: IMicrophoneAudioTrack | null;
      localVideoTrack: ICameraVideoTrack | null;
      rtcToken: string;
    }> => {
      dispatch({
        type: AgoraActionType.RTC_SETUP_START,
        payload: loadingMessage || 'Configurando audio y video...',
      });

      const rtcTokenResponse = await fetch(
        `/api/agora/get-token-rtc?channel=${channelName}&rol=${roleForToken}&type=uid&uid=${rtcUid}`,
      );

      if (!rtcTokenResponse.ok) {
        throw new Error('Failed to get RTC token');
      }

      const { rtcToken } = await rtcTokenResponse.json();

      if (!rtcToken) {
        throw new Error('Token RTC no recibido.');
      }

      dispatch({
        type: AgoraActionType.SET_TOKENS,
        payload: { tokenRtc: rtcToken, tokenRtm: state.tokenRtm },
      });

      const tempRtcClient = AgoraRTC.createClient({
        mode: 'rtc',
        codec: 'vp8',
      });

      setupRtcClientListeners(tempRtcClient);

      await tempRtcClient.join(appID, channelName, rtcToken, rtcUid);

      let tempLocalAudioTrack: IMicrophoneAudioTrack | null = null;
      let tempLocalVideoTrack: ICameraVideoTrack | null = null;

      if (publishTracksFlag) {
        dispatch({
          type: AgoraActionType.SET_REQUESTING_MEDIA_PERMISSIONS,
          payload: true,
        });
        try {
          [tempLocalAudioTrack, tempLocalVideoTrack] = await Promise.all([
            AgoraRTC.createMicrophoneAudioTrack(),
            AgoraRTC.createCameraVideoTrack(),
          ]);
          dispatch({
            type: AgoraActionType.SET_REQUESTING_MEDIA_PERMISSIONS,
            payload: false,
          });
        } catch (permissionError: any) {
          console.error(
            'Error creando tracks locales (¿permisos denegados?):',
            permissionError,
          );
          dispatch({
            type: AgoraActionType.SET_REQUESTING_MEDIA_PERMISSIONS,
            payload: false,
          });
          throw permissionError;
        }
        await tempRtcClient.publish([tempLocalAudioTrack, tempLocalVideoTrack]);
      }

      dispatch({
        type: AgoraActionType.RTC_SETUP_SUCCESS,
        payload: {
          rtcClient: tempRtcClient,
          localAudioTrack: tempLocalAudioTrack,
          localVideoTrack: tempLocalVideoTrack,
          channelName: channelName,
        },
      });

      return {
        rtcClient: tempRtcClient,
        localAudioTrack: tempLocalAudioTrack,
        localVideoTrack: tempLocalVideoTrack,
        rtcToken,
      };
    },
    [dispatch, state.tokenRtm, setupRtcClientListeners],
  );

  const initializeRtmForUser = useCallback(
    async (
      appID: string,
      channelName: string,
      rtmUid: string,
      localUserProfile: UserInformation,
      isLobbyCtx: boolean = false,
      loadingMessageForLogin?: string,
    ): Promise<{
      rtmClient: RtmClient;
      rtmChannel: RtmChannel;
      rtmToken: string;
    }> => {
      if (!localUserProfile) {
        throw new Error('Perfil local no disponible para RTM.');
      }

      let rtmTokenToUse = state.tokenRtm;
      let clientToUse = state.rtmClient;

      if (!clientToUse || !state.isRtmLoggedIn) {
        if (!state.isLoadingRtm) {
          dispatch({
            type: AgoraActionType.RTM_SETUP_START,
            payload:
              loadingMessageForLogin || 'Conectando servicios de mensajería...',
          });
        }

        const rtmTokenResponse = await fetch(
          `/api/agora/get-token-rtm?uid=${rtmUid}`,
        );

        if (!rtmTokenResponse.ok) {
          const d = await rtmTokenResponse
            .json()
            .catch(() => ({ error: 'Error fetch token RTM' }));

          dispatch({
            type: AgoraActionType.RTM_LOGIN_FAILURE,
            payload: d.error || `Token RTM: ${rtmTokenResponse.statusText}`,
          });

          throw new Error(
            d.error || `Token RTM: ${rtmTokenResponse.statusText}`,
          );
        }

        const { rtmToken: newRtmToken } = await rtmTokenResponse.json();

        if (!newRtmToken) {
          dispatch({
            type: AgoraActionType.RTM_LOGIN_FAILURE,
            payload: 'Token RTM no recibido.',
          });

          throw new Error('Token RTM no recibido.');
        }

        rtmTokenToUse = newRtmToken;
        dispatch({
          type: AgoraActionType.SET_TOKENS,
          payload: { tokenRtc: state.tokenRtc, tokenRtm: rtmTokenToUse },
        });

        if (!clientToUse) {
          clientToUse = AgoraRTM.createInstance(appID, {
            logFilter: AgoraRTM.LOG_FILTER_ERROR,
          });
        }

        clientToUse.removeAllListeners('ConnectionStateChanged');

        clientToUse.on('ConnectionStateChanged', (newState, reason) => {
          console.log(
            `${LOG_PREFIX_RTM_LISTEN} RTM Client state changed for ${localUserProfile.role} on ${channelName}: NewState: ${newState}, Reason: ${reason}`,
          );

          if (
            newState === 'ABORTED' ||
            (newState === 'DISCONNECTED' &&
              String(reason) === 'LOGIN_KICKED_BY_REMOTE')
          ) {
            console.error(
              `${LOG_PREFIX_RTM_LISTEN} RTM Kicked/Aborted: ${reason}. UID: ${localUserProfile.rtmUid}`,
            );
            dispatch({
              type: AgoraActionType.RTM_LOGIN_FAILURE,
              payload: `RTM Kicked/Aborted: ${reason}`,
            });
          } else if (
            newState === 'DISCONNECTED' &&
            String(reason) === 'LOGOUT'
          ) {
            dispatch({ type: AgoraActionType.RTM_LOGOUT_LEAVE_CHANNEL });
          }
        });

        try {
          await clientToUse.login({
            uid: rtmUid,
            token: rtmTokenToUse ?? undefined,
          });

          dispatch({
            type: AgoraActionType.RTM_LOGIN_SUCCESS,
            payload: { rtmClient: clientToUse },
          });
        } catch (loginError) {
          console.error(
            `${LOG_PREFIX_PROVIDER} RTM Login FAILED for UID: ${rtmUid}`,
            loginError,
          );
          dispatch({
            type: AgoraActionType.RTM_LOGIN_FAILURE,
            payload: (loginError as Error).message || 'RTM Login failed',
          });
          throw loginError;
        }
      } else {
        console.log(
          `${LOG_PREFIX_PROVIDER} Reusing existing RTM Client for UID: ${rtmUid}. LoggedIn: ${state.isRtmLoggedIn}`,
        );
        if (!rtmTokenToUse && clientToUse)
          rtmTokenToUse = state.tokenRtm || 'EXISTING_TOKEN_VALID_ASSUMED';
      }

      const rtmChannelInstance = clientToUse!.createChannel(channelName);
      await rtmChannelInstance.join();

      setupRtmChannelListeners(rtmChannelInstance, isLobbyCtx);

      if (!isLobbyCtx) {
        await sendProfileUpdateRtmMessage(rtmChannelInstance, localUserProfile);
        if (localUserProfile.role === 'female') {
          rtmChannelInstance.on('MemberJoined', (memberId) => {
            if (memberId !== localUserProfile.rtmUid) {
              sendProfileUpdateRtmMessage(rtmChannelInstance, localUserProfile);
            }
          });
        }
        dispatch({
          type: AgoraActionType.RTM_JOIN_CHANNEL_SUCCESS,
          payload: { rtmChannel: rtmChannelInstance },
        });
      }
      return {
        rtmClient: clientToUse!,
        rtmChannel: rtmChannelInstance,
        rtmToken: rtmTokenToUse!,
      };
    },
    [
      dispatch,
      state.tokenRtc,
      state.tokenRtm,
      state.rtmClient,
      state.isRtmLoggedIn,
      state.isLoadingRtm,
      setupRtmChannelListeners,
      sendProfileUpdateRtmMessage,
    ],
  );

  const registerSessionOnBackendFemale = useCallback(
    async (channelName: string): Promise<void> => {
      const backendRegisterResponse = await fetch(
        `/api/agora/channels/create-channel?host_id=${channelName}`,
      );
      if (!backendRegisterResponse.ok) {
        throw new Error('Failed to register session');
      }
      const backendResult = await backendRegisterResponse.json();

      if (!backendResult.success)
        throw new Error(
          backendResult.message || 'Backend no pudo registrar F.',
        );
    },
    [],
  );

  const determineJoinChannelName = useCallback(
    async (
      passedChannel?: string,
      role?: 'male' | 'admin' | 'female',
    ): Promise<string> => {
      if (passedChannel) {
        return passedChannel;
      }

      if (role === 'admin') {
        const adminSuitableChannels = state.onlineFemalesList.filter(
          (female) =>
            (female.status === 'available_call' ||
              female.status === 'in_call') &&
            female.host_id &&
            typeof female.host_id === 'string' &&
            female.host_id.trim() !== '' &&
            female.is_active === 1,
        );

        if (adminSuitableChannels.length === 0) {
          throw new Error(
            'No hay canales activos (disponibles o en llamada) para que el admin se una aleatoriamente.',
          );
        }

        const randomIndex = Math.floor(
          Math.random() * adminSuitableChannels.length,
        );
        const selectedChannel = adminSuitableChannels[randomIndex];

        return selectedChannel.host_id!;
      }

      if (role === 'male') {
        const availableFemales = state.onlineFemalesList.filter(
          (female) =>
            female.status === 'available_call' &&
            female.host_id &&
            typeof female.host_id === 'string' &&
            female.host_id.trim() !== '' &&
            female.is_active === 1,
        );

        if (availableFemales.length === 0) {
          throw new Error(
            'No hay chicas disponibles para llamar en este momento. ¡Intenta más tarde!',
          );
        }

        const randomIndex = Math.floor(Math.random() * availableFemales.length);
        const selectedFemale = availableFemales[randomIndex];

        return selectedFemale.host_id!;
      }

      throw new Error(
        'No se pudo determinar el canal. Rol no válido para selección aleatoria o canal no especificado.',
      );
    },
    [state.onlineFemalesList],
  );

  const notifyBackendMaleJoining = useCallback(
    async (
      channelName: string,
      appUserId: string | number,
    ): Promise<{ success: boolean; message?: string; data?: any }> => {
      const enterChannelResponse = await fetch(
        `/api/agora/channels/enter-channel-male`,
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
          message:
            enterChannelResult.message || 'Backend no pudo actualizar M.',
        };
      }

      return enterChannelResult;
    },
    [],
  );

  const fetchInitialOnlineFemalesList = useCallback(async () => {
    if (state.isLoadingOnlineFemales) {
      return;
    }
    if (!state.localUser) {
      return;
    }
    dispatch({ type: AgoraActionType.FETCH_ONLINE_FEMALES_START });
    try {
      const response = await fetch('/api/agora/host');

      if (!response.ok) {
        throw new Error('Failed to fetch female list');
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
        dispatch({
          type: AgoraActionType.FETCH_ONLINE_FEMALES_SUCCESS,
          payload: femalesList,
        });
      } else {
        throw new Error(
          result.message || 'Respuesta inválida de API de lista de females.',
        );
      }
    } catch (error: any) {}
  }, [dispatch, state.localUser]);

  const joinLobbyForRealtimeUpdates = useCallback(async () => {
    if (!state.localUser || !state.localUser.rtmUid || !state.appID) {
      dispatch({
        type: AgoraActionType.JOIN_LOBBY_FAILURE,
        payload: 'Usuario o AppID no disponible para lobby.',
      });
      return;
    }
    if (state.isLobbyJoined && state.lobbyRtmChannel) {
      console.log(`${LOG_PREFIX_LOBBY} Ya unido al lobby.`);
      return;
    }
    if (state.isLoadingRtm) {
      console.log(
        `${LOG_PREFIX_LOBBY} Ya se está uniendo/logeando a RTM (lobby).`,
      );
      return;
    }

    dispatch({ type: AgoraActionType.JOIN_LOBBY_START });
    try {
      let clientToUseForLobby = state.rtmClient;
      let rtmTokenForLobby = state.tokenRtm;

      if (!clientToUseForLobby || !state.isRtmLoggedIn) {
        const tokenResponse = await fetch(
          `/api/agora/get-token-rtm?uid=${state.localUser.rtmUid}`,
        );

        if (!tokenResponse.ok) {
          throw new Error('Failed to get RTM token for lobby');
        }

        const { rtmToken: newRtmToken } = await tokenResponse.json();

        if (!newRtmToken) {
          throw new Error('Token RTM para Lobby no recibido.');
        }

        rtmTokenForLobby = newRtmToken;

        if (!clientToUseForLobby) {
          clientToUseForLobby = AgoraRTM.createInstance(state.appID, {
            logFilter: AgoraRTM.LOG_FILTER_ERROR,
          });
        }

        clientToUseForLobby.removeAllListeners('ConnectionStateChanged');

        clientToUseForLobby.on('ConnectionStateChanged', (newState, reason) => {
          if (
            newState === 'ABORTED' ||
            (newState === 'DISCONNECTED' &&
              String(reason) === 'LOGIN_KICKED_BY_REMOTE')
          ) {
            dispatch({
              type: AgoraActionType.RTM_LOGIN_FAILURE,
              payload: `RTM Kicked/Aborted: ${reason}`,
            });
          } else if (newState === 'DISCONNECTED' && reason === 'LOGOUT') {
            dispatch({ type: AgoraActionType.RTM_LOGOUT_LEAVE_CHANNEL });
          }
        });

        try {
          await clientToUseForLobby.login({
            uid: String(state.localUser.rtmUid),
            token: rtmTokenForLobby ?? undefined,
          });

          dispatch({
            type: AgoraActionType.SET_TOKENS,
            payload: { tokenRtc: state.tokenRtc, tokenRtm: rtmTokenForLobby },
          });

          dispatch({
            type: AgoraActionType.RTM_LOGIN_SUCCESS,
            payload: { rtmClient: clientToUseForLobby },
          });
        } catch (loginError) {
          console.error(
            `${LOG_PREFIX_LOBBY} RTM Login FAILED for Lobby:`,
            loginError,
          );
          dispatch({
            type: AgoraActionType.JOIN_LOBBY_FAILURE,
            payload: (loginError as Error).message || 'Lobby RTM Login failed',
          });
          throw loginError;
        }
      }

      const finalRtmClientForLobby = state.rtmClient || clientToUseForLobby;

      if (!finalRtmClientForLobby) {
        throw new Error('Cliente RTM no disponible para el lobby.');
      }

      const lobbyChannelInstance = finalRtmClientForLobby.createChannel(
        LOBBY_RTM_CHANNEL_NAME,
      );

      await lobbyChannelInstance.join();

      setupRtmChannelListeners(lobbyChannelInstance, true);

      dispatch({
        type: AgoraActionType.JOIN_LOBBY_SUCCESS,
        payload: { lobbyRtmChannel: lobbyChannelInstance },
      });

      if (
        state.localUser.role === 'female' &&
        state.localUser.is_active === 1
      ) {
        await broadcastLocalFemaleStatusUpdate({});
      }
    } catch (error: any) {
      dispatch({
        type: AgoraActionType.JOIN_LOBBY_FAILURE,
        payload: error.message || 'Error al unirse al lobby.',
      });
    }
  }, [
    dispatch,
    state.appID,
    state.localUser,
    state.tokenRtc,
    state.tokenRtm,
    state.rtmClient,
    state.isRtmLoggedIn,
    state.isLobbyJoined,
    state.lobbyRtmChannel,
    state.isLoadingRtm,
    setupRtmChannelListeners,
    broadcastLocalFemaleStatusUpdate,
  ]);

  const leaveLobbyChannel = useCallback(async () => {
    if (state.lobbyRtmChannel && state.isLobbyJoined) {
      try {
        if (state.localUser?.role === 'female') {
          await broadcastLocalFemaleStatusUpdate({
            host_id: null,
            status: 'online',
            in_call: 0,
            is_active: 1,
          });
        }
        await state.lobbyRtmChannel.leave();
      } catch (error) {
        console.error(
          `${LOG_PREFIX_LOBBY} Error al ejecutar lobbyRtmChannel.leave():`,
          error,
        );
      }
      dispatch({ type: AgoraActionType.LEAVE_LOBBY });
    } else {
      if (state.isLobbyJoined || state.lobbyRtmChannel) {
        dispatch({ type: AgoraActionType.LEAVE_LOBBY });
      }
    }
  }, [
    dispatch,
    state.isLobbyJoined,
    state.lobbyRtmChannel,
    state.localUser,
    broadcastLocalFemaleStatusUpdate,
  ]);

  const handleVideoChatFemale = useCallback(async () => {
    if (
      !state.localUser ||
      !state.localUser.rtcUid ||
      !state.localUser.rtmUid
    ) {
      return;
    }
    if (!state.appID) {
      return;
    }

    const { rtcUid, rtmUid } = state.localUser;
    let newChannelName: string | undefined = undefined;
    let rtcResources: Awaited<ReturnType<typeof initializeRtc>> | null = null;
    let rtmResources: Awaited<ReturnType<typeof initializeRtmForUser>> | null =
      null;

    try {
      newChannelName = createHost();

      if (!newChannelName) {
        throw new Error('No se pudo generar canal.');
      }

      rtcResources = await initializeRtc(
        state.appID,
        newChannelName,
        String(rtcUid),
        'publisher',
        true,
      );

      rtmResources = await initializeRtmForUser(
        state.appID,
        newChannelName,
        String(rtmUid),
        state.localUser,
        false,
      );

      await registerSessionOnBackendFemale(newChannelName);

      await broadcastLocalFemaleStatusUpdate({
        host_id: newChannelName,
        status: 'available_call',
        in_call: 0,
        is_active: 1,
      });

      router.push(`/main/stream/${newChannelName}`);
    } catch (error: any) {
      console.error(
        `${LOG_PREFIX_FEMALE} Error en handleVideoChatFemale:`,
        error,
      );
      dispatch({
        type: AgoraActionType.RTC_SETUP_FAILURE,
        payload: `Err RTC F: ${error.message || '?'}`,
      });
      dispatch({
        type: AgoraActionType.RTM_LOGIN_FAILURE,
        payload: `Err RTM F: ${error.message || '?'}`,
      });

      if (rtmResources?.rtmChannel) {
        try {
          await rtmResources.rtmChannel.leave();
        } catch (e) {}
      }

      if (
        rtmResources?.rtmClient &&
        (!state.isLobbyJoined || rtmResources.rtmClient !== state.rtmClient)
      ) {
        try {
          await rtmResources.rtmClient.logout();
        } catch (e) {}
      }

      if (rtcResources?.localAudioTrack) rtcResources.localAudioTrack.close();

      if (rtcResources?.localVideoTrack) rtcResources.localVideoTrack.close();

      if (rtcResources?.rtcClient) {
        try {
          await rtcResources.rtcClient.leave();
        } catch (e) {}
      }
      if (state.localUser?.role === 'female') {
        broadcastLocalFemaleStatusUpdate({
          host_id: null,
          status: 'online',
          in_call: 0,
        });
      }
    }
  }, [
    dispatch,
    state.appID,
    state.localUser,
    initializeRtc,
    initializeRtmForUser,
    registerSessionOnBackendFemale,
    broadcastLocalFemaleStatusUpdate,
    router,
    state.isLobbyJoined,
    state.rtmClient,
  ]);

  const handleVideoChatMale = useCallback(
    async (channelToJoin?: string) => {
      if (
        !state.localUser ||
        !state.localUser.rtcUid ||
        !state.localUser.rtmUid ||
        !state.localUser.role
      ) {
        dispatch({
          type: AgoraActionType.RTC_SETUP_FAILURE,
          payload:
            'Perfil local no cargado o incompleto para iniciar video chat.',
        });
        return;
      }
      if (!state.appID) {
        dispatch({
          type: AgoraActionType.RTC_SETUP_FAILURE,
          payload: 'AppID no configurado.',
        });
        return;
      }

      // Asegurarse de que el modal de "no canales" se oculte al iniciar un nuevo intento
      dispatch({
        type: AgoraActionType.SET_SHOW_NO_CHANNELS_AVAILABLE_MODAL_FOR_MALE,
        payload: false,
      });

      const {
        rtcUid,
        rtmUid,
        role: localUserRole,
        user_id: appUserId,
      } = state.localUser;

      let determinedChannelName: string | undefined = undefined;
      let rtcResources: Awaited<ReturnType<typeof initializeRtc>> | null = null;
      let rtmResources: Awaited<
        ReturnType<typeof initializeRtmForUser>
      > | null = null;

      try {
        // Esta función puede lanzar un error si no hay canales, especialmente para 'male'
        determinedChannelName = await determineJoinChannelName(
          channelToJoin,
          localUserRole,
        );

        if (!determinedChannelName) {
          // Aunque determineJoinChannelName debería lanzar un error, este es un fallback.
          const noChannelMsg =
            'No se pudo determinar un canal para unirse en este momento.';
          if (localUserRole === 'male') {
            dispatch({
              type: AgoraActionType.SET_SHOW_NO_CHANNELS_AVAILABLE_MODAL_FOR_MALE,
              payload: true,
            });
          }
          dispatch({
            type: AgoraActionType.RTC_SETUP_FAILURE,
            payload: noChannelMsg,
          });
          return;
        }

        if (localUserRole === 'male') {
          const targetFemale = state.onlineFemalesList.find(
            (female) => female.host_id === determinedChannelName,
          );

          if (!targetFemale) {
            const errMsg =
              'La modelo seleccionada ya no está disponible. Intenta con otra.';
            // Considera si este caso específico también debería usar el modal de "no canales" o un error más genérico.
            // Por ahora, lo trataremos como un error que podría mostrarse en el modal de "no canales".
            dispatch({
              type: AgoraActionType.SET_SHOW_NO_CHANNELS_AVAILABLE_MODAL_FOR_MALE,
              payload: true,
            });
            dispatch({
              type: AgoraActionType.RTC_SETUP_FAILURE,
              payload: errMsg,
            });
            return;
          }

          if (targetFemale.status !== 'available_call') {
            let message = 'Esta modelo ya no está disponible en este momento.';
            if (targetFemale.status === 'in_call') {
              message = 'Esta modelo ya se encuentra en otra llamada.';
            } else if (targetFemale.status === 'offline') {
              message = 'Esta modelo se ha desconectado.';
            }
            dispatch({
              type: AgoraActionType.SET_SHOW_NO_CHANNELS_AVAILABLE_MODAL_FOR_MALE,
              payload: true,
            });
            dispatch({
              type: AgoraActionType.RTC_SETUP_FAILURE,
              payload: message,
            });
            return; // Detener ejecución
          }

          const backendJoinResponse = await notifyBackendMaleJoining(
            determinedChannelName,
            String(appUserId),
          );

          if (!backendJoinResponse.success) {
            const noChannelKeywords = [
              'ocupado',
              'no se pudo unir',
              'llena',
              'unavailable',
              'no disponible',
            ]; // Palabras clave ejemplo
            // Si el mensaje de error del backend sugiere que el canal no está disponible
            if (
              noChannelKeywords.some((kw) =>
                backendJoinResponse.message?.toLowerCase().includes(kw),
              )
            ) {
              dispatch({
                type: AgoraActionType.SET_SHOW_NO_CHANNELS_AVAILABLE_MODAL_FOR_MALE,
                payload: true,
              });
              dispatch({
                type: AgoraActionType.RTC_SETUP_FAILURE,
                payload:
                  backendJoinResponse.message ||
                  'El canal seleccionado no está disponible.',
              });
              return; // Detener ejecución
            }
            // Para otros errores del backend, simplemente lanza el error para el manejo genérico
            throw new Error(
              backendJoinResponse.message ||
                'El servidor rechazó la entrada al canal.',
            );
          }
        }

        const rtcRoleForToken =
          localUserRole === 'admin' ? 'subscriber' : 'publisher';
        const publishTracksFlag = localUserRole !== 'admin';
        const rtcLoadingMsg =
          localUserRole === 'admin'
            ? 'Accediendo a la transmisión de video...'
            : '¡Un momento! Estableciendo la videollamada...';

        rtcResources = await initializeRtc(
          state.appID!,
          determinedChannelName,
          String(rtcUid),
          rtcRoleForToken,
          publishTracksFlag,
          rtcLoadingMsg,
        );

        const rtmLoadingMsg =
          localUserRole === 'admin'
            ? 'Cargando herramientas de supervisión...'
            : 'Preparando el chat de la sala...';
        rtmResources = await initializeRtmForUser(
          state.appID!,
          determinedChannelName,
          String(rtmUid),
          state.localUser!,
          false,
          rtmLoadingMsg,
        );

        router.push(`/main/stream/${determinedChannelName}`);
      } catch (error: any) {
        console.error(
          `${LOG_PREFIX_MALE_ADMIN} Error en handleVideoChatMale/Admin (Rol: ${localUserRole}, Canal: ${determinedChannelName || 'N/A'}):`,
          error.message,
        );

        // Lista de mensajes de error que indican "no hay canales disponibles"
        const noChannelsErrorMessages = [
          'No hay chicas disponibles para llamar en este momento',
          'No hay canales activos (disponibles o en llamada) para que el admin se una aleatoriamente', // Aunque es para admin, lo incluimos por si acaso
          'No se pudo determinar el canal. Rol no válido para selección aleatoria o canal no especificado',
          'No se pudo determinar el canal para unirse',
          'La modelo seleccionada ya no está disponible', // Añadido por si se lanza este error y se quiere unificar el modal
        ];

        // Si el error es uno de los que indica "no hay canales" y el usuario es 'male'
        if (
          localUserRole === 'male' &&
          noChannelsErrorMessages.some((msg) =>
            error.message?.toLowerCase().includes(msg.toLowerCase()),
          )
        ) {
          dispatch({
            type: AgoraActionType.SET_SHOW_NO_CHANNELS_AVAILABLE_MODAL_FOR_MALE,
            payload: true,
          });
        }

        dispatch({
          type: AgoraActionType.RTC_SETUP_FAILURE,
          payload: `${error.message || 'Error desconocido al intentar unirse al canal.'}`,
        });

        // Limpieza de recursos en caso de error (como estaba antes)
        if (rtmResources?.rtmChannel) {
          try {
            await rtmResources.rtmChannel.leave();
          } catch (e) {
            console.error(
              `${LOG_PREFIX_MALE_ADMIN} Error leaving RTM channel on cleanup:`,
              e,
            );
          }
        }
        // No necesitas desloguear el cliente RTM aquí si se va a reusar o si el lobby lo maneja.
        // Considera si el logout de RTM es necesario en todos los fallos.
        // if (rtmResources?.rtmClient && (!state.isLobbyJoined || rtmResources.rtmClient !== state.rtmClient)) {
        //   try { await rtmResources.rtmClient.logout(); } catch (e) { /* ... */ }
        // }

        if (rtcResources?.localAudioTrack) rtcResources.localAudioTrack.close();
        if (rtcResources?.localVideoTrack) rtcResources.localVideoTrack.close();
        if (rtcResources?.rtcClient) {
          try {
            await rtcResources.rtcClient.leave();
          } catch (e) {
            console.error(
              `${LOG_PREFIX_MALE_ADMIN} Error leaving RTC client on cleanup:`,
              e,
            );
          }
        }
      }
    },
    [
      state.localUser,
      state.appID,
      state.onlineFemalesList,
      dispatch,
      determineJoinChannelName,
      initializeRtc,
      initializeRtmForUser,
      notifyBackendMaleJoining,
      router,
    ],
  );

  const sendRtmChannelMessage = async (messageText: string) => {
    if (
      state.rtmChannel &&
      state.isRtmChannelJoined &&
      state.localUser &&
      state.localUser.role !== 'admin'
    ) {
      const chatMsg = {
        type: 'CHAT_MESSAGE',
        payload: {
          text: messageText,
          rtmUid: String(state.localUser.rtmUid),
          user_name: state.localUser.user_name,
          timestamp: Date.now(),
          type: 'channel',
        },
      };
      try {
        await state.rtmChannel.sendMessage({ text: JSON.stringify(chatMsg) });
        dispatch({
          type: AgoraActionType.ADD_CHAT_MESSAGE,
          payload: {
            rtmUid: String(state.localUser.rtmUid),
            user_name: state.localUser.user_name,
            text: messageText,
            timestamp: Date.now(),
            type: 'self',
          },
        });
      } catch (error) {}
    } else {
    }
  };

  const loadingStatus = useMemo<LoadingStatus>(() => {
    const {
      rtcError,
      rtmError,
      onlineFemalesError,
      activeLoadingMessage,
      isLoadingRtc,
      isLoadingRtm,
      isLoadingOnlineFemales,
    } = state;

    if (rtcError)
      return { message: `Error de Video/Audio: ${rtcError}`, isLoading: false };
    if (rtmError)
      return {
        message: `Error de Conexión General: ${rtmError}`,
        isLoading: false,
      };
    if (onlineFemalesError)
      return {
        message: `Error al Cargar Modelos: ${onlineFemalesError}`,
        isLoading: false,
      };

    if (
      activeLoadingMessage &&
      (isLoadingRtc || isLoadingRtm || isLoadingOnlineFemales)
    ) {
      return { message: activeLoadingMessage, isLoading: true };
    }

    if (isLoadingRtc)
      return { message: 'Procesando video y audio...', isLoading: true };
    if (isLoadingRtm)
      return {
        message: 'Procesando conexión en tiempo real...',
        isLoading: true,
      };
    if (isLoadingOnlineFemales)
      return { message: 'Actualizando lista de modelos...', isLoading: true };

    return { message: '', isLoading: false };
  }, [
    state.rtcError,
    state.rtmError,
    state.onlineFemalesError,
    state.activeLoadingMessage,
    state.isLoadingRtc,
    state.isLoadingRtm,
    state.isLoadingOnlineFemales,
  ]);

  const toggleLocalAudio = useCallback(async () => {
    if (state.localAudioTrack) {
      const newMutedState = !state.isLocalAudioMuted;
      try {
        await state.localAudioTrack.setEnabled(!newMutedState);
        dispatch({
          type: AgoraActionType.SET_LOCAL_AUDIO_MUTED,
          payload: newMutedState,
        });
      } catch (error) {
        console.error(
          `${LOG_PREFIX_PROVIDER} Error al cambiar estado del audio local:`,
          error,
        );
      }
    } else {
      console.warn(
        `${LOG_PREFIX_PROVIDER} No hay track de audio local disponible para alternar mute.`,
      );
    }
  }, [state.localAudioTrack, state.isLocalAudioMuted, dispatch]);

  const toggleLocalVideo = useCallback(async () => {
    if (state.localVideoTrack) {
      const newMutedState = !state.isLocalVideoMuted;
      try {
        await state.localVideoTrack.setEnabled(!newMutedState);
        dispatch({
          type: AgoraActionType.SET_LOCAL_VIDEO_MUTED,
          payload: newMutedState,
        });
      } catch (error) {
        console.error(
          `${LOG_PREFIX_PROVIDER} Error al cambiar estado del video local:`,
          error,
        );
      }
    } else {
      console.warn(
        `${LOG_PREFIX_PROVIDER} No hay track de video local disponible para alternar encendido/apagado.`,
      );
    }
  }, [state.localVideoTrack, state.isLocalVideoMuted, dispatch]);

  const closeFemaleChannelOnBackend = useCallback(
    async (host_id: string | null) => {
      if (!host_id) {
        return;
      }

      try {
        const response = await fetch(`/api/agora/channels/close-channel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            host_id: host_id,
            status: 'finished',
          }),
        });

        const responseData = await response.json();
        if (!response.ok || !responseData.success) {
          console.error(
            `${LOG_PREFIX_FEMALE} Error al notificar cierre de canal (status: finished) al backend para ${host_id}:`,
            responseData.message || response.status,
          );
        } else {
          console.log(
            `${LOG_PREFIX_FEMALE} Backend notificado del cierre del canal ${host_id} (status: finished). Mensaje: ${responseData.message}`,
          );
        }
      } catch (error) {
        console.error(
          `${LOG_PREFIX_FEMALE} Excepción al notificar cierre de canal (status: finished) al backend para ${host_id}:`,
          error,
        );
      }
    },
    [],
  );

  const notifyMaleLeftChannelOnBackend = useCallback(
    async (host_id: string | null) => {
      if (!host_id) {
        return;
      }

      try {
        const response = await fetch(`/api/agora/channels/close-channel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            host_id: host_id,
            status: 'waiting',
          }),
        });

        const responseData = await response.json();
        if (!response.ok || !responseData.success) {
          console.error(
            `${LOG_PREFIX_MALE_ADMIN} Error al notificar al backend que male dejó ${host_id} (status: waiting):`,
            responseData.message || response.status,
          );
        } else {
          console.log(
            `${LOG_PREFIX_MALE_ADMIN} Backend notificado que male dejó ${host_id} (status: waiting). Mensaje: ${responseData.message}`,
          );
        }
      } catch (error) {
        console.error(
          `${LOG_PREFIX_MALE_ADMIN} Excepción al notificar al backend que male dejó ${host_id} (status: waiting):`,
          error,
        );
      }
    },
    [],
  );

  const handleLeaveCall = useCallback(async () => {
    const currentUser = state.localUser;
    const currentChannelName = state.channelName; // Canal de la llamada actual
    const currentRtcClient = state.rtcClient;
    const currentRtmCallChannel = state.rtmChannel; // Canal RTM de la llamada actual
    const localAudio = state.localAudioTrack;
    const localVideo = state.localVideoTrack;

    if (!currentUser) {
      console.warn(
        `${LOG_PREFIX_PROVIDER} handleLeaveCall: No hay usuario local. Redirigiendo...`,
      );
      // Si estás en una página de llamada y no hay usuario, algo anda mal.
      // Redirigir a una página de inicio o de error podría ser apropiado.
      router.push('/main/video-roulette');
      return;
    }

    console.log(
      `${LOG_PREFIX_PROVIDER} handleLeaveCall: Iniciando salida para rol ${currentUser.role} del canal ${currentChannelName || 'N/A'}`,
    );

    try {
      // --- Lógica específica cuando la ANFITRIONA (female) decide salir ---
      if (currentUser.role === 'female' && currentChannelName) {
        // 1. Enviar señal RTM para expulsar a otros participantes (male/admin)
        if (currentRtmCallChannel && state.isRtmChannelJoined) {
          try {
            const ejectionSignal = {
              type: 'HOST_ENDED_CALL',
              channelName: currentChannelName, // Para que los clientes confirmen que es para este canal
            };
            await currentRtmCallChannel.sendMessage({
              text: JSON.stringify(ejectionSignal),
            });
            console.log(
              `${LOG_PREFIX_FEMALE} Señal HOST_ENDED_CALL enviada al canal RTM ${currentChannelName}.`,
            );
          } catch (rtmSignalError) {
            console.error(
              `${LOG_PREFIX_FEMALE} Error enviando señal HOST_ENDED_CALL:`,
              rtmSignalError,
            );
            // Continuar con la salida de la female aunque la señal falle, pero es bueno loguearlo.
          }
        }

        // 2. Actualizar estado en el lobby RTM y notificar al backend
        console.log(
          `${LOG_PREFIX_FEMALE} Female (${currentUser.user_id}) terminando su stream ${currentChannelName}. Notificando al lobby y backend.`,
        );
        // Se marca como 'online' y disponible, ya no en llamada ni con host_id activo para este canal
        await broadcastLocalFemaleStatusUpdate({
          status: 'online', // O 'available_call' si está inmediatamente lista para otra. 'online' es más seguro.
          host_id: null,
          in_call: 0,
          is_active: 1, // Asumiendo que sigue activa en la plataforma general
        });
        await closeFemaleChannelOnBackend(currentChannelName); // Notifica al backend para cerrar el canal

        // --- Lógica específica cuando un CLIENTE (male) decide salir ---
      } else if (currentUser.role === 'male' && currentChannelName) {
        console.log(
          `${LOG_PREFIX_MALE_ADMIN} Male ${currentUser.user_id} saliendo del canal ${currentChannelName}. Notificando al backend.`,
        );
        // Notifica al backend. El backend debería cambiar el estado del canal de la female a 'waiting'.
        // La actualización en tiempo real del estado de la female a 'available_call' en el lobby RTM
        // se maneja en el cliente de la female a través del evento 'user-left' de RTC.
        await notifyMaleLeftChannelOnBackend(currentChannelName);

        // --- Lógica específica cuando un ADMIN decide salir (si es necesario) ---
      } else if (currentUser.role === 'admin' && currentChannelName) {
        console.log(
          `${LOG_PREFIX_MALE_ADMIN} Admin ${currentUser.user_id} saliendo del canal ${currentChannelName}.`,
        );
        // Actualmente no hay notificaciones de backend específicas para admin saliendo.
        // Si se necesitara, se añadiría aquí.
      }

      // --- Pasos Comunes para Todos los Roles al Salir de una Llamada ---

      // 3. Detener y Liberar Tracks Locales de Audio/Video (si existen)
      if (localAudio) {
        localAudio.stop();
        localAudio.close();
        console.log(
          `${LOG_PREFIX_PROVIDER} Track de audio local detenido y cerrado.`,
        );
      }
      if (localVideo) {
        localVideo.stop();
        localVideo.close();
        console.log(
          `${LOG_PREFIX_PROVIDER} Track de video local detenido y cerrado.`,
        );
      }

      // 4. Salir del Canal RTM de la Llamada (si está unido)
      if (currentRtmCallChannel && state.isRtmChannelJoined) {
        console.log(
          `${LOG_PREFIX_PROVIDER} Saliendo del canal RTM de la llamada: ${currentRtmCallChannel.channelId}`,
        );
        await currentRtmCallChannel.leave();
      }

      // 5. Salir del Canal RTC de la Llamada (si está unido)
      if (currentRtcClient && state.isRtcJoined) {
        console.log(
          `${LOG_PREFIX_PROVIDER} Saliendo del canal RTC: ${currentChannelName || 'N/A'}`,
        );
        await currentRtcClient.leave();
      }
    } catch (error) {
      console.error(
        `${LOG_PREFIX_PROVIDER} Error durante handleLeaveCall para ${currentUser.role} (${currentUser.user_id}):`,
        error,
      );
      // A pesar del error, el bloque 'finally' intentará limpiar el estado y redirigir.
    } finally {
      // 6. Actualizar el Estado Global de la Aplicación (siempre se ejecuta)
      console.log(
        `${LOG_PREFIX_PROVIDER} Despachando acciones para limpiar estado de RTC y RTM de la llamada.`,
      );
      dispatch({ type: AgoraActionType.LEAVE_RTC_CHANNEL }); // Esta acción debe resetear rtcClient, channelName, remoteUsers, chatMessages, isRtcJoined, rtcError, activeLoadingMessage, hostEndedCallInfo, etc.
      dispatch({ type: AgoraActionType.LEAVE_RTM_CALL_CHANNEL }); // Esta acción debe resetear rtmChannel (de la llamada), isRtmChannelJoined, etc.

      // 7. Redirigir al Usuario (siempre se ejecuta)
      console.log(
        `${LOG_PREFIX_PROVIDER} Redirigiendo a /main/video-roulette tras salir de la llamada.`,
      );
      router.push('/main/video-roulette'); // O a la página de lobby/dashboard apropiada
    }
  }, [
    state.localUser,
    state.channelName,
    state.isRtcJoined,
    state.isRtmChannelJoined, // Importante para la lógica de currentRtmCallChannel.leave()
    state.rtcClient,
    state.rtmChannel, // Es el currentRtmCallChannel
    state.localAudioTrack,
    state.localVideoTrack,
    broadcastLocalFemaleStatusUpdate, // Dependencia para female
    closeFemaleChannelOnBackend, // Dependencia para female
    notifyMaleLeftChannelOnBackend, // Dependencia para male
    dispatch,
    router,
  ]);
  return (
    <AgoraContext.Provider
      value={{
        state,
        dispatch,
        handleVideoChatFemale,
        handleVideoChatMale,
        sendRtmChannelMessage,
        fetchInitialOnlineFemalesList,
        joinLobbyForRealtimeUpdates,
        leaveLobbyChannel,
        broadcastLocalFemaleStatusUpdate,
        loadingStatus,
        toggleLocalAudio,
        toggleLocalVideo,
        handleLeaveCall,
      }}
    >
      {children}
    </AgoraContext.Provider>
  );
}

export const useAgoraContext = () => {
  const context = useContext(AgoraContext);
  if (!context) {
    throw new Error('useAgoraContext debe usarse dentro de un AgoraProvider');
  }
  return context;
};
