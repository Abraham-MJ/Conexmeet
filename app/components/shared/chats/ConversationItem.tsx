'use client';

import React from 'react';
import Link from 'next/link';
import { ProcessedChatData } from '@/app/types/chat';
import AvatarImage from '../../UI/StyledAvatarImage';
import { useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useChat } from '@/app/context/useChatContext';

interface ConversationItemProps {
  conversation: ProcessedChatData;
  genericErrorPlaceholder: string;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  genericErrorPlaceholder,
}) => {
  const { chat_id } = useParams<{ chat_id: string }>();
  const { state } = useChat();

  return (
    <div className="px-2">
      <Link
        key={conversation.chat_id}
        href={`/main/chat/${conversation.chat_id}`}
        className={cn(
          'flex cursor-pointer items-center rounded-lg p-3 transition-colors',
          String(conversation?.chat_id) === chat_id?.[0]
            ? 'bg-gray-200'
            : 'hover:bg-gray-100',
        )}
      >
        <div className="relative h-12 w-12 flex-shrink-0">
          <AvatarImage
            primarySrc={conversation.user_info.profile_photo_path}
            defaultPlaceholderSrc={`https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png`}
            errorPlaceholderSrc={genericErrorPlaceholder}
            alt={conversation.user_info.name}
            className="h-full w-full rounded-full object-cover"
          />
        </div>

        <div className="ml-4 flex-1 overflow-hidden">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {conversation.user_info.name}
          </p>
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
            Jajaja, qué gracioso.
          </p>
        </div>
        <div className="ml-2 flex flex-col items-end space-y-1.5 text-xs">
          <span className="whitespace-nowrap text-gray-400 dark:text-gray-500">
            {conversation.last_activity_at}
          </span>
          {state.unreadCountByConversationId[conversation.chat_id] > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#fc3d6b] text-xs text-white">
              {state.unreadCountByConversationId[conversation.chat_id]}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
};

export default React.memo(ConversationItem);
