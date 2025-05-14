'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import HeaderMobile from './HeaderMobile';
import { useMobile } from '../hooks/useMobile';
import HeaderDesktop from '@/app/layout/HeaderDesktop';

const baseRoutes = {
  female: {
    videoChat: '/main/video-roulette',
    chats: '/main/chats',
    ranking: '/main/ranking',
    contacts: '/main/host/contacts',
  },
  male: {
    forYou: '/main/features',
    videoChat: '/main/video-roulette',
    chats: '/main/chats',
  },
};

const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  const isMobile = useMobile();

  return (
    <>
      {isMobile && <HeaderMobile routes={baseRoutes} />}
      <HeaderDesktop routes={baseRoutes} />
      <main
        className={cn(
          'container relative mx-auto mt-[80px] h-[calc(100dvh-80px)] max-w-[1536px] flex-grow px-4',
        )}
      >
        {children}
      </main>
    </>
  );
};

export default LayoutWrapper;
