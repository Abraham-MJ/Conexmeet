const STORAGE_KEY = 'channelHopping_state';
const BLOCK_DURATION_MS = 5 * 60 * 1000;

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

export const isUserBlockedFromChannelHopping = (): boolean => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;

    const parsed: PersistedChannelHoppingState = JSON.parse(stored);

    if (!parsed.isBlocked || !parsed.blockStartTime) return false;

    const now = Date.now();
    const blockElapsed = now - parsed.blockStartTime;

    if (blockElapsed >= BLOCK_DURATION_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return false;
    }

    return true;
  } catch (error) {
    console.error(
      '[Channel Hopping Validation] Error checking block status:',
      error,
    );
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (cleanupError) {
      console.error(
        '[Channel Hopping Validation] Error cleaning up:',
        cleanupError,
      );
    }
    return false;
  }
};

export const getBlockTimeRemaining = (): number => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return 0;

    const parsed: PersistedChannelHoppingState = JSON.parse(stored);

    if (!parsed.isBlocked || !parsed.blockStartTime) return 0;

    const now = Date.now();
    const blockElapsed = now - parsed.blockStartTime;
    const remaining = Math.max(0, BLOCK_DURATION_MS - blockElapsed);

    return Math.ceil(remaining / 1000);
  } catch (error) {
    console.error(
      '[Channel Hopping Validation] Error getting block time:',
      error,
    );
    return 0;
  }
};

export const clearChannelHoppingState = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('[Channel Hopping Validation] Error clearing state:', error);
  }
};
