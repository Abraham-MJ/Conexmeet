'use client';

import { useMobile } from '@/app/hooks/useMobile';
import { ChatUserExternal } from '@/app/types/chat';
import React, { useEffect, useState } from 'react';
import { IoIosArrowBack } from 'react-icons/io';
import AvatarImage from '../../UI/StyledAvatarImage';
import useFeatures from '@/app/hooks/api/useFeatures';
import { useAgoraContext } from '@/app/context/useAgoraContext';
import { UserInformation } from '@/app/types/streams';
import { IoVideocamOffOutline, IoVideocamOutline } from 'react-icons/io5';
import ModalChannelNotFound from '../modals/ModalChannelNotFound';
import { cn } from '@/lib/utils';

interface ChatHeaderProps {
  user: ChatUserExternal;
  onBack: () => void;
  isTyping: boolean;
  isActiveChat: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  user,
  onBack,
  isTyping,
  isActiveChat,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [channel, setChannel] = useState<UserInformation | undefined>(
    undefined,
  );
  const { online } = useFeatures({ activeTabs: 'online' });
  const { handleVideoChatMale } = useAgoraContext();

  const isMobile = useMobile(1024);
  const GENERIC_IMAGE_ERROR_PLACEHOLDER = `https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png`;

  useEffect(() => {
    const checkIfChannel = () => {
      const isChannel = online.data?.find((item) => item.user_id == user.id);
      setChannel(isChannel);
    };
    checkIfChannel();
  }, [online.data]);

  return (
    <div className="sticky top-0 z-10 flex min-h-[61px] items-center justify-between border-b bg-white px-4">
      <div className="flex items-center">
        {isMobile && (
          <button
            className="mr-4 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border py-1 text-gray-500 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-gray-100"
            onClick={onBack}
          >
            <IoIosArrowBack size={22} />
          </button>
        )}
        <div
          className={cn(
            'overflow-hidden rounded-full bg-gray-200',
            isMobile ? 'h-10 w-10' : 'h-12 w-12',
          )}
        >
          <AvatarImage
            primarySrc={user?.profile_photo_path}
            defaultPlaceholderSrc={`https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png`}
            errorPlaceholderSrc={GENERIC_IMAGE_ERROR_PLACEHOLDER}
            alt={user?.name}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="ml-3">
          <span className="font-medium text-gray-800">{user?.name}</span>

          {isTyping && (
            <p className="text-xs font-medium text-green-500">Typing...</p>
          )}

          {!isTyping && (
            <>
              {isActiveChat ? (
                <p className="text-xs font-medium text-green-500">Online</p>
              ) : (
                <p className="text-xs text-gray-500">Offline</p>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex flex-row items-center gap-5">
        {channel?.status === 'available_call' ? (
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white transition-all duration-300 hover:bg-green-400"
            onClick={() => {
              handleVideoChatMale(channel?.host_id ?? undefined);
            }}
          >
            <IoVideocamOutline className="h-6 w-6 text-white" />
          </button>
        ) : channel?.status === 'online' ? (
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-500 text-white transition-all duration-300 hover:bg-gray-400"
            onClick={() => {
              setIsOpen(true);
            }}
          >
            <IoVideocamOutline className="h-6 w-6 text-white" />
          </button>
        ) : channel?.status === 'in_call' ? (
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white transition-all duration-300 hover:bg-red-400"
            onClick={() => {}}
          >
            <IoVideocamOffOutline className="h-6 w-6 text-white" />
          </button>
        ) : null}
      </div>
      <ModalChannelNotFound
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
        }}
        name={user.name || 'Usuario'}
        status={channel?.status === 'in_call' ? 'in_call' : 'online'}
      />
    </div>
  );
};

export default ChatHeader;
