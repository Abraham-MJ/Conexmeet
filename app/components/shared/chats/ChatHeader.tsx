import { useMobile } from '@/app/hooks/useMobile';
import { ChatUserExternal } from '@/app/types/chat';
import React from 'react';
import { IoIosArrowBack } from 'react-icons/io';
import AvatarImage from '../../UI/StyledAvatarImage';
import StyledDropDown from '../../UI/StyledDropDown';

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
  const isMobile = useMobile();
  const GENERIC_IMAGE_ERROR_PLACEHOLDER = `https://via.placeholder.com/150/CCCCCC/FFFFFF?Text=${encodeURIComponent(user.name || 'Usuario')}`;

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

          {isTyping && <p className="text-xs text-gray-500">Typing...</p>}

          {!isTyping && (
            <>
              {isActiveChat ? (
                <p className="text-xs text-gray-500">Online</p>
              ) : (
                <p className="text-xs text-gray-500">Offline</p>
              )}
            </>
          )}
        </div>
      </div>
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
          {
            id: '3',
            title: 'Llamar',
            onClick: () => {},
          },
        ]}
      />
    </div>
  );
};

export default ChatHeader;
