'use client';

import {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';

import { useUser } from './useClientContext';

import { agoraReducer, initialState } from '../reducer/agora.reducer';

import { useAgoraRtm } from '../hooks/agora/useAgoraRtm';
import { useAgoraRtc } from '../hooks/agora/useAgoraRtc';
import { useAgoraLobby } from '../hooks/agora/useAgoraLobby';
import { useCallFlows } from '../hooks/agora/useCallFlows';
import { useCallTimer } from '../hooks/useCallTimer';
import {
  AgoraAction,
  AgoraActionType,
  AgoraState,
  LoadingStatus,
  UserInformation,
} from '../types/streams';
import { useAgoraServer } from '../hooks/agora/useAgoraServer';
import { useAgoraCallChannel } from '../hooks/agora/useAgoraChannel';
import { useChannelHopping } from '../hooks/agora/useChannelHopping';
import { useChannelHoppingCooldown } from '../hooks/agora/useChannelHoppingCooldown';
import { useConnectionMonitor } from '../hooks/agora/useConnectionMonitor';
import { useBeforeUnloadCleanup } from '../hooks/agora/useBeforeUnloadCleanup';
import { useOptimizedHeartbeat } from '../hooks/agora/useOptimizedHeartbeat';
import { useChannelValidation } from '../hooks/agora/useChannelValidation';

const AgoraContext = createContext<{
  state: AgoraState;
  dispatch: React.Dispatch<AgoraAction>;
  loadingStatus: LoadingStatus;
  handleVideoChatMale: (channelToJoin?: string) => Promise<void>;
  handleVideoChatFemale: () => Promise<void>;
  handleLeaveCall: () => Promise<void>;
  sendRtmChannelMessage: (messageText: string) => Promise<void>;
  fetchInitialOnlineFemalesList: () => Promise<void>;
  joinLobbyForRealtimeUpdates: () => Promise<void>;
  leaveLobbyChannel: () => Promise<void>;
  broadcastLocalFemaleStatusUpdate: (
    statusInfo: Partial<UserInformation>,
  ) => Promise<void>;
  toggleLocalAudio: () => Promise<void>;
  toggleLocalVideo: () => Promise<void>;
  closeMediaPermissionsDeniedModal: () => void;
  closeNoChannelsAvailableModal: () => void;
  closeChannelIsBusyModal: () => void;
  closeUnexpectedErrorModal: () => void;
  callTimer: string;
  closeInsufficientMinutesModal: () => void;
  closeMinutesExhaustedModal: () => void;
  sendGift: (
    gifId: string | number,
    giftCostInMinutes: number,
    gift_image: string,
    giftPoints: number,
    gift_name: string,
  ) => Promise<
    | { success: boolean; message?: string; cost_in_minutes: number }
    | { success: boolean; message: string }
  >;
  closeFemaleCallEndedSummaryModal: () => void;
  hopToRandomChannel: () => Promise<void>;
  isHoppingDisabled: boolean;
  remainingTime: number;
  isChannelHoppingLoading: boolean;
  showMaleRatingModal: boolean;
  maleRatingInfo: {
    femaleId: string | number;
    femaleName?: string;
    femaleAvatar?: string;
  } | null;
  closeMaleRatingModal: () => void;
  submitMaleRating: (rating: number, comment?: string) => Promise<void>;
  sendContactNotificationThroughLobby: (
    targetUserId: string | number,
    targetUserName: string,
    action: 'added' | 'removed',
  ) => Promise<boolean>;
  forceEmergencyCleanup: () => Promise<void>;
  isPerformingEmergencyCleanup: boolean;
  lastHeartbeat: number;
  isHeartbeatActive: boolean;
  showFemaleDisconnectedModal: boolean;
  femaleDisconnectedInfo: {
    femaleName?: string;
    disconnectionReason?: 'refresh' | 'connection_lost' | 'unknown';
  } | null;
  closeFemaleDisconnectedModal: () => void;
  showFemaleDisconnectedNotification: (
    femaleName?: string,
    reason?: 'refresh' | 'connection_lost' | 'unknown',
  ) => void;
}>({
  state: initialState,
  dispatch: () => undefined,
  loadingStatus: { message: '', isLoading: false },
  handleVideoChatMale: async () => {},
  handleVideoChatFemale: async () => {},
  handleLeaveCall: async () => {},
  sendRtmChannelMessage: async () => {},
  fetchInitialOnlineFemalesList: async () => {},
  joinLobbyForRealtimeUpdates: async () => {},
  leaveLobbyChannel: async () => {},
  broadcastLocalFemaleStatusUpdate: async () => {},
  toggleLocalAudio: async () => {},
  toggleLocalVideo: async () => {},
  closeMediaPermissionsDeniedModal: () => {},
  closeNoChannelsAvailableModal: () => {},
  closeChannelIsBusyModal: () => {},
  closeUnexpectedErrorModal: () => {},
  callTimer: '00:00',
  closeInsufficientMinutesModal: () => {},
  closeMinutesExhaustedModal: () => {},
  sendGift: async () =>
    Promise.resolve({
      success: false,
      message: 'Not implemented',
      cost_in_minutes: 0,
    }),
  closeFemaleCallEndedSummaryModal: () => {},
  hopToRandomChannel: async () => {},
  isHoppingDisabled: false,
  remainingTime: 0,
  isChannelHoppingLoading: false,
  showMaleRatingModal: false,
  maleRatingInfo: null,
  closeMaleRatingModal: () => {},
  submitMaleRating: async () => {},
  sendContactNotificationThroughLobby: async () => false,
  forceEmergencyCleanup: async () => {},
  isPerformingEmergencyCleanup: false,
  lastHeartbeat: 0,
  isHeartbeatActive: false,
  showFemaleDisconnectedModal: false,
  femaleDisconnectedInfo: null,
  closeFemaleDisconnectedModal: () => {},
  showFemaleDisconnectedNotification: () => {},
});

export function AgoraProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { state: userState, handleGetInformation } = useUser();

  const [state, dispatch] = useReducer(agoraReducer, initialState);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSummary = localStorage.getItem('femaleCallSummary');
      if (savedSummary) {
        try {
          const parsed = JSON.parse(savedSummary);
          const timeDiff = Date.now() - parsed.timestamp;

          if (timeDiff < 5 * 60 * 1000) {
            dispatch({
              type: AgoraActionType.SET_FEMALE_CALL_ENDED_INFO,
              payload: parsed.callSummaryInfo,
            });
            dispatch({
              type: AgoraActionType.SET_FEMALE_CALL_ENDED_MODAL,
              payload: parsed.showModal,
            });
          } else {
            localStorage.removeItem('femaleCallSummary');
          }
        } catch (error) {
          console.error(
            '[AgoraContext] Error restaurando desde localStorage:',
            error,
          );
          localStorage.removeItem('femaleCallSummary');
        }
      }
    }
  }, []);

  useEffect(() => {
    if (pathname === '/main/video-roulette' && typeof window !== 'undefined') {
      const savedSummary = localStorage.getItem('femaleCallSummary');

      if (savedSummary) {
        try {
          const parsed = JSON.parse(savedSummary);
          const timeDiff = Date.now() - parsed.timestamp;

          if (timeDiff < 5 * 60 * 1000) {
            dispatch({
              type: AgoraActionType.SET_FEMALE_CALL_ENDED_INFO,
              payload: parsed.callSummaryInfo,
            });
            dispatch({
              type: AgoraActionType.SET_FEMALE_CALL_ENDED_MODAL,
              payload: parsed.showModal,
            });
          } else {
            localStorage.removeItem('femaleCallSummary');
          }
        } catch (error) {
          console.error(
            '[AgoraContext] Error en restauración por cambio de ruta:',
            error,
          );
          localStorage.removeItem('femaleCallSummary');
        }
      }
    }
  }, [pathname]);

  useEffect(() => {
    if (userState.user) {
      let role: 'female' | 'male' | 'admin' | undefined = undefined;
      if (userState.user.name === 'Abraham Moreno') {
        role = 'admin';
      } else if (
        userState.user.gender === 'female' ||
        userState.user.type === 'host'
      ) {
        role = 'female';
      } else if (userState.user.gender === 'male') {
        role = 'male';
      }

      const localUserProfile: UserInformation = {
        user_id: userState.user.id,
        rtcUid: userState.user.id,
        rtmUid: userState.user.id,
        user_name: userState.user.name,
        avatar: userState.user.profile_photo_path,
        role: role,
        is_active: 1,
        in_call: state.localUser?.in_call || 0,
        host_id: state.localUser?.host_id || null,
        status: state.localUser?.status || undefined,
      };

      dispatch({
        type: AgoraActionType.SET_LOCAL_USER_PROFILE,
        payload: localUserProfile,
      });
    } else if (!userState.user) {
      dispatch({ type: AgoraActionType.SET_LOCAL_USER_PROFILE, payload: null });
    }
  }, [userState.user, dispatch]);

  const agoraBackend = useAgoraServer(dispatch);

  const {
    rtmClient,
    isRtmLoggedIn,
    isLoadingRtm: isRtmClientLoading,
    rtmError: rtmClientError,
    initializeRtmClient,
  } = useAgoraRtm(
    dispatch,
    state.appID,
    state.tokenRtm,
    state.localUser,
    agoraBackend,
  );

  const {
    onlineFemalesList,
    isLoadingOnlineFemales,
    onlineFemalesError,
    fetchOnlineFemalesList,
    joinLobby: joinLobbyForRealtimeUpdates,
    leaveLobby: leaveLobbyChannel,
    broadcastLocalFemaleStatusUpdate,
    sendContactNotificationThroughLobby,
  } = useAgoraLobby(
    dispatch,
    state.appID,
    state.localUser,
    rtmClient,
    isRtmLoggedIn,
    agoraBackend,
    initializeRtmClient,
    state.onlineFemalesList,
  );

  const {
    rtcClient,
    localAudioTrack,
    localVideoTrack,
    isRtcJoined,
    rtcError,
    requestingMediaPermissions,
    requestMediaPermissions,
    initializeRtc: initRtcClient,
    leaveRtcChannel,
    toggleLocalAudio,
    toggleLocalVideo,
    closeMediaPermissionsDeniedModal,
  } = useAgoraRtc(
    dispatch,
    state.appID,
    state.tokenRtc,
    state.localUser,
    state.remoteUsers,
    agoraBackend,
    broadcastLocalFemaleStatusUpdate,
  );

  const isCallTimerActive = useMemo(() => {
    if (state.localUser?.role === 'admin') {
      return false;
    }
    const isLocalUserInCall = state.isRtcJoined;
    const hasActiveRemoteMale = state.remoteUsers.some(
      (user) => user.role === 'male' && (user.hasAudio || user.hasVideo),
    );

    return (
      (state.localUser?.role === 'male' && isLocalUserInCall) ||
      (state.localUser?.role === 'female' &&
        isLocalUserInCall &&
        hasActiveRemoteMale)
    );
  }, [state.localUser, state.isRtcJoined, state.remoteUsers]);

  const { formattedTime: callTimer, resetTimer: resetCallTimer } = useCallTimer(
    isCallTimerActive,
    state.localUser?.role || null,
  );

  const prevRemoteUsersCount = useRef(state.remoteUsers.length);
  const prevIsCallTimerActive = useRef(isCallTimerActive);
  const maleDisconnectHandlingRef = useRef(false);

  const {
    sendChatMessage: sendRtmChannelMessage,
    joinCallChannel,
    leaveCallChannel,
    sendCallSignal,
    sendGift,
  } = useAgoraCallChannel(
    dispatch,
    state.appID,
    state.localUser,
    rtmClient,
    isRtmLoggedIn,
    agoraBackend,
    initializeRtmClient,
    state,
    broadcastLocalFemaleStatusUpdate,
    callTimer,
    state.femaleTotalPointsEarnedInCall,
  );

  const {
    registerConnectionAttempt,
    markConnectionSuccessful,
    markConnectionFailed,
    hasActiveConnectionConflict,
  } = useConnectionMonitor(dispatch, state.localUser, onlineFemalesList);

  const {
    handleVideoChatMale,
    handleVideoChatFemale,
    handleLeaveCall,
    closeNoChannelsAvailableModal,
    closeChannelIsBusyModal,
    closeUnexpectedErrorModal,
  } = useCallFlows(
    router,
    dispatch,
    state.localUser,
    state.appID,
    state.channelName,
    state.isRtcJoined,
    state.isRtmChannelJoined,
    onlineFemalesList,
    agoraBackend,
    {
      requestMediaPermissions,
      initRtcClient,
      leaveRtcChannel,
      joinCallChannel,
      leaveCallChannel,
      broadcastLocalFemaleStatusUpdate,
      sendCallSignal,
      waitForUserProfile: async () => {},
    },
    state.hostEndedCallInfo,
    state.current_room_id,
    callTimer,
    state.maleInitialMinutesInCall,
    state.maleGiftMinutesSpent,
    state.femaleTotalPointsEarnedInCall,
    state.channelHopping.entries,
    undefined,
    {
      registerConnectionAttempt,
      markConnectionSuccessful,
      markConnectionFailed,
      hasActiveConnectionConflict,
    },
    state.isChannelHoppingLoading,
  );

  const { validateChannelAvailability, clearChannelAttempt } =
    useChannelValidation();

  const { hopToRandomChannel } = useChannelHopping(
    dispatch,
    state,
    onlineFemalesList,
    {
      handleLeaveCall,
      leaveCallChannel,
      leaveRtcChannel,
      joinCallChannel,
      sendCallSignal,
      router,
      validateChannelAvailability,
      clearChannelAttempt,
    },
    {
      rtcClient,
      localAudioTrack,
      localVideoTrack,
      agoraBackend,
    },
  );

  const { isHoppingDisabled, remainingTime } = useChannelHoppingCooldown({
    currentChannel: state.channelName,
  });

  useEffect(() => {
    if (state.hostEndedCallInfo && state.hostEndedCallInfo.ended) {
      if (state.isChannelHoppingLoading) {
        return;
      }

      const isChannelHoppingActive =
        typeof window !== 'undefined' &&
        window.localStorage.getItem('channelHopping_in_progress') === 'true';

      if (isChannelHoppingActive) {
        return;
      }

      handleLeaveCall(false, 'female_ended_call');

      dispatch({ type: AgoraActionType.REMOTE_HOST_ENDED_CALL, payload: null });
    }
  }, [
    state.hostEndedCallInfo,
    handleLeaveCall,
    dispatch,
    state.isChannelHoppingLoading,
  ]);

  useEffect(() => {
    const currentRemoteUsersCount = state.remoteUsers.length;
    const currentIsCallTimerActive = isCallTimerActive;

    if (
      prevIsCallTimerActive.current &&
      !currentIsCallTimerActive &&
      state.isRtcJoined
    ) {
      dispatch({ type: AgoraActionType.CLEAR_CHAT_MESSAGES });

      resetCallTimer();
    }

    if (
      prevRemoteUsersCount.current > currentRemoteUsersCount &&
      state.isRtcJoined
    ) {
      dispatch({ type: AgoraActionType.CLEAR_CHAT_MESSAGES });

      resetCallTimer();
    }

    if (!state.isRtcJoined && state.chatMessages.length > 0) {
      dispatch({ type: AgoraActionType.CLEAR_CHAT_MESSAGES });

      resetCallTimer();
    }

    if (!state.isRtcJoined) {
      maleDisconnectHandlingRef.current = false;
    }

    prevRemoteUsersCount.current = currentRemoteUsersCount;
    prevIsCallTimerActive.current = currentIsCallTimerActive;
  }, [
    state.remoteUsers.length,
    isCallTimerActive,
    state.isRtcJoined,
    state.chatMessages.length,
    dispatch,
    resetCallTimer,
  ]);

  const loadingStatus = useMemo<LoadingStatus>(() => {
    const { activeLoadingMessage } = state;

    if (rtcError)
      return { message: `Error de Video/Audio: ${rtcError}`, isLoading: false };
    if (rtmClientError)
      return {
        message: `Error de Conexión General: ${rtmClientError}`,
        isLoading: false,
      };
    if (onlineFemalesError)
      return {
        message: `Error al Cargar Modelos: ${onlineFemalesError}`,
        isLoading: false,
      };

    if (
      activeLoadingMessage &&
      (requestingMediaPermissions ||
        isRtcJoined ||
        isRtmClientLoading ||
        isLoadingOnlineFemales)
    ) {
      return { message: activeLoadingMessage, isLoading: true };
    }

    if (requestingMediaPermissions)
      return {
        message: 'Solicitando permisos de cámara/micrófono...',
        isLoading: true,
      };
    if (isRtcJoined)
      return {
        message: 'Estableciendo conexión de video y audio...',
        isLoading: true,
      };
    if (isRtmClientLoading)
      return {
        message: 'Procesando conexión en tiempo real...',
        isLoading: true,
      };
    if (isLoadingOnlineFemales)
      return { message: 'Actualizando lista de modelos...', isLoading: true };

    return { message: '', isLoading: false };
  }, [
    rtcError,
    rtmClientError,
    onlineFemalesError,
    state.activeLoadingMessage,
    requestingMediaPermissions,
    isRtcJoined,
    isRtmClientLoading,
    isLoadingOnlineFemales,
  ]);

  const closeInsufficientMinutesModal = useCallback(() => {
    dispatch({
      type: AgoraActionType.SET_SHOW_INSUFFICIENT_MINUTES_MODAL,
      payload: false,
    });
  }, [dispatch]);

  const closeMinutesExhaustedModal = useCallback(() => {
    dispatch({
      type: AgoraActionType.SET_SHOW_MINUTES_EXHAUSTED_MODAL,
      payload: false,
    });
  }, [dispatch]);

  const closeFemaleCallEndedSummaryModal = useCallback(() => {
    dispatch({
      type: AgoraActionType.SET_FEMALE_CALL_ENDED_MODAL,
      payload: false,
    });

    setTimeout(() => {
      dispatch({
        type: AgoraActionType.SET_FEMALE_CALL_ENDED_INFO,
        payload: null,
      });
      if (typeof window !== 'undefined') {
        localStorage.removeItem('femaleCallSummary');
      }
    }, 30000);
  }, [dispatch]);

  const showFemaleDisconnectedNotification = useCallback(
    (
      femaleName?: string,
      reason: 'refresh' | 'connection_lost' | 'unknown' = 'unknown',
    ) => {
      dispatch({
        type: AgoraActionType.SET_SHOW_FEMALE_DISCONNECTED_MODAL,
        payload: {
          show: true,
          femaleInfo: {
            femaleName: femaleName || 'La modelo',
            disconnectionReason: reason,
          },
        },
      });
    },
    [dispatch],
  );

  const handleZombieChannelDetected = useCallback(
    async (
      zombieFemale: UserInformation & {
        disconnectionType?: 'male_disconnected';
      },
    ) => {
      return;

      /* CÓDIGO ORIGINAL COMENTADO:
      if (zombieFemale.disconnectionType === 'male_disconnected') {
        dispatch({
          type: AgoraActionType.UPDATE_ONE_FEMALE_IN_LIST,
          payload: {
            ...zombieFemale,
            status: 'available_call',
            in_call: 0,
            is_active: 1,
          },
        });

        if (
          state.localUser?.role === 'female' &&
          state.localUser.host_id === zombieFemale.host_id
        ) {
          dispatch({
            type: AgoraActionType.SET_LOCAL_USER_PROFILE,
            payload: {
              ...state.localUser,
              status: 'available_call',
              in_call: 0,
            },
          });

          await broadcastLocalFemaleStatusUpdate({
            status: 'available_call',
            in_call: 0,
            host_id: zombieFemale.host_id,
            is_active: 1,
          });
        }

        if (zombieFemale.host_id && state.current_room_id) {
          try {
            await agoraBackend.closeChannel(zombieFemale.host_id, 'waiting');
            if (state.current_room_id && zombieFemale.host_id) {
              await agoraBackend.closeMaleChannel(
                'unknown_male',
                zombieFemale.host_id,
                state.current_room_id,
              );
            }
          } catch (error) {
            console.error('Error en limpieza de backend:', error);
          }
        }

        return;
      } else {
        dispatch({
          type: AgoraActionType.UPDATE_ONE_FEMALE_IN_LIST,
          payload: {
            ...zombieFemale,
            status: 'online',
            in_call: 0,
            host_id: null,
            is_active: 1,
          },
        });

        if (
          state.localUser?.role === 'male' &&
          state.channelName === zombieFemale.host_id
        ) {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('femaleDisconnectedFromCall', {
                detail: {
                  femaleName: zombieFemale.user_name || 'La modelo',
                  femaleId: zombieFemale.user_id,
                  channelId: zombieFemale.host_id,
                  reason: 'connection_lost',
                },
              }),
            );
          }
        }

        if (zombieFemale.host_id) {
          try {
            const authToken = document.cookie
              .split('; ')
              .find((row) => row.startsWith('auth_token='))
              ?.split('=')[1];

            const formData = new FormData();
            formData.append('status', 'finished');
            formData.append('host_id', zombieFemale.host_id);

            await fetch('https://app.conexmeet.live/api/v1/status-room', {
              method: 'POST',
              headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${authToken}`,
              },
              body: formData,
            });
          } catch (error) {
            console.error('Error cerrando canal de female:', error);
          }
        }
      }
      */ // FIN DEL CÓDIGO ORIGINAL COMENTADO
    },
    [
      dispatch,
      state.localUser,
      state.channelName,
      state.current_room_id,
      showFemaleDisconnectedNotification,
      agoraBackend,
    ],
  );

  // TEMPORALMENTE COMENTADO PARA DEBUGGING
  // const { lastHeartbeat, isActive: isHeartbeatActive } = useOptimizedHeartbeat({
  //   localUser: state.localUser,
  //   isRtcJoined: state.isRtcJoined,
  //   currentChannelName: state.channelName,
  //   current_room_id: state.current_room_id,
  //   onlineFemalesList,
  //   onZombieDetected: handleZombieChannelDetected,
  //   enabled: true,
  //   intervalMs: 60000,
  // });

  // Variables temporales para mantener compatibilidad
  const lastHeartbeat = Date.now();
  const isHeartbeatActive = false;

  // ✅ FAIL-SAFE: Detector global de estados problemáticos
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let problemStateTimeout: NodeJS.Timeout;

    // Detectar estados problemáticos que requieren intervención
    const hasProblemState =
      // Canal activo sin RTC por mucho tiempo
      (state.channelName && !state.isRtcJoined && !state.isLoadingRtc) ||
      // Múltiples modales de error activos
      (state.showUnexpectedErrorModal && state.showChannelIsBusyModal) ||
      // Carga prolongada sin progreso
      (state.isLoadingRtc &&
        state.activeLoadingMessage &&
        !state.isRequestingMediaPermissions);

    if (hasProblemState) {
      console.warn(
        '[Global Problem Detector] ⚠️ Estado problemático detectado',
      );

      problemStateTimeout = setTimeout(() => {
        console.error(
          '[Global Problem Detector] 🚨 Estado problemático persistente - Activando limpieza automática',
        );
        emergencyExitToLobby();
      }, 45000); // 45 segundos
    }

    return () => {
      if (problemStateTimeout) {
        clearTimeout(problemStateTimeout);
      }
    };
  }, [
    state.channelName,
    state.isRtcJoined,
    state.isLoadingRtc,
    state.showUnexpectedErrorModal,
    state.showChannelIsBusyModal,
    state.activeLoadingMessage,
    state.isRequestingMediaPermissions,
  ]);

  const { forceCleanup, isCleaningUp } = useBeforeUnloadCleanup({
    localUser: state.localUser,
    isRtcJoined: state.isRtcJoined,
    isRtmChannelJoined: state.isRtmChannelJoined,
    currentChannelName: state.channelName,
    current_room_id: state.current_room_id,
    leaveCallChannel,
    leaveRtcChannel,
    broadcastLocalFemaleStatusUpdate,
    enableVisibilityCleanup: false,
    visibilityCleanupDelay: 60000,
  });

  const closeMaleRatingModal = useCallback(() => {
    dispatch({
      type: AgoraActionType.SET_SHOW_MALE_RATING_MODAL,
      payload: { show: false, femaleInfo: null },
    });
  }, [dispatch]);

  const closeFemaleDisconnectedModal = useCallback(() => {
    dispatch({
      type: AgoraActionType.SET_SHOW_FEMALE_DISCONNECTED_MODAL,
      payload: { show: false, femaleInfo: null },
    });
  }, [dispatch]);

  // ✅ FAIL-SAFE: Función de emergencia para salir al lobby (solo para uso interno)
  const emergencyExitToLobby = useCallback(() => {
    console.warn(
      '[Emergency Exit] 🚨 Ejecutando salida de emergencia al lobby',
    );

    // Limpiar todo el estado
    dispatch({ type: AgoraActionType.LEAVE_RTC_CHANNEL });
    dispatch({ type: AgoraActionType.LEAVE_RTM_CALL_CHANNEL });
    dispatch({ type: AgoraActionType.CLEAR_CHAT_MESSAGES });

    // Cerrar todos los modales
    dispatch({
      type: AgoraActionType.SET_SHOW_NO_CHANNELS_AVAILABLE_MODAL_FOR_MALE,
      payload: false,
    });
    dispatch({
      type: AgoraActionType.SET_SHOW_CHANNEL_IS_BUSY_MODAL,
      payload: false,
    });
    dispatch({
      type: AgoraActionType.SET_SHOW_UNEXPECTED_ERROR_MODAL,
      payload: false,
    });
    dispatch({
      type: AgoraActionType.SET_SHOW_MEDIA_PERMISSIONS_DENIED_MODAL,
      payload: false,
    });
    dispatch({
      type: AgoraActionType.SET_SHOW_INSUFFICIENT_MINUTES_MODAL,
      payload: false,
    });
    dispatch({
      type: AgoraActionType.SET_SHOW_MINUTES_EXHAUSTED_MODAL,
      payload: false,
    });

    // Limpiar localStorage relacionado
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('channelHopping_in_progress');
      window.localStorage.removeItem('femaleCallSummary');
    }

    // Forzar redirección
    router.push('/main/video-roulette');

    // Recargar información del usuario
    setTimeout(() => {
      handleGetInformation().catch(console.error);
    }, 1000);
  }, [dispatch, router, handleGetInformation]);

  useEffect(() => {
    const handleFemaleDisconnected = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { femaleName, reason } = customEvent.detail;

      if (state.localUser?.role === 'male' && state.isRtcJoined) {
        dispatch({
          type: AgoraActionType.SET_SHOW_FEMALE_DISCONNECTED_MODAL,
          payload: {
            show: true,
            femaleInfo: {
              femaleName: femaleName || 'La modelo',
              disconnectionReason: reason || 'unknown',
            },
          },
        });

        try {
          if (state.channelName && state.current_room_id) {
            const authToken = document.cookie
              .split('; ')
              .find((row) => row.startsWith('auth_token='))
              ?.split('=')[1];

            const formdata = new FormData();
            formdata.append('user_id', String(state.localUser.user_id));
            formdata.append('host_id', String(state.channelName));
            formdata.append('id', String(state.current_room_id));

            const externalHeaders: Record<string, string> = {
              Accept: 'application/json',
              Authorization: `Bearer ${authToken}`,
            };

            const closeMaleResponse = await fetch(
              'https://app.conexmeet.live/api/v1/closed-room',
              {
                method: 'POST',
                headers: externalHeaders,
                body: formdata,
              },
            );

            const closeMaleData = await closeMaleResponse.json();
          }

          await leaveRtcChannel();
          await leaveCallChannel();
        } catch (error) {
          console.error(
            '[Female Disconnected] ❌ Error en limpieza automática:',
            error,
          );
        }
      }
    };

    const handleMaleDisconnectedForceLeave = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { reason } = customEvent.detail;

      if (
        state.localUser?.role === 'female' &&
        state.isRtcJoined &&
        !isCleaningUp &&
        !maleDisconnectHandlingRef.current &&
        !state.isChannelHoppingLoading
      ) {
        maleDisconnectHandlingRef.current = true;

        const currentFemaleUser = state.localUser;

        try {
          await handleLeaveCall();
        } catch (error) {
          console.error(
            '[Female] ❌ Error ejecutando handleLeaveCall por male disconnect:',
            error,
          );
        } finally {
          setTimeout(() => {
            maleDisconnectHandlingRef.current = false;
          }, 2000);
        }
      } else if (state.localUser?.role === 'female') {
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(
        'femaleDisconnectedFromCall',
        handleFemaleDisconnected,
      );
      window.addEventListener(
        'maleDisconnectedForceLeave',
        handleMaleDisconnectedForceLeave,
      );

      return () => {
        window.removeEventListener(
          'femaleDisconnectedFromCall',
          handleFemaleDisconnected,
        );
        window.removeEventListener(
          'maleDisconnectedForceLeave',
          handleMaleDisconnectedForceLeave,
        );
      };
    }
  }, [
    state.localUser,
    state.isRtcJoined,
    showFemaleDisconnectedNotification,
    handleLeaveCall,
    leaveRtcChannel,
    leaveCallChannel,
    handleGetInformation,
    isCleaningUp,
  ]);

  const submitMaleRating = useCallback(
    async (rating: number, comment?: string) => {
      try {
        if (!state.maleRatingInfo) {
          return;
        }

        closeMaleRatingModal();
      } catch (error) {
        console.error('[Rating] Error al enviar calificación:', error);
      }
    },
    [state.maleRatingInfo, agoraBackend, closeMaleRatingModal],
  );

  return (
    <AgoraContext.Provider
      value={{
        state,
        dispatch,
        handleVideoChatFemale,
        handleVideoChatMale,
        sendRtmChannelMessage,
        fetchInitialOnlineFemalesList: fetchOnlineFemalesList,
        joinLobbyForRealtimeUpdates,
        leaveLobbyChannel,
        broadcastLocalFemaleStatusUpdate,
        loadingStatus,
        toggleLocalAudio,
        toggleLocalVideo,
        handleLeaveCall,
        closeMediaPermissionsDeniedModal,
        closeNoChannelsAvailableModal,
        closeChannelIsBusyModal,
        closeUnexpectedErrorModal,
        callTimer,
        closeInsufficientMinutesModal,
        closeMinutesExhaustedModal,
        sendGift,
        closeFemaleCallEndedSummaryModal,
        hopToRandomChannel,
        isHoppingDisabled,
        remainingTime,
        isChannelHoppingLoading: state.isChannelHoppingLoading,
        showMaleRatingModal: state.showMaleRatingModal,
        maleRatingInfo: state.maleRatingInfo,
        closeMaleRatingModal,
        submitMaleRating,
        sendContactNotificationThroughLobby,
        forceEmergencyCleanup: forceCleanup,
        isPerformingEmergencyCleanup: isCleaningUp,
        lastHeartbeat,
        isHeartbeatActive,
        showFemaleDisconnectedModal: state.showFemaleDisconnectedModal,
        femaleDisconnectedInfo: state.femaleDisconnectedInfo,
        closeFemaleDisconnectedModal,
        showFemaleDisconnectedNotification,
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
