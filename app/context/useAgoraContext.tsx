'use client';

import {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
  useMemo,
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
        in_call: 0,
        host_id: null,
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

  const {
    sendChatMessage: sendRtmChannelMessage,
    joinCallChannel,
    leaveCallChannel,
    sendCallSignal,
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
      initRtcClient,
      leaveRtcChannel,
      joinCallChannel,
      leaveCallChannel,
      broadcastLocalFemaleStatusUpdate,
      sendCallSignal,
      waitForUserProfile: async () => {},
    },
    state.hostEndedCallInfo,
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

  const callTimer = useCallTimer(
    isCallTimerActive,
    state.localUser?.role || null,
  );

  useEffect(() => {
    if (state.hostEndedCallInfo && state.hostEndedCallInfo.ended) {
      handleLeaveCall();

      dispatch({ type: AgoraActionType.REMOTE_HOST_ENDED_CALL, payload: null });
    }
  }, [state.hostEndedCallInfo, handleLeaveCall, dispatch]);

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
