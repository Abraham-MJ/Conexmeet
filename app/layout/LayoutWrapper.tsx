'use client';

import React from 'react';
import { useUser } from '../context/useClientContext';
import FallBackSpinner from '../components/loading/fallback-spinner';
import { AgoraProvider } from '../context/useAgoraContext';
import { ChatProvider } from '../context/useChatContext';
import { ContactsProvider } from '../context/useContactsContext';
import RenderChildren from './RenderChildren';
import NotificationContainer from '../components/chat/NotificationContainer';

const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  const { state } = useUser();

  if (state.loading) {
    return <FallBackSpinner />;
  }

  if (typeof window === 'undefined') {
    return <RenderChildren children={children} />;
  }

  return (
    <>
      <AgoraProvider>
        <ChatProvider>
          <ContactsProvider>
            <RenderChildren children={children} />
            <NotificationContainer />
          </ContactsProvider>
        </ChatProvider>
      </AgoraProvider>
    </>
  );
};

export default LayoutWrapper;
