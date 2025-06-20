'use client';

import type { MessageContent } from '@/app/types/chat';
import { formatDateSeparator } from '@/lib/group-date';
import { cn } from '@/lib/utils';
import { isSameDay } from 'date-fns';
import type React from 'react';
import { useState } from 'react';
import { BsTranslate } from 'react-icons/bs';
import { IoCheckmarkDone, IoCheckmarkOutline } from 'react-icons/io5';

type RenderItem =
  | MessageContent
  | { type: 'date-separator'; dateString: string; id: string };

interface MessageContentProps {
  messages: MessageContent[];
}

const ConversationContent: React.FC<MessageContentProps> = ({ messages }) => {
  const [translateText, setTranslateText] = useState<number | null>(null);
  const [translatingId, setTranslatingId] = useState<number | null>(null);

  const handleTranslateToggle = (id: number) => {
    setTranslatingId(id);
    setTimeout(() => {
      if (translateText === id) {
        setTranslateText(null);
      } else {
        setTranslateText(id);
      }
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

  return (
    <div className={`h-full space-y-3 overflow-y-auto px-2 pb-24`}>
      {itemsToRender.map((item) => {
        const message = item as MessageContent;
        const isMyMessage = message.sender === 'me';

        const bubbleClasses = isMyMessage
          ? 'bg-[#5466ff] text-white rounded-l-xl rounded-br-xl'
          : 'bg-[#f6f6f8] text-gray-800 rounded-r-xl rounded-bl-xl shadow-sm';

        const metadataClasses = isMyMessage
          ? 'text-indigo-200/80'
          : 'text-gray-400';

        if ('type' in item && item.type === 'date-separator') {
          return (
            <div key={item.id} className="my-20 flex justify-center">
              <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-600">
                {item.dateString}
              </span>
            </div>
          );
        }

        return (
          <div
            key={message.id}
            className={`flex items-end ${isMyMessage ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={cn(
                'flex max-w-[512px] flex-col gap-1',
                message.sender !== 'me' &&
                  message.translate !== null &&
                  message.translate !== '' &&
                  message.translate !== undefined
                  ? 'cursor-pointer'
                  : 'cursor-default',
              )}
              onClick={() => {
                if (
                  message.translate !== null &&
                  message.translate !== '' &&
                  message.translate !== undefined
                ) {
                  handleTranslateToggle(message.id);
                }
              }}
            >
              <div
                className={`grid grid-cols-[1fr_auto] items-end gap-x-3 p-3 transition-all duration-300 ${bubbleClasses}`}
              >
                <p className="text-[15px] [grid-column:1]">
                  {translatingId === message.id ? (
                    <span className="italic">Traduciendo...</span>
                  ) : (
                    <>
                      {translateText === message.id
                        ? message.translate
                        : message.text}
                    </>
                  )}
                </p>

                <div className="flex items-center gap-1 [grid-column:2]">
                  <span className={`text-[11px] ${metadataClasses}`}>
                    {message.time}
                  </span>
                  {isMyMessage ? (
                    <div className={metadataClasses}>
                      {message.read ? (
                        <IoCheckmarkDone className="h-4 w-4" />
                      ) : (
                        <IoCheckmarkOutline className="h-4 w-4" />
                      )}
                    </div>
                  ) : (
                    <>
                      {message.translate !== null &&
                      message.translate !== '' &&
                      message.translate !== undefined ? (
                        <BsTranslate className="ml-2 h-4 w-4 text-blue-400" />
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ConversationContent;
