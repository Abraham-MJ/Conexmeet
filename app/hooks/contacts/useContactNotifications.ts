import { useCallback } from 'react';
import { ContactNotification } from '@/app/types/contacts';

export const useContactNotifications = (chatDispatch: any, localUser: any) => {
  const showContactNotification = useCallback(
    (params: {
      senderName: string;
      senderAvatar: string | null;
      type: 'contact_added' | 'contact_removed';
      contactAction: 'added' | 'removed';
      userId: string | number;
      targetUserName: string;
    }) => {
      if (chatDispatch) {
        const notificationPayload = {
          conversationId: `contact_${params.userId}`,
          senderName: params.senderName,
          senderAvatar: params.senderAvatar,
          type: params.type,
          contactAction: params.contactAction,
          userId: params.userId,
        };

        try {
          chatDispatch({
            type: 'ADD_NOTIFICATION',
            payload: notificationPayload,
          });
        } catch (error) {
          console.error(
            '[ContactNotifications] ❌ Error al despachar notificación:',
            error,
          );
        }
      } else {
        console.warn(
          '[ContactNotifications] ⚠️ Chat context no disponible para mostrar notificación',
        );

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(
            `Contacto ${params.contactAction === 'added' ? 'agregado' : 'eliminado'}`,
            {
              body: `${params.senderName} te ${params.contactAction === 'added' ? 'agregó como contacto' : 'eliminó de sus contactos'}`,
              icon: params.senderAvatar || undefined,
            },
          );
        }
      }
    },
    [chatDispatch],
  );

  const showContactAddedNotification = useCallback(
    (targetUserId: string | number, targetUserName: string) => {
      showContactNotification({
        senderName: 'Tú',
        senderAvatar: localUser?.avatar || null,
        type: 'contact_added',
        contactAction: 'added',
        userId: targetUserId,
        targetUserName,
      });
    },
    [showContactNotification, localUser],
  );

  const showContactRemovedNotification = useCallback(
    (targetUserId: string | number, targetUserName: string) => {
      showContactNotification({
        senderName: 'Tú',
        senderAvatar: localUser?.avatar || null,
        type: 'contact_removed',
        contactAction: 'removed',
        userId: targetUserId,
        targetUserName,
      });
    },
    [showContactNotification, localUser],
  );

  const showReceivedContactNotification = useCallback(
    (notification: ContactNotification) => {
      showContactNotification({
        senderName: notification.fromUserName,
        senderAvatar: notification.fromUserAvatar || null,
        type:
          notification.action === 'added' ? 'contact_added' : 'contact_removed',
        contactAction: notification.action,
        userId: notification.fromUserId,
        targetUserName: notification.fromUserName,
      });
    },
    [showContactNotification],
  );

  return {
    showContactAddedNotification,
    showContactRemovedNotification,
    showReceivedContactNotification,
  };
};
