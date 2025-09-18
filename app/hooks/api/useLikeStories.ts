import { useState } from 'react';
import useApi from '../useAPi';

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

  const { execute: likeStoryRequest } = useApi<LikeApiResponse>('/api/like-stories', {
    method: 'POST',
    retryAttempts: 2,
    retryDelay: 1000,
  }, false);

  const toggleLike = async (
    story_id: number | string,
  ): Promise<LikeApiResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await likeStoryRequest('/api/like-stories', {
        method: 'POST',
        body: { story_id },
      });

      if (result?.success && result.data) {
        setIsLoading(false);
        return result.data;
      } else if (result?.error) {
        const errorMessage = result.error.message || 'Ocurrió un error al dar like a la historia.';
        setError(errorMessage);
        setIsLoading(false);
        return {
          success: false,
          message: errorMessage,
        };
      }
      
      const defaultError = 'Ocurrió un error al dar like a la historia.';
      setError(defaultError);
      setIsLoading(false);
      return {
        success: false,
        message: defaultError,
      };
    } catch (err: any) {
      console.error('Error en useLikeStory:', err);
      const errorMessage = err.message || 'Un error inesperado ocurrió.';
      setError(errorMessage);
      setIsLoading(false);
      return {
        success: false,
        message: errorMessage,
      };
    }
  };

  return { toggleLike, isLoading, error };
};
