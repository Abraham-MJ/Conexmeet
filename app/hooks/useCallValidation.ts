import { useCallback, useRef } from 'react';
import { AgoraState } from '../types/streams';

interface UseCallValidationProps {
  agoraState: AgoraState;
  isLoading: boolean;
  isChannelHoppingBlocked: boolean;
}

export const useCallValidation = ({
  agoraState,
  isLoading,
  isChannelHoppingBlocked,
}: UseCallValidationProps) => {
  const callInProgressRef = useRef(false);

  const validateCallAttempt = useCallback(
    (hostId: string): { isValid: boolean; reason?: string } => {
      if (isChannelHoppingBlocked) {
        return { isValid: false, reason: 'Channel hopping is blocked' };
      }

      if (isLoading || callInProgressRef.current) {
        return { isValid: false, reason: 'Call already in progress' };
      }

      if (agoraState.isRtcJoined) {
        return { isValid: false, reason: 'Already connected to RTC channel' };
      }

      if (agoraState.isRtmChannelJoined) {
        return { isValid: false, reason: 'Already connected to RTM channel' };
      }

      if (agoraState.remoteUsers.length > 0) {
        return { isValid: false, reason: 'Remote users already connected' };
      }

      if (!hostId || hostId.trim() === '') {
        return { isValid: false, reason: 'Invalid host ID' };
      }

      if (!agoraState.localUser) {
        return { isValid: false, reason: 'Local user not initialized' };
      }

      return { isValid: true };
    },
    [agoraState, isLoading, isChannelHoppingBlocked]
  );

  const setCallInProgress = useCallback((inProgress: boolean) => {
    callInProgressRef.current = inProgress;
  }, []);

  const isCallInProgress = useCallback(() => {
    return callInProgressRef.current;
  }, []);

  return {
    validateCallAttempt,
    setCallInProgress,
    isCallInProgress,
  };
};