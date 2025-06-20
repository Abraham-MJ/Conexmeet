'use client';

import { useMobile } from '@/app/hooks/useMobile';
import { ChatUserExternal } from '@/app/types/chat';
import React, { useEffect, useState } from 'react';
import { IoIosArrowBack } from 'react-icons/io';
import AvatarImage from '../../UI/StyledAvatarImage';
import StyledDropDown from '../../UI/StyledDropDown';
import useFeatures from '@/app/hooks/api/useFeatures';
import { useAgoraContext } from '@/app/context/useAgoraContext';
import { UserInformation } from '@/app/types/streams';
import { IoVideocamOffOutline, IoVideocamOutline } from 'react-icons/io5';
import ModalChannelNotFound from '../modals/ModalChannelNotFound';

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

  const isMobile = useMobile();
  const GENERIC_IMAGE_ERROR_PLACEHOLDER = `https://via.placeholder.com/150/CCCCCC/FFFFFF?Text=${encodeURIComponent(user.name || 'Usuario')}`;

  useEffect(() => {
    const checkIfChannel = () => {
      const isChannel = online.data?.find((item) => item.user_id == user.id);
      setChannel(isChannel);
    };
    checkIfChannel();
  }, [online.data]);

  return (
    <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-3">
      <div className="flex items-center">
        {isMobile && (
          <button
            onClick={onBack}
            className="mr-2 rounded-full p-2 text-gray-500 transition-all duration-300 hover:bg-gray-100"
            aria-label="Back to conversations"
          >
            <IoIosArrowBack size={20} />
          </button>
        )}
        <div className="h-12 w-12 overflow-hidden rounded-full bg-gray-200">
          <AvatarImage
            primarySrc={user?.profile_photo_path}
            defaultPlaceholderSrc={`https://avatar.iran.liara.run/username?username=${encodeURIComponent(user?.name || 'Usuario')}`}
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
        <StyledDropDown
          items={[
            {
              id: '1',
              title: 'Reportar',
              onClick: () => {},
            },
            {
              id: '2',
              title: 'Borrar chats',
              onClick: () => {},
            },
          ]}
        />
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
