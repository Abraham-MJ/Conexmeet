import { useState } from 'react';
import { useContacts } from '@/app/context/useContactsContext';
import { useAgoraContext } from '@/app/context/useAgoraContext';
import useFeatures from './useFeatures';

export interface ToggleContactApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

interface UseToggleContactOutput {
  toggleContact: (
    userId: number | string,
    userName?: string,
    contactsList?: any[],
  ) => Promise<ToggleContactApiResponse | null>;
  isLoading: boolean;
  error: string | null;
}

export const useAddContacts = (): UseToggleContactOutput => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { sendContactAddedNotification, sendContactRemovedNotification } =
    useContacts();
  const { sendContactNotificationThroughLobby } = useAgoraContext();

  const toggleContact = async (
    userId: number | string,
    userName?: string,
  ): Promise<ToggleContactApiResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const addResponse = await fetch('/api/add-contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
      });

      const addResult: ToggleContactApiResponse = await addResponse.json();

      // const isContactAlreadyExists =
      //   addResult.message === 'El usuario ya es tu contacto' ||
      //   (!addResponse.ok && addResponse.status === 409);

      // if (isContactAlreadyExists) {
      //   const deleteResponse = await fetch('/api/delete-contacts', {
      //     method: 'DELETE',
      //     headers: {
      //       'Content-Type': 'application/json',
      //       Accept: 'application/json',
      //     },
      //     body: JSON.stringify({ user_id: 0 }),
      //   });

      //   const deleteResult: ToggleContactApiResponse =
      //     await deleteResponse.json();

      //   if (!deleteResponse.ok || !deleteResult.success) {
      //     const errorMessage =
      //       deleteResult.message || 'Ocurrió un error al eliminar el contacto.';
      //     setError(errorMessage);
      //     setIsLoading(false);
      //     console.error(
      //       '[useAddContacts] Error eliminando contacto:',
      //       errorMessage,
      //     );
      //     return deleteResult;
      //   }

      //   try {
      //     const rtmSuccess = await sendContactNotificationThroughLobby(
      //       userId,
      //       userName || `Usuario ${userId}`,
      //       'removed',
      //     );

      //     if (rtmSuccess) {
      //     } else {
      //       console.warn(
      //         '[useAddContacts] ⚠️ Notificación RTM de eliminación falló, pero API fue exitosa',
      //       );
      //     }
      //   } catch (rtmError) {
      //     console.error(
      //       '[useAddContacts] ❌ Error enviando notificación RTM de eliminación:',
      //       rtmError,
      //     );
      //   }

      //   try {
      //     await sendContactRemovedNotification(
      //       userId,
      //       userName || `Usuario ${userId}`,
      //     );
      //   } catch (localError) {
      //     console.error(
      //       '[useAddContacts] ❌ Error mostrando notificación local:',
      //       localError,
      //     );
      //   }

      //   setIsLoading(false);

      //   return {
      //     success: true,
      //     message: 'Contacto eliminado exitosamente',
      //     data: deleteResult.data,
      //   };
      // }

      if (!addResponse.ok || !addResult.success) {
        const errorMessage =
          addResult.message || 'Ocurrió un error al agregar el contacto.';
        setError(errorMessage);
        setIsLoading(false);
        console.error(
          '[useAddContacts] Error agregando contacto:',
          errorMessage,
        );
        return addResult;
      }

      try {
        const rtmSuccess = await sendContactNotificationThroughLobby(
          userId,
          userName || `Usuario ${userId}`,
          'added',
        );

        if (rtmSuccess) {
        } else {
          console.warn(
            '[useAddContacts] ⚠️ Notificación RTM de agregado falló, pero API fue exitosa',
          );
        }
      } catch (rtmError) {
        console.error(
          '[useAddContacts] ❌ Error enviando notificación RTM de agregado:',
          rtmError,
        );
      }

      try {
        await sendContactAddedNotification(
          userId,
          userName || `Usuario ${userId}`,
        );
      } catch (localError) {
        console.error(
          '[useAddContacts] ❌ Error mostrando notificación local:',
          localError,
        );
      }

      setIsLoading(false);

      return addResult;
    } catch (err: any) {
      console.error(
        '[useAddContacts] ❌ Error en useToggleContact (fetch):',
        err,
      );
      const errorMessage =
        err.message || 'Un error inesperado ocurrió al contactar el servidor.';
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, message: errorMessage };
    }
  };

  return { toggleContact, isLoading, error };
};
