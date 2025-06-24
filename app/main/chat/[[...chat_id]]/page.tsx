'use client';

import type React from 'react';
import { useParams, useRouter } from 'next/navigation';

import { cn } from '@/lib/utils';
import { SendMessageTypes } from '@/app/types/chat';
import { useChat } from '@/app/context/useChatContext';
import ChatHeader from '@/app/components/shared/chats/ChatHeader';
import WhriteMessage from '@/app/components/shared/chats/WhriteMessage';
import ConversationContent from '@/app/components/shared/chats/ConversationContent';
import { TbMessageSearch } from 'react-icons/tb';
import { SkeletonLoadingMessages } from '@/app/components/loading/chats-skeleton';
import { StyledFloatAlert } from '@/app/components/UI/StyledFloatAlert';
import { useAgoraContext } from '@/app/context/useAgoraContext';
import { useMobile } from '@/app/hooks/useMobile';

const ChatScreen = () => {
  const router = useRouter();

  const { chat_id } = useParams<{ chat_id: string }>();
  const isMobile = useMobile(1024);

  const {
    state,
    sendMessageRequest,
    sendTypingStarted,
    sendTypingStopped,
    scrollContainerRef,
  } = useChat();

  const { loadingStatus } = useAgoraContext();

  const remote_user = state.conversations.find(
    (item) => item.chat_id.toString() === chat_id?.[0],
  )?.user_info ?? {
    email: '',
    id: 0,
    name: '',
    profile_photo_path: '',
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
          {state.isLoadingMessages[chat_id] === true ? (
            <SkeletonLoadingMessages />
          ) : (
            <div className={`flex h-screen w-full flex-col lg:flex`}>
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
              />

              <div
                className="h-[80%] overflow-y-auto bg-white p-4"
                ref={scrollContainerRef as React.RefObject<HTMLDivElement>}
              >
                <div className="mx-auto flex max-w-[900px] flex-col space-y-4">
                  <ConversationContent
                    messages={state.messagesByConversationId[chat_id] || []}
                  />
                </div>
              </div>

              <div className={cn('z-10 bg-white', isMobile ? '' : 'px-4')}>
                <div
                  className={cn(
                    'mx-auto max-w-[900px]',
                    isMobile ? 'h-[140px]' : 'h-[200px]',
                  )}
                >
                  <div
                    className={cn(
                      'flex flex-col bg-white shadow-[0_0px_16px_#0000000d,0_7px_40px_#00000008]',
                      isMobile ? 'rounded-full' : 'rounded-full',
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
              </div>
            </div>
          )}
        </>
      ) : (
        <div
          className={`h-full w-full flex-col overflow-hidden ${isMobile ? 'hidden' : ''}`}
        >
          <div className="flex h-[calc(100%-80px)] w-full flex-col items-center justify-center">
            <TbMessageSearch className="h-16 w-16 text-gray-500" />
            <span className="mt-2 text-gray-500">
              Please select a chat to start messaging
            </span>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatScreen;
