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
import { useRouter } from 'next/navigation';

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
import { useConnectionMonitor } from '../hooks/agora/useConnectionMonitor';
import { useBeforeUnloadCleanup } from '../hooks/agora/useBeforeUnloadCleanup';
import { useOptimizedHeartbeat } from '../hooks/agora/useOptimizedHeartbeat';
import { isUserBlockedFromChannelHopping, getBlockTimeRemaining } from '../utils/channelHoppingValidation';

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
  isChannelHoppingBlocked: boolean;
  channelHoppingBlockTimeRemaining: number;
  closeChannelHoppingBlockedModal: () => void;
  showChannelHoppingBlockedModal: boolean;
  openChannelHoppingBlockedModal: () => void;
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
  // Sistema de heartbeat
  lastHeartbeat: number;
  isHeartbeatActive: boolean;
  forceZombieChannelCheck: () => Promise<void>;
  showFemaleDisconnectedModal: boolean;
  femaleDisconnectedInfo: {
    femaleName?: string;
    disconnectionReason?: 'refresh' | 'connection_lost' | 'unknown';
  } | null;
  closeFemaleDisconnectedModal: () => void;
  showFemaleDisconnectedNotification: (
    femaleName?: string,
    reason?: 'refresh' | 'connection_lost' | 'unknown'
  ) => void;
}>({
  state: initialState,
  dispatch: () => undefined,
  loadingStatus: { message: '', isLoading: false },
  handleVideoChatMale: async () => { },
  handleVideoChatFemale: async () => { },
  handleLeaveCall: async () => { },
  sendRtmChannelMessage: async () => { },
  fetchInitialOnlineFemalesList: async () => { },
  joinLobbyForRealtimeUpdates: async () => { },
  leaveLobbyChannel: async () => { },
  broadcastLocalFemaleStatusUpdate: async () => { },
  toggleLocalAudio: async () => { },
  toggleLocalVideo: async () => { },
  closeMediaPermissionsDeniedModal: () => { },
  closeNoChannelsAvailableModal: () => { },
  closeChannelIsBusyModal: () => { },
  closeUnexpectedErrorModal: () => { },
  callTimer: '00:00',
  closeInsufficientMinutesModal: () => { },
  closeMinutesExhaustedModal: () => { },
  sendGift: async () =>
    Promise.resolve({
      success: false,
      message: 'Not implemented',
      cost_in_minutes: 0,
    }),
  closeFemaleCallEndedSummaryModal: () => { },
  hopToRandomChannel: async () => { },
  isChannelHoppingBlocked: false,
  channelHoppingBlockTimeRemaining: 0,
  closeChannelHoppingBlockedModal: () => { },
  openChannelHoppingBlockedModal: () => { },
  showChannelHoppingBlockedModal: false,
  isChannelHoppingLoading: false,
  showMaleRatingModal: false,
  maleRatingInfo: null,
  closeMaleRatingModal: () => { },
  submitMaleRating: async () => { },
  sendContactNotificationThroughLobby: async () => false,
  forceEmergencyCleanup: async () => { },
  isPerformingEmergencyCleanup: false,
  lastHeartbeat: 0,
  isHeartbeatActive: false,
  forceZombieChannelCheck: async () => { },
  showFemaleDisconnectedModal: false,
  femaleDisconnectedInfo: null,
  closeFemaleDisconnectedModal: () => { },
  showFemaleDisconnectedNotification: () => { },
});

