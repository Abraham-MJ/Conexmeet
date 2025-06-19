import { useState, useEffect, useRef, useCallback } from 'react';

export const useCallTimer = (
  isCallActive: boolean,
  localUserRole: 'male' | 'female' | 'admin' | null,
) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const formatTime = useCallback((totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    if (
      isCallActive &&
      localUserRole !== 'admin' &&
      intervalRef.current === null
    ) {
      if (startTimeRef.current === null) {
        startTimeRef.current = Date.now();
        setElapsedTime(0);
      }

      intervalRef.current = setInterval(() => {
        setElapsedTime((prevTime) => prevTime + 1);
      }, 1000);
    } else if (
      (!isCallActive || localUserRole === 'admin') &&
      intervalRef.current !== null
    ) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      startTimeRef.current = null;
      setElapsedTime(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        startTimeRef.current = null;
      }
    };
  }, [isCallActive, localUserRole]);

  return formatTime(elapsedTime);
};
