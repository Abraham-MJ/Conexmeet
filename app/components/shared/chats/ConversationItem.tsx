'use client';

import React from 'react';
import Link from 'next/link';
import { ProcessedChatData } from '@/app/types/chat';
import AvatarImage from '../../UI/StyledAvatarImage';

interface ConversationItemProps {
  conversation: ProcessedChatData;
  genericErrorPlaceholder: string;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  genericErrorPlaceholder,
}) => {
  return (
    <Link
      key={conversation.chat_id}
      href={`/main/chat/${conversation.chat_id}`}
      className={`flex cursor-pointer select-none items-center border-b px-4 py-3 hover:bg-gray-50`}
    >
      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
        <AvatarImage
          primarySrc={conversation.user_info.profile_photo_path}
          defaultPlaceholderSrc={`https://avatar.iran.liara.run/username?username=${encodeURIComponent(conversation.user_info.name || 'Usuario')}`}
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
            {/* {conversation.unread_messages_count > 0 && (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#fc3d6b] p-1">
                <span className="text-xs font-medium text-white">
                  {conversation.unread_messages_count}
                </span>
              </div>
            )} */}
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
