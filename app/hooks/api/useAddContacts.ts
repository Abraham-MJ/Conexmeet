import { useState } from 'react';
import { useContacts } from '@/app/context/useContactsContext';
import { useAgoraContext } from '@/app/context/useAgoraContext';
import useApi from '../useAPi';

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

  const { execute: handleAddContact } = useApi<any>(
    '/api/add-contacts',
    {
      method: 'POST',
      retryAttempts: 2,
      retryDelay: 1500,
    },
    false,
  );

  const { execute: handleDeleteContact } = useApi<any>(
    '/api/delete-contacts',
    {
      method: 'DELETE',
      retryAttempts: 2,
      retryDelay: 1500,
    },
    false,
  );

  const toggleContact = async (
    userId: number | string,
    userName?: string,
  ): Promise<ToggleContactApiResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await handleAddContact('/api/add-contacts', {
        method: 'POST',
        body: { user_id: userId },
      });

      let addResult: ToggleContactApiResponse;

      if (result?.success && result.data) {
        addResult = {
          success: true,
          message: 'Contact added successfully',
          data: result.data,
        };
      } else if (result?.error) {
        addResult = { success: false, message: result.error.message };
      } else {
        addResult = { success: false, message: 'Error adding contact' };
      }

      const isContactAlreadyExists =
        addResult.message === 'El usuario ya es tu contacto' ||
        addResult.message?.includes('already') ||
        (!addResult.success && addResult.message?.includes('contacto'));

      if (isContactAlreadyExists) {
        const deleteResult = await handleDeleteContact('/api/delete-contacts', {
          method: 'DELETE',
          body: { user_id: userId },
        });

        let deleteResponse: ToggleContactApiResponse;

        if (deleteResult?.success && deleteResult.data) {
          deleteResponse = {
            success: true,
            message: 'Contact removed successfully',
            data: deleteResult.data,
          };
        } else if (deleteResult?.error) {
          deleteResponse = {
            success: false,
            message: deleteResult.error.message,
          };
        } else {
          deleteResponse = {
            success: false,
            message: 'Error removing contact',
          };
        }

        if (!deleteResponse.success) {
          const errorMessage =
            deleteResponse.message ||
            'Ocurrió un error al eliminar el contacto.';
          setError(errorMessage);
          setIsLoading(false);
          console.error(
            '[useAddContacts] Error eliminando contacto:',
            errorMessage,
          );
          return deleteResponse;
        }

        try {
          const rtmSuccess = await sendContactNotificationThroughLobby(
            userId,
            userName || `Usuario ${userId}`,
            'removed',
          );

          if (!rtmSuccess) {
            console.warn(
              '[useAddContacts] ⚠️ Notificación RTM de eliminación falló, pero API fue exitosa',
            );
          }
        } catch (rtmError) {
          console.error(
            '[useAddContacts] ❌ Error enviando notificación RTM de eliminación:',
            rtmError,
          );
        }

        try {
          await sendContactRemovedNotification(
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
        return {
          success: true,
          message: 'Contacto eliminado exitosamente',
          data: deleteResponse.data,
        };
      }

      if (!addResult.success) {
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