export function AgoraProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { state: userState } = useUser();

  const [state, dispatch] = useReducer(agoraReducer, initialState);

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
  }, [
    userState.user,
    dispatch,
    state.localUser?.in_call,
    state.localUser?.host_id,
    state.localUser?.status,
  ]);

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
  );

  const {
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
      waitForUserProfile: async () => { },
    },
    state.hostEndedCallInfo,
    state.current_room_id,
    callTimer,
    state.maleInitialMinutesInCall,
    state.maleGiftMinutesSpent,
    state.femaleTotalPointsEarnedInCall,
    state.channelHopping.entries,
  );

  useEffect(() => {
    if (state.hostEndedCallInfo && state.hostEndedCallInfo.ended) {
      handleLeaveCall();

      dispatch({ type: AgoraActionType.REMOTE_HOST_ENDED_CALL, payload: null });
    }
  }, [state.hostEndedCallInfo, handleLeaveCall, dispatch]);

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
    dispatch({
      type: AgoraActionType.SET_FEMALE_CALL_ENDED_INFO,
      payload: null,
    });
  }, [dispatch]);

  const {
    hopToRandomChannel,
    isBlocked: isChannelHoppingBlockedFromState,
    blockTimeRemaining: channelHoppingBlockTimeRemainingFromState,
    closeChannelHoppingBlockedModal,
    showChannelHoppingBlockedModal,
    openChannelHoppingBlockedModal,
  } = useChannelHopping(
    dispatch,
    state,
    onlineFemalesList,
    {
      handleVideoChatMale,
      handleLeaveCall,
      leaveRtcChannel,
      leaveCallChannel,
      joinCallChannel,
      initRtcClient,
      requestMediaPermissions,
    },
    router,
  );

  const isChannelHoppingBlocked = useMemo(() => {
    return isChannelHoppingBlockedFromState || isUserBlockedFromChannelHopping();
  }, [isChannelHoppingBlockedFromState]);

  const channelHoppingBlockTimeRemaining = useMemo(() => {
    const persistentTime = getBlockTimeRemaining();
    return Math.max(channelHoppingBlockTimeRemainingFromState, persistentTime);
  }, [channelHoppingBlockTimeRemainingFromState]);

  const {
    registerConnectionAttempt,
    markConnectionSuccessful,
    markConnectionFailed,
    hasActiveConnectionConflict,
  } = useConnectionMonitor(dispatch, state.localUser, onlineFemalesList);

  // Declarar showFemaleDisconnectedNotification ANTES de usarla
  const showFemaleDisconnectedNotification = useCallback((
    femaleName?: string,
    reason: 'refresh' | 'connection_lost' | 'unknown' = 'unknown'
  ) => {
    dispatch({
      type: AgoraActionType.SET_SHOW_FEMALE_DISCONNECTED_MODAL,
      payload: {
        show: true,
        femaleInfo: {
          femaleName: femaleName || 'La modelo',
          disconnectionReason: reason
        }
      },
    });
  }, [dispatch]);

  // Handler optimizado para zombies detectados
  const handleZombieChannelDetected = useCallback(async (zombieFemale: UserInformation & { disconnectionType?: 'male_disconnected' }) => {
    console.log('[Optimized] 🚨 HANDLER EJECUTADO - handleZombieChannelDetected:', {
      femaleName: zombieFemale.user_name,
      channelId: zombieFemale.host_id,
      disconnectionType: zombieFemale.disconnectionType,
      timestamp: new Date().toISOString()
    });

    if (zombieFemale.disconnectionType === 'male_disconnected') {
      // Caso especial: Male se desconectó, female debe volver a available_call
      console.log('[Optimized] 👨‍💻 Male desconectado, actualizando female a available_call:', zombieFemale.host_id);

      // NUEVO: Implementar lógica de backend siguiendo handleLeaveCall para male
      if (zombieFemale.host_id && state.current_room_id) {
        // Male se desconectó abruptamente → Replicar flujo de handleLeaveCall para male
        console.log('[Optimized] 🔄 Ejecutando limpieza de backend para male desconectado');

        // Llamar al backend directamente como en handleLeaveCall (líneas 1237-1244)
        console.log('[Optimized] 📤 Cerrando canal con status "waiting" y participación de male');

        try {
          // 1. Cambiar canal a 'waiting' (como en handleLeaveCall línea 1237)
          await agoraBackend.closeChannel(zombieFemale.host_id, 'waiting');
          console.log('[Optimized] ✅ Canal cambiado a "waiting" exitosamente');

          // 2. Cerrar participación del male (como en handleLeaveCall líneas 1241-1244)
          // Nota: No tenemos el user_id específico del male, pero el backend debería manejar esto
          if (state.current_room_id) {
            await agoraBackend.closeMaleChannel(
              'unknown_male', // El backend debería cerrar todos los males en este canal
              zombieFemale.host_id,
              state.current_room_id,
            );
            console.log('[Optimized] ✅ Participación de male cerrada exitosamente');
          }
        } catch (error) {
          console.error('[Optimized] ❌ Error en limpieza de backend para male:', error);
        }
      }

      dispatch({
        type: AgoraActionType.UPDATE_ONE_FEMALE_IN_LIST,
        payload: {
          ...zombieFemale,
          status: 'available_call', // Female vuelve a estar disponible para llamadas
          in_call: 0,               // Ya no está en llamada
          // Mantiene host_id porque su canal sigue activo
          is_active: 1,             // Mantiene activa
        },
      });

      // Si el usuario local es la female afectada, actualizar su estado local también
      if (state.localUser?.role === 'female' && state.localUser.host_id === zombieFemale.host_id) {
        dispatch({
          type: AgoraActionType.SET_LOCAL_USER_PROFILE,
          payload: {
            ...state.localUser,
            status: 'available_call',
            in_call: 0,
          },
        });
      }

    } else {
      // Caso normal: Female se desconectó (canal zombie)
      console.log('[Optimized] 🧟 Limpiando canal zombie:', zombieFemale.host_id);

      // NUEVO: Implementar lógica de backend siguiendo handleLeaveCall para female
      if (zombieFemale.host_id) {
        // Female se desconectó abruptamente → Replicar flujo de handleLeaveCall para female
        console.log('[Optimized] 🔄 Ejecutando limpieza de backend para female desconectada');
        console.log('[Optimized] 🔍 Datos de zombie female:', {
          user_id: zombieFemale.user_id,
          host_id: zombieFemale.host_id,
          user_name: zombieFemale.user_name
        });

        // Llamar al backend directamente como en handleLeaveCall (línea 1176)
        console.log('[Optimized] 📤 Cerrando canal de female con status "finished"');
        console.log('[Optimized] 🔍 Datos para closeChannel:', {
          host_id: zombieFemale.host_id,
          status: 'finished',
          agoraBackendExists: !!agoraBackend,
          closeChannelExists: typeof agoraBackend?.closeChannel === 'function'
        });

        try {
          console.log('[Optimized] 🚀 INICIANDO agoraBackend.closeChannel...');
          const result = await agoraBackend.closeChannel(zombieFemale.host_id, 'finished');
          console.log('[Optimized] 📥 Resultado de closeChannel:', result);
          console.log('[Optimized] ✅ Canal de female cerrado exitosamente con status "finished"');
        } catch (error) {
          console.error('[Optimized] ❌ Error cerrando canal de female:', error);
          console.error('[Optimized] ❌ Error stack:', error?.stack);
          console.error('[Optimized] ❌ Error details:', {
            name: error?.name,
            message: error?.message,
            cause: error?.cause
          });
        }

        // Si el usuario local es male en ese canal, debe ejecutar su handleLeaveCall
        if (state.localUser?.role === 'male' && state.channelName === zombieFemale.host_id) {
          console.log('[Optimized] 👨 Male detecta female desconectada - ejecutando handleLeaveCall');
          // Disparar handleLeaveCall del male
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('executeMaleLeaveCall'));
            }
          }, 1000);
        }
      }

      dispatch({
        type: AgoraActionType.UPDATE_ONE_FEMALE_IN_LIST,
        payload: {
          ...zombieFemale,
          status: 'online',    // Como en handleLeaveCall: vuelve a 'online'
          in_call: 0,          // Como en handleLeaveCall: no en llamada
          host_id: null,       // Como en handleLeaveCall: limpia host_id
          is_active: 1,        // Como en handleLeaveCall: mantiene activa
        },
      });

      // Si el usuario local es male y está en ese canal, mostrar notificación
      if (state.localUser?.role === 'male' && state.channelName === zombieFemale.host_id) {
        showFemaleDisconnectedNotification(zombieFemale.user_name, 'connection_lost');
      }
    }
  }, [dispatch, state.localUser, state.channelName, state.current_room_id, showFemaleDisconnectedNotification, agoraBackend]);

  // Sistema optimizado que combina heartbeat y detección de zombies
  const { lastHeartbeat, isActive: isHeartbeatActive } = useOptimizedHeartbeat({
    localUser: state.localUser,
    isRtcJoined: state.isRtcJoined,
    currentChannelName: state.channelName,
    current_room_id: state.current_room_id,
    onlineFemalesList,
    onZombieDetected: handleZombieChannelDetected,
    enabled: true,
    intervalMs: 30000, // Cada 30 segundos para evitar rate limiting
  });

  // Función dummy para compatibilidad
  const forceZombieCheck = useCallback(async () => {
    console.log('[Optimized] Force check no disponible en modo optimizado');
  }, []);

  // Hook para limpieza automática en beforeunload/pagehide (como backup)
  const { forceCleanup, isCleaningUp } = useBeforeUnloadCleanup({
    localUser: state.localUser,
    isRtcJoined: state.isRtcJoined,
    isRtmChannelJoined: state.isRtmChannelJoined,
    currentChannelName: state.channelName,
    current_room_id: state.current_room_id,
    leaveCallChannel,
    leaveRtcChannel,
    broadcastLocalFemaleStatusUpdate,
    // Configuración más conservadora - solo como backup
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

  // Listener para eventos de desconexión de females
  useEffect(() => {
    const handleFemaleDisconnected = (event: CustomEvent) => {
      const { femaleName, reason } = event.detail;

      // Solo mostrar la notificación si el usuario local es male y está en una llamada
      if (state.localUser?.role === 'male' && state.isRtcJoined) {
        console.log('[Female Disconnected] Mostrando notificación de desconexión:', { femaleName, reason });
        showFemaleDisconnectedNotification(femaleName, reason);
      }
    };

    const handleExecuteMaleLeaveCall = () => {
      // Ejecutar handleLeaveCall cuando se detecta que la female se desconectó
      if (state.localUser?.role === 'male' && state.isRtcJoined) {
        console.log('[Male Leave Call] Ejecutando handleLeaveCall por female desconectada');
        handleLeaveCall();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('femaleDisconnectedFromCall', handleFemaleDisconnected as EventListener);
      window.addEventListener('executeMaleLeaveCall', handleExecuteMaleLeaveCall);

      return () => {
        window.removeEventListener('femaleDisconnectedFromCall', handleFemaleDisconnected as EventListener);
        window.removeEventListener('executeMaleLeaveCall', handleExecuteMaleLeaveCall);
      };
    }
  }, [state.localUser, state.isRtcJoined, showFemaleDisconnectedNotification, handleLeaveCall]);

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
        isChannelHoppingBlocked,
        channelHoppingBlockTimeRemaining,
        closeChannelHoppingBlockedModal,
        openChannelHoppingBlockedModal,
        showChannelHoppingBlockedModal,
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
        forceZombieChannelCheck: forceZombieCheck,
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
