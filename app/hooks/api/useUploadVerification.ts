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
    ): Promise<any> => {
      const myHeaders = new Headers();
      myHeaders.append('Accept', 'application/json');
      myHeaders.append('Authorization', `Bearer ${user.user?.token || ''}`);

      const requestOptions: RequestInit = {
        method: 'POST',
        headers: myHeaders,
        body: formdata,
        redirect: 'follow' as RequestRedirect,
      };

      try {
        const response = await fetch(url, requestOptions);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              `Error al subir ${uploadType}: ${response.status} ${response.statusText}`,
          );
        }
        return result;
      } catch (err: any) {
        console.error(`Error al subir ${uploadType}:`, err);
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
