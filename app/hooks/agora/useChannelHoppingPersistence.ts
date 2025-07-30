import { useEffect, useCallback } from 'react';
import { AgoraAction, AgoraActionType, ChannelHoppingState } from '@/app/types/streams';

const STORAGE_KEY = 'channelHopping_state';

interface PersistedChannelHoppingState {
  entries: Array<{
    hostId: string;
    joinTime: number;
    leaveTime?: number;
    duration?: number;
  }>;
  isBlocked: boolean;
  blockStartTime: number | null;
  visitedChannelsInSession: string[];
}

export const useChannelHoppingPersistence = (
  channelHoppingState: ChannelHoppingState,
  dispatch: React.Dispatch<AgoraAction>
) => {
  const loadPersistedState = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;

      const parsed: PersistedChannelHoppingState = JSON.parse(stored);
      
      if (parsed.isBlocked && parsed.blockStartTime) {
        const now = Date.now();
        const blockElapsed = now - parsed.blockStartTime;
        const BLOCK_DURATION_MS = 5 * 60 * 1000; 

        if (blockElapsed >= BLOCK_DURATION_MS) {
          localStorage.removeItem(STORAGE_KEY);
          return;
        }
      }

      dispatch({
        type: AgoraActionType.SET_CHANNEL_HOPPING_BLOCKED,
        payload: {
          isBlocked: parsed.isBlocked,
          blockStartTime: parsed.blockStartTime,
        },
      });

      parsed.entries.forEach((entry) => {
        dispatch({
          type: AgoraActionType.CHANNEL_HOP_JOIN,
          payload: { hostId: entry.hostId, joinTime: entry.joinTime },
        });

        if (entry.leaveTime) {
          dispatch({
            type: AgoraActionType.CHANNEL_HOP_LEAVE,
            payload: { hostId: entry.hostId, leaveTime: entry.leaveTime },
          });
        }
      });

      parsed.visitedChannelsInSession.forEach((hostId) => {
      });

    } catch (error) {
      console.error('[Channel Hopping Persistence] Error loading state:', error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [dispatch]);

  const persistState = useCallback(() => {
    try {
      const stateToPersist: PersistedChannelHoppingState = {
        entries: channelHoppingState.entries,
        isBlocked: channelHoppingState.isBlocked,
        blockStartTime: channelHoppingState.blockStartTime,
        visitedChannelsInSession: Array.from(channelHoppingState.visitedChannelsInSession),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToPersist));
    } catch (error) {
      console.error('[Channel Hopping Persistence] Error saving state:', error);
    }
  }, [channelHoppingState]);

  const clearPersistedState = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('[Channel Hopping Persistence] Error clearing state:', error);
    }
  }, []);

  useEffect(() => {
    loadPersistedState();
  }, [loadPersistedState]);

  useEffect(() => {
    persistState();
  }, [persistState]);

  return {
    clearPersistedState,
  };
};