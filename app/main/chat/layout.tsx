'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useChat } from '@/app/context/useChatContext';
import ConversationList from '@/app/components/shared/chats/ConversationList';
import { useParams, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { SkeletonChatLoading } from '@/app/components/loading/chats-skeleton';
import { Search } from 'lucide-react';
import { useMobile } from '@/app/hooks/useMobile';
import { ProcessedChatData } from '@/app/types/chat';
import { useTranslation } from '@/app/hooks/useTranslation';

const hiddenRoutes: RegExp[] = [/^\/main\/chat\/[^/]+$/];

const filterConversationsByName = (
  conversations: ProcessedChatData[],
  searchTerm: string,
): ProcessedChatData[] => {
  const lowerCaseSearchTerm = searchTerm.toLowerCase().trim();

  if (!lowerCaseSearchTerm) {
    return conversations;
  }

  return conversations.filter((conversation) => {
    const userName = conversation.user_info.name;
    return userName.toLowerCase().includes(lowerCaseSearchTerm);
  });
};

export default function ChatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const { chat_id } = useParams<{ chat_id: string }>();
  const { state, loadChatList } = useChat();
  const [searchQuery, setSearchQuery] = useState<string>('');

  const isMobile = useMobile(1024);

  const [viewConversation, setViewConversation] = useState(false);
  const pathname = usePathname();

  const shouldHideHeader = hiddenRoutes.some((pattern) =>
    pattern.test(pathname),
  );

  useEffect(() => {
    if (chat_id?.[0] !== undefined && isMobile) {
      setViewConversation(true);
    } else {
      setViewConversation(false);
    }
  }, [chat_id]);

  useEffect(() => {
    loadChatList();
  }, []);

  const filteredConversations = useMemo(() => {
    return filterConversationsByName(state.conversations, searchQuery);
  }, [state.conversations, searchQuery]);

  return (
    <div
      className={cn(
        'flex h-full',
        !isMobile && 'pt-[80px]',
        isMobile && !shouldHideHeader ? 'py-[80px]' : 'pt-[80px]',
      )}
    >
      <aside
        className={cn(
          'h-full w-full flex-col lg:flex lg:w-full lg:max-w-md lg:border-r lg:border-gray-200',
          viewConversation ? 'hidden' : 'flex',
        )}
      >
        <div className="flex h-full w-full flex-col bg-white">
          <div className="flex-shrink-0 border-b border-gray-200 p-4">
            <div className="flex items-center">
              <h2 className="text-2xl font-semibold text-gray-900">{t('nav.messages')}</h2>
            </div>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t('ui.searchInChats')}
                className="focus:ring-brand h-10 w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              {state.isLoadingConversations ? (
                <SkeletonChatLoading />
              ) : (
                <ConversationList conversations={filteredConversations} />
              )}
            </div>
          </div>
        </div>
      </aside>

      <section
        className={cn(
          'h-full w-full flex-1 flex-col lg:flex',
          !viewConversation ? 'hidden' : 'flex',
        )}
      >
        <div className={cn('h-full w-full')}>{children}</div>
      </section>
    </div>
  );
}
