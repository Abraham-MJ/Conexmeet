'use client';

import type { Message, MessageContent } from '@/app/types/chat';
import { formatDateSeparator } from '@/lib/group-date';
import { cn } from '@/lib/utils';
import { isSameDay } from 'date-fns';
import type React from 'react';
import { useState } from 'react';
import ModalGallery from '../modals/ModalGallery';
import {
  Check,
  CheckCheck,
  Languages,
  LoaderCircle,
  Undo2,
} from 'lucide-react';

type RenderItem =
  | MessageContent
  | { type: 'date-separator'; dateString: string; id: string };

interface MessageContentProps {
  messages: MessageContent[];
}

const ConversationContent: React.FC<MessageContentProps> = ({ messages }) => {
  const [translateText, setTranslateText] = useState<number | null>(null);
  const [translatingId, setTranslatingId] = useState<number | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);

  const handleTranslateToggle = (id: number) => {
    setTranslatingId(id);
    setIsTranslating(true);
    setTimeout(() => {
      if (translateText === id) {
        setTranslateText(null);
      } else {
        setTranslateText(id);
      }
      setIsTranslating(false);
      setTranslatingId(null);
    }, 500);
  };

  const itemsToRender: RenderItem[] = [];
  let lastDate: Date | null = null;

  messages.forEach((message) => {
    if (!message.created_at) {
      itemsToRender.push(message);
      return;
    }

    const currentDate = new Date(message.created_at);

    if (!lastDate || !isSameDay(currentDate, lastDate)) {
      const dateString = formatDateSeparator(currentDate);
      itemsToRender.push({
        type: 'date-separator',
        dateString: dateString,
        id: `date-${currentDate.toISOString()}`,
      });
    }

    itemsToRender.push(message);
    lastDate = currentDate;
  });

  const getImageFileUrls = (messages: MessageContent[]): string[] => {
    return messages.reduce((acc: string[], message) => {
      if (message.type === 'image' && message.file_url) {
        acc.push(message.file_url);
      }
      return acc;
    }, []);
  };

  const imageUrls = getImageFileUrls(messages);
  const indexOfOpenedImage = imageUrls.indexOf(previewImage);

  return (
    <div className={`h-full space-y-2 px-4`}>
      {itemsToRender.map((item) => {
        const message = item as MessageContent;
        const isMyMessage = message.sender === 'me';

        const bubbleClasses = isMyMessage
          ? 'bg-[#fc3d6b] text-white self-end rounded-br-none'
          : 'bg-gray-200  self-start rounded-bl-none';

        const StatusTick = () => {
          return message.read === true ? (
            <CheckCheck className="text-brand-foreground h-4 w-4" />
          ) : (
            <Check className="text-brand-foreground/70 h-4 w-4" />
          );
        };

        if ('type' in item && item.type === 'date-separator') {
          const dateItem = item as {
            type: 'date-separator';
            dateString: string;
            id: string;
          };
          return (
            <div
              className="my-4 flex items-center justify-center"
              key={dateItem.dateString}
            >
              <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500 dark:bg-gray-800">
                {dateItem.dateString}
              </div>
            </div>
          );
        }

        return (
          <div
            className={cn(
              'group flex items-center gap-2',
              isMyMessage ? 'justify-end' : 'justify-start',
            )}
            key={item.id}
          >
            {!isMyMessage && (
              <button
                onClick={() => {
                  handleTranslateToggle(message.id);
                }}
                className="rounded-full p-1.5 opacity-0 transition-opacity hover:bg-gray-200 group-hover:opacity-100"
              >
                {isTranslating ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : translatingId === message.id ? (
                  <Undo2 className="h-4 w-4" />
                ) : (
                  <Languages className="h-4 w-4" />
                )}
              </button>
            )}

            <div
              className={cn(
                'max-w-xs rounded-xl md:max-w-md',
                message.file_url ? 'p-2' : 'p-3',
                bubbleClasses,
              )}
            >
              {message.file_url && (
                <img
                  onClick={() => {
                    setPreviewImage(message.file_url ?? '');
                    setIsOpen(true);
                  }}
                  src={message.file_url}
                  alt={message.text || 'Imagen enviada'}
                  className="h-auto w-full cursor-pointer rounded-lg"
                />
              )}
              {message.text && (
                <p
                  className={cn(
                    'break-words text-sm',
                    message.file_url ? 'mt-2' : '',
                  )}
                >
                  {translateText === message.id
                    ? message.translate
                    : message.text}
                </p>
              )}
              <div className="mt-1 flex items-center justify-end gap-1">
                <span className="text-xs opacity-70">{message.time}</span>
                {isMyMessage && <StatusTick />}
              </div>
            </div>
          </div>
        );
      })}
      {isOpen && (
        <ModalGallery
          onClose={() => {
            setIsOpen(false);
          }}
          images={imageUrls}
          initialIndex={indexOfOpenedImage}
        />
      )}
    </div>
  );
};

export default ConversationContent;
