import { useUser } from '@/app/context/useClientContext';
import { useState, useCallback } from 'react';

interface uploadFileProps {
  handleVerification: (
    passportFront: File,
    passportBack: File,
    selfie: File,
  ) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

const useKycUpload = (): uploadFileProps => {
  const { state: user, handleGetInformation } = useUser();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  const makeApiCall = useCallback(
    async (
      url: string,
      formdata: FormData,
      uploadType: string,
      retryCount: number = 0,
    ): Promise<any> => {
      const maxRetries = 2;
      const retryDelay = 2000;

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${user.user?.token || ''}`,
          },
          body: formdata,
        });

        const result = await response.json();

        if (!response.ok) {
          if (response.status === 429) {
            throw new Error('Too Many Requests - Please try again later');
          }

          throw new Error(
            result.message ||
              `Error al subir ${uploadType}: ${response.status} ${response.statusText}`,
          );
        }
        return result;
      } catch (err: any) {
        console.error(`Error al subir ${uploadType}:`, err);

        if (
          retryCount < maxRetries &&
          (err.message.includes('fetch') || err.message.includes('network'))
        ) {
          await new Promise((resolve) =>
            setTimeout(resolve, retryDelay * (retryCount + 1)),
          );
          return makeApiCall(url, formdata, uploadType, retryCount + 1);
        }

        throw new Error(
          `Error al subir ${uploadType}: ${err.message || 'Error desconocido'}`,
        );
      }
    },
    [user.user?.token],
  );

  const handleVerification = useCallback(
    async (
      passportFront: File,
      passportBack: File,
      selfie: File,
    ): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const passportFormData = new FormData();
        passportFormData.append(
          'passport_user',
          passportFront,
          passportFront.name,
        );
        passportFormData.append(
          'passport_back',
          passportBack,
          passportBack.name,
        );

        await makeApiCall(
          'https://app.conexmeet.live/api/v1/passport-user',
          passportFormData,
          'frente y reverso del pasaporte',
        );

        const selfieFormData = new FormData();
        selfieFormData.append('passport_photo_user', selfie, selfie.name);

        await makeApiCall(
          'https://app.conexmeet.live/api/v1/passport-photo-user',
          selfieFormData,
          'selfie con pasaporte',
        );

        setIsLoading(false);
        return true;
      } catch (err: any) {
        setError(
          err.message ||
            'Ocurrió un error desconocido durante el envío de KYC.',
        );
        setIsLoading(false);
        return false;
      } finally {
        handleGetInformation();
      }
    },
    [makeApiCall],
  );

  return {
    handleVerification,
    isLoading,
    error,
    reset,
  };
};

export default useKycUpload;
