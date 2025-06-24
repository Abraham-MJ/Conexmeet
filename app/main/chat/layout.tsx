'use client';

import React, { useEffect, useState } from 'react';
import { useChat } from '@/app/context/useChatContext';
import ConversationList from '@/app/components/shared/chats/ConversationList';
import { useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { SkeletonChatLoading } from '@/app/components/loading/chats-skeleton';
import { MessageSquareOff } from 'lucide-react';
import { useMobile } from '@/app/hooks/useMobile';

export default function ChatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { chat_id } = useParams<{ chat_id: string }>();
  const { state, loadChatList } = useChat();
  const isMobile = useMobile(1024);

  const [viewConversation, setViewConversation] = useState(false);

  useEffect(() => {
    if (isMobile && chat_id?.[0] !== undefined) {
      setViewConversation(false);
    } else {
      setViewConversation(true);
    }
  }, [chat_id]);

  useEffect(() => {
    loadChatList();
  }, []);

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
              <SkeletonChatLoading />
            ) : (
              <>
                {state.conversations.length > 0 ? (
                  <ConversationList conversations={state.conversations} />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center">
                    <div className="flex h-screen flex-col">
                      <div className="flex flex-col items-center justify-center rounded-lg bg-white p-10">
                        <MessageSquareOff className="mb-6 h-16 w-16 text-gray-400" />
                        <span className="mb-2 text-xl font-semibold text-gray-700">
                          Tu lista de chats está vacía
                        </span>
                        <span className="text-center text-sm text-gray-500">
                          Parece que aún no tienes ninguna conversación.
                          ¡Comienza una nueva para verla aquí!
                        </span>
                      </div>
                    </div>
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
