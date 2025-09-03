import { useState, useEffect, useRef } from 'react';

interface UseChannelHoppingCooldownProps {
  currentChannel: string | null;
}

interface UseChannelHoppingCooldownReturn {
  isHoppingDisabled: boolean;
  remainingTime: number;
}

export const useChannelHoppingCooldown = ({
  currentChannel,
}: UseChannelHoppingCooldownProps): UseChannelHoppingCooldownReturn => {
  const [isDisabled, setIsDisabled] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastChannelRef = useRef<string | null>(null);

  const COOLDOWN_DURATION = 15;

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (currentChannel && currentChannel !== lastChannelRef.current) {
      lastChannelRef.current = currentChannel;

      setIsDisabled(true);
      setRemainingTime(COOLDOWN_DURATION);

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(() => {
        setRemainingTime((prev) => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            setIsDisabled(false);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }
  }, [currentChannel]);

  return {
    isHoppingDisabled: isDisabled,
    remainingTime,
  };
};
