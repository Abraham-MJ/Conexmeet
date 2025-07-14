import React, { useEffect, useRef } from 'react';
import { useMobile } from '../hooks/useMobile';
import { usePathname } from 'next/navigation';
import HeaderMobile from './HeaderMobile';
import HeaderDesktop from './HeaderDesktop';
import { cn } from '@/lib/utils';
import { useAgoraContext } from '../context/useAgoraContext';
import ModalPermission from '../components/shared/modals/ModalPermission';
import ModalRejectPermission from '../components/shared/modals/ModalRejectPermission';
import ModalNotChannel from '../components/shared/modals/ModalNotChannel';
import ModalChannelBusy from '../components/shared/modals/ModalChannelBusy';
import ModalInsufficientMinutes from '../components/shared/modals/ModalInsufficientMinutes';
import ModalCallEndedFemaleSummary from '../components/shared/modals/ModalCallEndedFemaleSummary';
import ModalMinutesExhausted from '../components/shared/modals/ModalMinutesExhausted';

const baseRoutes = {
  female: {
    videoChat: '/main/video-roulette',
    chats: '/main/chat',
    ranking: '/main/ranking',
    contacts: '/main/contacts',
  },
  male: {
    forYou: '/main/features',
    videoChat: '/main/video-roulette',
    chats: '/main/chat',
  },
};

const RenderChildren = ({ children }: { children: React.ReactNode }) => {
  const {
    state: agoraState,
    fetchInitialOnlineFemalesList,
    joinLobbyForRealtimeUpdates,
  } = useAgoraContext();

  const isMobile = useMobile();
  const pathname = usePathname();
  const hiddenHeader =
    pathname.includes('/chat') || pathname.includes('/stream');
  const hiddenStream = pathname.includes('/stream');

  const initialFetchAttemptedRef = useRef(false);
  const lobbyJoinAttemptedRef = useRef(false);

  useEffect(() => {
    let didUnmount = false;

    if (
      agoraState.localUser &&
      !agoraState.isLoadingOnlineFemales &&
      (!agoraState.onlineFemalesList ||
        agoraState.onlineFemalesList.length === 0) &&
      !initialFetchAttemptedRef.current
    ) {
      fetchInitialOnlineFemalesList();
      initialFetchAttemptedRef.current = true;
    }

    if (
      agoraState.localUser &&
      !agoraState.isLobbyJoined &&
      !agoraState.isLoadingRtm &&
      !lobbyJoinAttemptedRef.current
    ) {
      joinLobbyForRealtimeUpdates();
      lobbyJoinAttemptedRef.current = true;
    }

    return () => {
      didUnmount = true;
    };
  }, [
    fetchInitialOnlineFemalesList,
    joinLobbyForRealtimeUpdates,
    agoraState.localUser,
    agoraState.isLoadingOnlineFemales,
    agoraState.onlineFemalesList,
    agoraState.isLobbyJoined,
    agoraState.isLoadingRtm,
  ]);

  useEffect(() => {
    if (
      agoraState.onlineFemalesList &&
      agoraState.onlineFemalesList.length > 0
    ) {
      initialFetchAttemptedRef.current = true;
    }
  }, [agoraState.onlineFemalesList]);

  useEffect(() => {
    if (agoraState.isLobbyJoined) {
      lobbyJoinAttemptedRef.current = true;
    }
  }, [agoraState.isLobbyJoined]);
  return (
    <>
      {!hiddenStream && isMobile && <HeaderMobile routes={baseRoutes} />}
      {!hiddenStream && <HeaderDesktop routes={baseRoutes} />}
      <main
        className={cn(
          'relative mx-auto w-full max-w-[1536px] flex-grow px-4',
          hiddenHeader && 'mx-0 max-w-full px-0',
          !hiddenStream && 'mt-[80px] h-[calc(100dvh-80px)]',
        )}
      >
        {children}
      </main>
      <ModalCallEndedFemaleSummary />
      <ModalPermission />
      <ModalRejectPermission />
      <ModalNotChannel />
      <ModalChannelBusy />
      <ModalInsufficientMinutes />
      <ModalMinutesExhausted />
    </>
  );
};

export default RenderChildren;
