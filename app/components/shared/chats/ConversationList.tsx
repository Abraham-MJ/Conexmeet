'use client';

import { ProcessedChatData } from '@/app/types/chat';
import React from 'react';
import ConversationItem from './ConversationItem';

interface ConversationListProps {
  conversations: ProcessedChatData[];
}
const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
}) => {
  return (
    <>
      {conversations.map((conversation) => {
        const GENERIC_IMAGE_ERROR_PLACEHOLDER = `https://via.placeholder.com/150/CCCCCC/FFFFFF?Text=${encodeURIComponent(conversation.user_info.name || 'Usuario')}`;
        return (
          <>
            <ConversationItem
              key={conversation.chat_id}
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
