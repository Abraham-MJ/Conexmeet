'use client';

import { useMobile } from '@/app/hooks/useMobile';
import { ChatUserExternal } from '@/app/types/chat';
import React, { useEffect, useState } from 'react';
import AvatarImage from '../../UI/StyledAvatarImage';
import useFeatures from '@/app/hooks/api/useFeatures';
import { useAgoraContext } from '@/app/context/useAgoraContext';
import { UserInformation } from '@/app/types/streams';
import ModalChannelNotFound from '../modals/ModalChannelNotFound';
import { cn } from '@/lib/utils';
import ModalGallery from '../modals/ModalGallery';
import { Phone, PhoneCall, PhoneOffIcon } from 'lucide-react';
import { IoIosArrowBack } from 'react-icons/io';

interface ChatHeaderProps {
  user: ChatUserExternal;
  onBack: () => void;
  isTyping: boolean;
  isActiveChat: boolean;
  role: string;
}

const statusConfig = {
  available_call: {
    text: 'Llamar',
    icon: <Phone className="h-4 w-4" />,
    className: 'bg-green-500 hover:bg-green-600 text-white animate-pulse-ring',
    tooltip: 'Iniciar llamada',
    disabled: false,
  },
  in_call: {
    text: 'En llamada',
    icon: <PhoneCall className="h-4 w-4" />,
    className: 'bg-red-500 text-white cursor-not-allowed',
    tooltip: 'Usuario en otra llamada',
    disabled: true,
  },
  online: {
    text: 'No disponible',
    icon: <PhoneOffIcon className="h-4 w-4" />,
    className: 'bg-gray-300  text-gray-600 cursor-not-allowed',
    tooltip: 'Usuario no disponible para llamada',
    disabled: true,
  },
};

const ChatHeader: React.FC<ChatHeaderProps> = ({
  user,
  onBack,
  isTyping,
  isActiveChat,
  role,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [channel, setChannel] = useState<UserInformation>();
  const { online } = useFeatures({ activeTabs: 'online' });
  const { handleVideoChatMale } = useAgoraContext();
  const [openProfileImage, setOpenProfileImage] = useState<boolean>(false);

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
    <div
      className={cn('flex items-center justify-between border-b bg-white p-3')}
    >
      <div className="flex items-center">
        {isMobile && (
          <button
            className="mr-4 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border text-gray-500 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-gray-100"
            onClick={onBack}
          >
            <IoIosArrowBack size={22} />
          </button>
        )}

        <div
          className={cn(
            'cursor-pointer overflow-hidden rounded-full bg-gray-200',
            isMobile ? 'h-10 w-10' : 'h-12 w-12',
          )}
          onClick={() => {
            setOpenProfileImage(true);
          }}
        >
          <AvatarImage
            primarySrc={user?.profile_photo_path}
            defaultPlaceholderSrc={`https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png`}
            errorPlaceholderSrc={GENERIC_IMAGE_ERROR_PLACEHOLDER}
            alt={user?.name}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="ml-5">
          <span className="font-semibold text-gray-900">{user?.name}</span>

          {!isActiveChat && !isTyping ? (
            <>
              <div
                className={cn(
                  'flex h-5 items-center gap-1.5 text-sm text-gray-400',
                )}
              >
                <span className={cn('h-2 w-2 rounded-full bg-gray-400')}></span>
                Desconectado
              </div>
            </>
          ) : isActiveChat && isTyping ? (
            <div className="flex h-5 items-center gap-0.5 text-green-500">
              <span className="text-sm">Escribiendo</span>
              <span className="animate-bounce-dots [animation-delay:-0.3s]">
                •
              </span>
              <span className="animate-bounce-dots [animation-delay:-0.15s]">
                •
              </span>
              <span className="animate-bounce-dots">•</span>
            </div>
          ) : (
            <div
              className={cn(
                'flex h-5 items-center gap-1.5 text-sm text-gray-500',
              )}
            >
              <span className={cn('h-2 w-2 rounded-full bg-green-500')}></span>
              En línea
            </div>
          )}
        </div>
      </div>

      {role !== 'female' && (
        <div className="group relative">
          <button
            onClick={() => {
              handleVideoChatMale(channel?.host_id ?? undefined);
            }}
            disabled={
              statusConfig[
                channel?.status === 'available_call' ||
                channel?.status === 'in_call' ||
                channel?.status === 'online'
                  ? channel?.status
                  : 'online'
              ].disabled
            }
            className={cn(
              'flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition-all duration-200',
              isMobile && 'p-4',
              statusConfig[
                channel?.status === 'available_call' ||
                channel?.status === 'in_call' ||
                channel?.status === 'online'
                  ? channel?.status
                  : 'online'
              ].className,
            )}
          >
            {
              statusConfig[
                channel?.status === 'available_call' ||
                channel?.status === 'in_call' ||
                channel?.status === 'online'
                  ? channel?.status
                  : 'online'
              ].icon
            }
            {!isMobile && (
              <span>
                {
                  statusConfig[
                    channel?.status === 'available_call' ||
                    channel?.status === 'in_call' ||
                    channel?.status === 'online'
                      ? channel?.status
                      : 'online'
                  ].text
                }
              </span>
            )}
          </button>
          <div className="pointer-events-none absolute top-full mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
            {
              statusConfig[
                channel?.status === 'available_call' ||
                channel?.status === 'in_call' ||
                channel?.status === 'online'
                  ? channel?.status
                  : 'online'
              ].tooltip
            }
          </div>
        </div>
      )}

      <ModalChannelNotFound
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
        }}
        name={user.name || 'Usuario'}
        status={channel?.status === 'in_call' ? 'in_call' : 'online'}
      />
      {openProfileImage && (
        <ModalGallery
          onClose={() => {
            setOpenProfileImage(false);
          }}
          images={[user.profile_photo_path ?? '']}
          initialIndex={0}
        />
      )}
    </div>
  );
};

export default ChatHeader;
