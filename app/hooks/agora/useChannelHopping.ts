import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  AgoraAction,
  AgoraActionType,
  AgoraState,
  UserInformation,
} from '@/app/types/streams';
import { useChannelHoppingPersistence } from './useChannelHoppingPersistence';

interface ChannelHoppingFunctions {
  handleVideoChatMale: (channelToJoin?: string) => Promise<void>;
  handleLeaveCall: () => Promise<void>;
  leaveRtcChannel: () => Promise<void>;
  leaveCallChannel: () => Promise<void>;
  joinCallChannel: (channelName: string) => Promise<any>;
  initRtcClient: (
    channelName: string,
    rtcUid: string,
    roleForToken: 'publisher' | 'subscriber',
    publishTracksFlag: boolean,
    loadingMessage?: string,
    preCreatedTracks?: any,
  ) => Promise<any>;
  requestMediaPermissions: () => Promise<any>;
}

const BLOCK_DURATION_MS = 5 * 60 * 1000;
const MIN_STAY_DURATION_SECONDS = 15;

export const useChannelHopping = (
  dispatch: React.Dispatch<AgoraAction>,
  state: AgoraState,
  onlineFemalesList: UserInformation[],
  { handleVideoChatMale, handleLeaveCall }: ChannelHoppingFunctions,
  router: ReturnType<typeof useRouter>,
) => {
  const currentChannelJoinTimeRef = useRef<number | null>(null);

  const { clearPersistedState } = useChannelHoppingPersistence(
    state.channelHopping,
    dispatch,
  );

  const checkBlockExpiration = useCallback(() => {
    if (state.channelHopping.isBlocked && state.channelHopping.blockStartTime) {
      const now = Date.now();
      const blockElapsed = now - state.channelHopping.blockStartTime;

      if (blockElapsed >= BLOCK_DURATION_MS) {
        dispatch({ type: AgoraActionType.RESET_CHANNEL_HOPPING });
        clearPersistedState();
      }
    }
  }, [
    state.channelHopping.isBlocked,
    state.channelHopping.blockStartTime,
    dispatch,
    clearPersistedState,
  ]);

  useEffect(() => {
    const interval = setInterval(checkBlockExpiration, 60000);
    return () => clearInterval(interval);
  }, [checkBlockExpiration]);

  const evaluateChannelHoppingBehavior = useCallback(() => {
    const { entries } = state.channelHopping;

    const completedEntries = entries.filter(
      (entry) => entry.leaveTime && entry.duration !== undefined,
    );

    if (completedEntries.length === 0) {
      return false;
    }

    let consecutiveShortVisits = 0;

    for (let i = completedEntries.length - 1; i >= 0; i--) {
      const entry = completedEntries[i];

      if (entry.duration! < MIN_STAY_DURATION_SECONDS) {
        consecutiveShortVisits++;
      } else {
        break;
      }
    }

    return consecutiveShortVisits >= 4;
  }, [state.channelHopping.entries]);

  const registerChannelJoin = useCallback(
    (hostId: string) => {
      const joinTime = Date.now();
      currentChannelJoinTimeRef.current = joinTime;

      dispatch({
        type: AgoraActionType.CHANNEL_HOP_JOIN,
        payload: { hostId, joinTime },
      });
    },
    [dispatch],
  );

  const registerChannelLeave = useCallback(
    (hostId: string, isChannelHopping: boolean = false) => {
      const leaveTime = Date.now();
      currentChannelJoinTimeRef.current = null;

      dispatch({
        type: AgoraActionType.CHANNEL_HOP_LEAVE,
        payload: { hostId, leaveTime },
      });

      setTimeout(() => {
        const { entries } = state.channelHopping;
        const completedEntries = entries.filter(
          (entry) => entry.leaveTime && entry.duration !== undefined,
        );
        const lastEntry = completedEntries[completedEntries.length - 1];

        if (lastEntry && lastEntry.duration! >= MIN_STAY_DURATION_SECONDS) {
          dispatch({ type: AgoraActionType.RESET_CHANNEL_HOPPING });
          clearPersistedState();
          return;
        }

        if (!isChannelHopping) {
          dispatch({ type: AgoraActionType.RESET_CHANNEL_HOPPING });
          clearPersistedState();
          return;
        }

        const shouldBlock = evaluateChannelHoppingBehavior();
        if (shouldBlock) {
          dispatch({
            type: AgoraActionType.SET_CHANNEL_HOPPING_BLOCKED,
            payload: { isBlocked: true, blockStartTime: Date.now() },
          });
          dispatch({
            type: AgoraActionType.SET_SHOW_CHANNEL_HOPPING_BLOCKED_MODAL,
            payload: true,
          });
        }
      }, 100);
    },
    [
      dispatch,
      evaluateChannelHoppingBehavior,
      state.channelHopping,
      clearPersistedState,
    ],
  );

  const hopToRandomChannel = useCallback(async () => {
    checkBlockExpiration();

    if (state.channelHopping.isBlocked) {
      dispatch({
        type: AgoraActionType.SET_SHOW_CHANNEL_HOPPING_BLOCKED_MODAL,
        payload: true,
      });

      if (state.isRtcJoined && state.channelName) {
        try {
          await handleLeaveCall();
        } catch (error) {
          console.error(
            '[Channel Hopping] Error al forzar salida por bloqueo:',
            error,
          );
        }
      }

      return;
    }

    dispatch({
      type: AgoraActionType.SET_CHANNEL_HOPPING_LOADING,
      payload: true,
    });

    if (state.localUser?.role !== 'male') {
      console.warn(
        '[Channel Hopping] Solo los males pueden hacer channel hopping',
      );
      return;
    }

    if (!state.isRtcJoined || !state.channelName) {
      console.warn('[Channel Hopping] No está en una llamada activa');
      return;
    }

    const availableChannels = onlineFemalesList.filter(
      (female) =>
        female.status === 'available_call' &&
        female.host_id &&
        female.host_id !== state.channelName &&
        !state.channelHopping.visitedChannelsInSession.has(female.host_id) &&
        female.is_active === 1,
    );

    if (availableChannels.length === 0) {
      dispatch({
        type: AgoraActionType.SET_SHOW_NO_CHANNELS_AVAILABLE_MODAL_FOR_MALE,
        payload: true,
      });

      if (state.isRtcJoined && state.channelName) {
        try {
          await handleLeaveCall();

          dispatch({ type: AgoraActionType.RESET_CHANNEL_HOPPING });
          clearPersistedState();
        } catch (error) {
          console.error(
            '[Channel Hopping] Error al forzar salida por falta de canales:',
            error,
          );
        }
      }

      return;
    }

    const currentChannelName = state.channelName;

    try {
      registerChannelLeave(currentChannelName, true);

      const randomIndex = Math.floor(Math.random() * availableChannels.length);
      const selectedChannel = availableChannels[randomIndex];

      const originalPush = router.push;
      router.push = () => Promise.resolve(true);

      try {
        await handleLeaveCall();
      } finally {
        router.push = originalPush;
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      registerChannelJoin(selectedChannel.host_id!);

      await handleVideoChatMale(selectedChannel.host_id!);
    } catch (error) {
      console.error(
        '[Channel Hopping] Error durante el channel hopping:',
        error,
      );

      try {
        if (currentChannelName) {
          registerChannelLeave(currentChannelName);
        }
      } catch (cleanupError) {
        console.error(
          '[Channel Hopping] Error durante limpieza de emergencia:',
          cleanupError,
        );
      }

      dispatch({
        type: AgoraActionType.SET_SHOW_UNEXPECTED_ERROR_MODAL,
        payload: true,
      });
    } finally {
      dispatch({
        type: AgoraActionType.SET_CHANNEL_HOPPING_LOADING,
        payload: false,
      });
    }
  }, [
    state.channelHopping.isBlocked,
    state.channelHopping.visitedChannelsInSession,
    state.localUser?.role,
    state.isRtcJoined,
    state.channelName,
    onlineFemalesList,
    dispatch,
    checkBlockExpiration,
    registerChannelJoin,
    registerChannelLeave,
    handleVideoChatMale,
    handleLeaveCall,
    router,
  ]);

  const closeChannelHoppingBlockedModal = useCallback(() => {
    dispatch({
      type: AgoraActionType.SET_SHOW_CHANNEL_HOPPING_BLOCKED_MODAL,
      payload: false,
    });
  }, [dispatch]);

  const openChannelHoppingBlockedModal = useCallback(() => {
    dispatch({
      type: AgoraActionType.SET_SHOW_CHANNEL_HOPPING_BLOCKED_MODAL,
      payload: true,
    });
  }, [dispatch]);

  const getBlockTimeRemaining = useCallback(() => {
    if (
      !state.channelHopping.isBlocked ||
      !state.channelHopping.blockStartTime
    ) {
      return 0;
    }

    const elapsed = Date.now() - state.channelHopping.blockStartTime;
    const remaining = Math.max(0, BLOCK_DURATION_MS - elapsed);
    return Math.ceil(remaining / 1000);
  }, [state.channelHopping.isBlocked, state.channelHopping.blockStartTime]);

  useEffect(() => {
    if (
      state.isRtcJoined &&
      state.channelName &&
      state.localUser?.role === 'male'
    ) {
      if (!currentChannelJoinTimeRef.current) {
        registerChannelJoin(state.channelName);
      }
    }
  }, [
    state.isRtcJoined,
    state.channelName,
    state.localUser?.role,
    registerChannelJoin,
  ]);

  useEffect(() => {
    return () => {
      if (currentChannelJoinTimeRef.current && state.channelName) {
        registerChannelLeave(state.channelName);
      }
    };
  }, [state.channelName, registerChannelLeave]);

  return {
    hopToRandomChannel,
    isBlocked: state.channelHopping.isBlocked,
    blockTimeRemaining: getBlockTimeRemaining(),
    visitedChannelsCount: state.channelHopping.visitedChannelsInSession.size,
    recentHops: state.channelHopping.entries.slice(-5),
    closeChannelHoppingBlockedModal,
    showChannelHoppingBlockedModal: state.showChannelHoppingBlockedModal,
    registerChannelJoin,
    registerChannelLeave,
    openChannelHoppingBlockedModal,
  };
};
