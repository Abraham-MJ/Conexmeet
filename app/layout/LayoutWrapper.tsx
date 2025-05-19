'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import HeaderMobile from './HeaderMobile';
import { useMobile } from '../hooks/useMobile';
import HeaderDesktop from '@/app/layout/HeaderDesktop';
import { usePathname } from 'next/navigation';
import { useUser } from '../context/useClientContext';
import FallBackSpinner from '../components/loading/fallback-spinner';
import { AgoraProvider } from '../context/useAgoraContext';
import { ChatProvider } from '../context/useChatContext';

const baseRoutes = {
  female: {
    videoChat: '/main/video-roulette',
    chats: '/main/chat',
    ranking: '/main/ranking',
    contacts: '/main/host/contacts',
  },
  male: {
    forYou: '/main/features',
    videoChat: '/main/video-roulette',
    chats: '/main/chat',
  },
};

const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  const { state } = useUser();

  const isMobile = useMobile();
  const pathname = usePathname();
  const hiddenHeader = pathname.includes('/chat');

  if (state.loading) {
    return <FallBackSpinner />;
  }

  return (
    <>
      <AgoraProvider>
        <ChatProvider>
          {isMobile && <HeaderMobile routes={baseRoutes} />}
          <HeaderDesktop routes={baseRoutes} />
          <main
            className={cn(
              'relative mx-auto mt-[80px] h-[calc(100dvh-80px)] w-full max-w-[1536px] flex-grow px-4',
              hiddenHeader && 'mx-0 max-w-full px-0',
            )}
          >
            {children}
          </main>
        </ChatProvider>
      </AgoraProvider>
    </>
  );
};

export default LayoutWrapper;
