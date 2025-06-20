'use client';

import React, { useEffect, useState } from 'react';
import { useChat } from '@/app/context/useChatContext';
import ConversationList from '@/app/components/shared/chats/ConversationList';
import { BsSearchHeart } from 'react-icons/bs';
import { useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  SkeletonChatLoading,
  SkeletonLoadingMessagesList,
} from '@/app/components/loading/chats-skeleton';

export default function ChatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { chat_id } = useParams<{ chat_id: string }>();
  const { state, loadChatList } = useChat();

  const [viewConversation, setViewConversation] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkIfMobile = () => {
        if (window.innerWidth < 1024 && chat_id?.[0] !== undefined) {
          setViewConversation(false);
        } else {
          setViewConversation(true);
        }
      };

      checkIfMobile();

      window.addEventListener('resize', checkIfMobile);

      return () => {
        window.removeEventListener('resize', checkIfMobile);
      };
    }
  }, [chat_id]);

  useEffect(() => {
    loadChatList();
  }, []);

  if (
    chat_id?.[0] !== undefined &&
    state.isLoadingConversations &&
    state.isLoadingMessages
  ) {
    return <SkeletonChatLoading />;
  }

  return (
    <div className="h-full w-full overflow-hidden lg:grid lg:grid-cols-[360px_1fr]">
      <div className="overflow-hidden lg:grid lg:grid-cols-[360px_1fr]">
        <div
          className={cn(
            'h-full w-full border-r bg-white',
            viewConversation ? 'flex flex-col' : 'hidden',
          )}
        >
          <div className="sticky top-0 border-b bg-white p-4">
            <h2 className="text-xl font-semibold">Messages</h2>
          </div>
          <div className="h-[calc(100vh-141px)] w-full overflow-auto">
            {state.isLoadingConversations ? (
              <SkeletonLoadingMessagesList />
            ) : (
              <>
                {state.conversations.length > 0 ? (
                  <ConversationList conversations={state.conversations} />
                ) : (
                  <div className="mx-auto mt-5 flex w-10/12 flex-col items-center justify-center">
                    <div className="mb-2 rounded-full border bg-gray-300 p-3">
                      <BsSearchHeart className="h-10 w-10 text-gray-500" />
                    </div>

                    <span className="text-center text-sm text-gray-500">
                      You still have no recent messages. Go to contacts and
                      start a conversation
                    </span>
                    <span className="mt-2 cursor-pointer select-none text-sm text-[#ff00ff] underline">
                      Contacts
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <div className={cn('h-full w-full')}>{children}</div>
    </div>
  );
}
