'use client';

import { ProcessedChatData } from '@/app/types/chat';
import React, { useMemo } from 'react';
import ConversationItem from './ConversationItem';
import { useChat } from '@/app/context/useChatContext';

interface ConversationListProps {
  conversations: ProcessedChatData[];
}
const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
}) => {
  const { state } = useChat();
  const { unreadCountByConversationId } = state;

  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      const aUnreadCount = unreadCountByConversationId[a.chat_id] || 0;
      const bUnreadCount = unreadCountByConversationId[b.chat_id] || 0;

      if (aUnreadCount > 0 && bUnreadCount === 0) {
        return -1;
      }
      if (bUnreadCount > 0 && aUnreadCount === 0) {
        return 1;
      }

      const dateA = new Date(a.last_activity_at).getTime();
      const dateB = new Date(b.last_activity_at).getTime();

      return dateB - dateA;
    });
  }, [conversations, unreadCountByConversationId]);

  return (
    <>
      {sortedConversations.map((conversation, index) => {
        const GENERIC_IMAGE_ERROR_PLACEHOLDER = `https://via.placeholder.com/150/CCCCCC/FFFFFF?Text=${encodeURIComponent(conversation.user_info.name || 'Usuario')}`;
        return (
          <>
            <ConversationItem
              key={`key-${conversation?.chat_id}-${index}`}
              conversation={conversation}
              genericErrorPlaceholder={GENERIC_IMAGE_ERROR_PLACEHOLDER}
            />
          </>
        );
      })}
    </>
  );
};

export default ConversationList;
