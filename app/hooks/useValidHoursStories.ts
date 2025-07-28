import { useState, useEffect } from 'react';

interface UseValidHoursStoriesProps {
  date_history: string;
  historyId?: string | number;
  onDeleteHistory?: (historyId: string | number) => Promise<any>;
}

export const useValidHoursStories = ({
  date_history,
  historyId,
  onDeleteHistory,
}: UseValidHoursStoriesProps) => {
  const [has48HoursPassed, setHas48HoursPassed] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasBeenDeleted, setHasBeenDeleted] = useState(false);

  useEffect(() => {
    setHasBeenDeleted(false);
  }, [historyId]);

  useEffect(() => {
    if (!date_history || hasBeenDeleted) return;

    const checkTime = () => {
      const creationDate = new Date(date_history);
      const now = new Date();
      const fortyEightHoursInMs = 48 * 60 * 60 * 1000;

      const differenceInMs = now.getTime() - creationDate.getTime();

      if (differenceInMs >= fortyEightHoursInMs) {
        setHas48HoursPassed(true);
        setTimeRemaining(0);

        if (historyId && onDeleteHistory && !isDeleting && !hasBeenDeleted) {
          setIsDeleting(true);
          onDeleteHistory(historyId)
            .then(() => {
              setIsDeleting(false);
              setHasBeenDeleted(true);
            })
            .catch((error) => {
              console.error(
                'Error al eliminar la historia automáticamente:',
                error,
              );
              setIsDeleting(false);
            });
        }
      } else {
        setHas48HoursPassed(false);
        const remaining = fortyEightHoursInMs - differenceInMs;
        setTimeRemaining(remaining);

        const timer = setTimeout(async () => {
          setHas48HoursPassed(true);
          setTimeRemaining(0);

          if (historyId && onDeleteHistory && !isDeleting && !hasBeenDeleted) {
            setIsDeleting(true);
            try {
              await onDeleteHistory(historyId);

              setIsDeleting(false);
              setHasBeenDeleted(true);
            } catch (error) {
              console.error(
                'Error al eliminar la historia automáticamente:',
                error,
              );
              setIsDeleting(false);
            }
          }
        }, remaining);

        return () => clearTimeout(timer);
      }
    };

    checkTime();
  }, [date_history, historyId, onDeleteHistory]);

  return {
    has48HoursPassed,
    timeRemaining,
    isDeleting,
  };
};
