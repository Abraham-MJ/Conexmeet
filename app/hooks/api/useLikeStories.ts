import { useState } from 'react';

interface LikeApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

interface UseLikeStoryOutput {
  toggleLike: (storyId: number | string) => Promise<LikeApiResponse | null>;
  isLoading: boolean;
  error: string | null;
}

export const useLikeStory = (): UseLikeStoryOutput => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const toggleLike = async (
    story_id: number | string,
  ): Promise<LikeApiResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/like-stories', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: JSON.stringify({ story_id: story_id }),
      });

      const result: LikeApiResponse = await response.json();

      if (!response.ok || !result.success) {
        setError(
          result.message || 'Ocurrió un error al dar like a la historia.',
        );
        setIsLoading(false);
        return result;
      }

      setIsLoading(false);
      return result;
    } catch (err: any) {
      console.error('Error en useLikeStory:', err);
      setError(err.message || 'Un error inesperado ocurrió.');
      setIsLoading(false);
      return {
        success: false,
        message: err.message || 'Un error inesperado ocurrió.',
      };
    }
  };

  return { toggleLike, isLoading, error };
};
