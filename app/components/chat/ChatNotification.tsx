'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChatNotification } from '@/app/types/chat';
import { useMediaQuery } from '@/app/hooks/useMediaQuery';
import './notifications.css';

interface ChatNotificationProps {
  notification: ChatNotification;
  onRemove: (id: number) => void;
  autoRemoveDelay?: number;
}

export default function ChatNotificationComponent({
  notification,
  onRemove,
  autoRemoveDelay = 4000,
}: ChatNotificationProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 639px)');

  useEffect(() => {
    setIsMounted(true);

    const removeTimer = setTimeout(() => {
      handleRemove();
    }, autoRemoveDelay);

    return () => {
      clearTimeout(removeTimer);
    };
  }, [autoRemoveDelay]);

  const handleRemove = () => {
    if (isRemoving) return;
    setIsRemoving(true);
    setTimeout(() => {
      onRemove(notification.id);
    }, 300);
  };

  const handleClick = () => {
    router.push(`/main/chat/${notification.conversationId}`);
    handleRemove();
  };

  const formatMessagePreview = (text: string, maxLength?: number) => {
    const defaultLength = isMobile ? 25 : 35;
    const finalLength = maxLength || defaultLength;
    if (text.length <= finalLength) return text;
    return text.substring(0, finalLength) + '...';
  };

  const getNotificationIcon = () => {
    if (notification.message.text && notification.message.text.trim() !== '') {
      return '';
    }

    switch (notification.message.type) {
      case 'image':
        return '📷';
      case 'file':
        return '📎';
      case 'audio':
        return '🎵';
      default:
        return '';
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div
      className={`
        ${isMobile
          ? 'w-full max-w-sm mx-auto bg-white rounded-lg border border-gray-200'
          : 'w-80 bg-white rounded-xl border border-gray-100'
        }
        cursor-pointer notification-shadow transition-all duration-300 ease-out
        ${isRemoving ? 'notification-exit' : 'notification-enter'}
        ${!isMobile && 'hover:-translate-y-1'}
      `}
      onClick={handleClick}
    >
      <div className="p-3 sm:p-4">
        <div className="flex items-start space-x-2 sm:space-x-3">
          <div className="flex-shrink-0">
            {notification.senderAvatar ? (
              <img
                src={notification.senderAvatar}
                alt={notification.senderName}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover ring-2 ring-blue-100"
              />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg">
                {notification.senderName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-gray-900 truncate pr-2">
                {notification.senderName}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100 flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <div className="flex items-start space-x-1 sm:space-x-2">
              {getNotificationIcon() && (
                <span className="text-sm sm:text-base mt-0.5 flex-shrink-0">{getNotificationIcon()}</span>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed break-words">
                  {notification.message.text && notification.message.text.trim() !== ''
                    ? formatMessagePreview(notification.message.text)
                    : `Envió ${notification.message.type === 'image' ? 'una imagen' :
                      notification.message.type === 'file' ? 'un archivo' :
                        notification.message.type === 'audio' ? 'un audio' : 'un archivo'}`
                  }
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {notification.message.time}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}