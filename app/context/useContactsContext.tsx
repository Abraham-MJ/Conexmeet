'use client';

import {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useCallback,
  useEffect,
} from 'react';
import { useChat } from './useChatContext';
import { useAgoraContext } from './useAgoraContext';
import { useContactNotifications } from '../hooks/contacts/useContactNotifications';
import {
  ContactsState,
  ContactsContextType,
  ContactsAction,
} from '../types/contacts';

const initialState: ContactsState = {
  isProcessing: false,
  lastNotification: null,
};

function contactsReducer(
  state: ContactsState,
  action: ContactsAction,
): ContactsState {
  switch (action.type) {
    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload };
    case 'SET_LAST_NOTIFICATION':
      return { ...state, lastNotification: action.payload };
    default:
      return state;
  }
}

const ContactsContext = createContext<ContactsContextType | undefined>(
  undefined,
);

export function ContactsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(contactsReducer, initialState);

  const { state: agoraState } = useAgoraContext();

  let chatDispatch: any = null;
  try {
    const chatContext = useChat();
    chatDispatch = chatContext?.dispatch || null;
  } catch (error) {
    console.warn('[ContactsContext] ⚠️ Chat context no disponible:', error);
  }

  const {
    showContactAddedNotification,
    showContactRemovedNotification,
    showReceivedContactNotification,
  } = useContactNotifications(chatDispatch, agoraState.localUser);

  const sendContactAddedNotification = useCallback(
    async (
      targetUserId: string | number,
      targetUserName: string,
    ): Promise<boolean> => {
      try {
        showContactAddedNotification(targetUserId, targetUserName);

        return true;
      } catch (error) {
        console.error(
          '[ContactsContext] ❌ Error en sendContactAddedNotification:',
          error,
        );
        return false;
      }
    },
    [showContactAddedNotification],
  );

  const sendContactRemovedNotification = useCallback(
    async (
      targetUserId: string | number,
      targetUserName: string,
    ): Promise<boolean> => {
      try {
        showContactRemovedNotification(targetUserId, targetUserName);

        return true;
      } catch (error) {
        console.error(
          '[ContactsContext] ❌ Error en sendContactRemovedNotification:',
          error,
        );
        return false;
      }
    },
    [showContactRemovedNotification],
  );

  useEffect(() => {
    const handleContactNotificationReceived = (event: CustomEvent) => {
      const notification = event.detail;

      showReceivedContactNotification(notification);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(
        'contactNotificationReceived',
        handleContactNotificationReceived as EventListener,
      );

      return () => {
        window.removeEventListener(
          'contactNotificationReceived',
          handleContactNotificationReceived as EventListener,
        );
      };
    }
  }, [showReceivedContactNotification]);

  const contextValue: ContactsContextType = {
    state,
    sendContactAddedNotification,
    sendContactRemovedNotification,
  };

  return (
    <ContactsContext.Provider value={contextValue}>
      {children}
    </ContactsContext.Provider>
  );
}

export const useContacts = (): ContactsContextType => {
  const context = useContext(ContactsContext);
  if (context === undefined) {
    throw new Error(
      'useContacts debe ser utilizado dentro de un ContactsProvider',
    );
  }
  return context;
};
