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
    <Link
      key={conversation.chat_id}
      href={`/main/chat/${conversation.chat_id}`}
      className={cn(
        `flex cursor-pointer select-none items-center border-b px-4 py-3`,
        String(conversation?.chat_id) === chat_id?.[0]
          ? 'bg-gray-100'
          : 'hover:bg-gray-100',
      )}
    >
      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
        <AvatarImage
          primarySrc={conversation.user_info.profile_photo_path}
          defaultPlaceholderSrc={`https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png`}
          errorPlaceholderSrc={genericErrorPlaceholder}
          alt={conversation.user_info.name}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="ml-3 flex-grow">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">
            {conversation.user_info.name}
          </div>
          <div className="flex flex-col-reverse items-center gap-1">
            {state.unreadCountByConversationId[conversation.chat_id] > 0 && (
              <div className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff0000] px-1">
                <span className="text-xs font-semibold text-white">
                  {state.unreadCountByConversationId[conversation.chat_id]}
                </span>
              </div>
            )}
            <span className="ml-1 text-xs text-gray-400">
              {conversation.last_activity_at}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default React.memo(ConversationItem);
