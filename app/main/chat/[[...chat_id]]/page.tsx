'use client';

import type React from 'react';
import { useParams, useRouter } from 'next/navigation';

import { cn } from '@/lib/utils';
import { SendMessageTypes } from '@/app/types/chat';
import { useChat } from '@/app/context/useChatContext';
import ChatHeader from '@/app/components/shared/chats/ChatHeader';
import WhriteMessage from '@/app/components/shared/chats/WhriteMessage';
import ConversationContent from '@/app/components/shared/chats/ConversationContent';
import { SkeletonLoadingMessages } from '@/app/components/loading/chats-skeleton';
import { StyledFloatAlert } from '@/app/components/UI/StyledFloatAlert';
import { useAgoraContext } from '@/app/context/useAgoraContext';
import { useMobile } from '@/app/hooks/useMobile';
import { useEffect, useRef, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import { useUser } from '@/app/context/useClientContext';

export const dynamic = 'force-dynamic';

const ChatScreen = () => {
  const router = useRouter();
  const { state: user } = useUser();

  const { chat_id } = useParams<{ chat_id: string }>();
  const isMobile = useMobile(1024);

  const {
    state,
    sendMessageRequest,
    sendTypingStarted,
    sendTypingStopped,
    scrollContainerRef,
  } = useChat();

  const [showScrollToBottomButton, setShowScrollToBottomButton] =
    useState(false);

  const { loadingStatus } = useAgoraContext();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const remote_user = state.conversations.find(
    (item) => item.chat_id.toString() === chat_id?.[0],
  )?.user_info ?? {
    email: '',
    id: 0,
    name: '',
    profile_photo_path: '',
  };

  useEffect(() => {
    if (state.messagesByConversationId[chat_id]) {
      setTimeout(
        () => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }),
        100,
      );
    }
  }, [state.messagesByConversationId[chat_id]]);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 1;
      setShowScrollToBottomButton(!isAtBottom);
    }
  };

  const scrollToBottom = (smooth = false) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
    });
  };

  return (
    <>
      <StyledFloatAlert
        message={loadingStatus.message}
        isOpen={loadingStatus.isLoading}
        animationDirection="top"
        variant="loading"
      />
      {chat_id?.[0] !== undefined ? (
        <>
          <div className="flex h-full w-full flex-col overflow-hidden bg-white dark:bg-gray-900">
            <ChatHeader
              user={remote_user}
              onBack={() => {
                router.push('/main/chat');
              }}
              isTyping={
                state.typingStatusByConversationId[remote_user?.id.toString()]
              }
              isActiveChat={
                state.peerOnlineInChatStatus[remote_user?.id.toString()]
              }
              role={user.user.gender}
            />
            <div
              ref={scrollContainerRef as React.RefObject<HTMLDivElement>}
              className="flex-1 overflow-y-auto"
              onScroll={handleScroll}
            >
              <div className="p-4 lg:mx-auto lg:max-w-[900px]">
                <div className="space-y-4">
                  {state.isLoadingMessages[chat_id] ? (
                    <SkeletonLoadingMessages />
                  ) : state?.messagesByConversationId?.[chat_id]?.length > 0 ? (
                    <ConversationContent
                      messages={state.messagesByConversationId[chat_id] || []}
                    />
                  ) : (
                    <></>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div
              className={cn(
                'mx-auto rounded-2xl bg-white p-2 shadow-[0_0px_16px_#0000000d,0_7px_40px_#00000008]',
                isMobile ? 'w-full' : 'w-[900px]',
              )}
            >
              <WhriteMessage
                onSendMessage={(items: SendMessageTypes) => {
                  sendMessageRequest({
                    ...items,
                    room_id: chat_id,
                  });
                }}
                remote_id={remote_user?.id.toString() ?? ''}
                sendTypingStopped={sendTypingStopped}
                sendTypingStarted={sendTypingStarted}
                isMobile={isMobile}
              />
            </div>
          </div>

          {showScrollToBottomButton && (
            <button
              onClick={() => scrollToBottom(true)}
              aria-label="Ir al final"
              className="absolute bottom-20 right-6 z-10 transform animate-fade-in rounded-full bg-[#fc3d6b] p-2 text-white shadow-lg transition-all duration-300 ease-in-out hover:scale-110 hover:bg-[#fc3d6b]/90"
            >
              <ArrowDown className="h-6 w-6" />
            </button>
          )}
        </>
      ) : (
        <div
          className={`h-full w-full flex-col overflow-hidden ${isMobile ? 'hidden' : ''}`}
        >
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-xl font-medium">Bienvenido,</p>
            <p className="mt-2 text-gray-500">
              Selecciona una conversación de la lista para empezar a chatear.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatScreen;
