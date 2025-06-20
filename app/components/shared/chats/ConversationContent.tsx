'use client';

import type { MessageContent } from '@/app/types/chat';
import { cn } from '@/lib/utils';
import type React from 'react';
import { useState } from 'react';
import { BsTranslate } from 'react-icons/bs';
import { IoCheckmarkDone, IoCheckmarkOutline } from 'react-icons/io5';

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

  return (
    <div className={`h-full space-y-3 overflow-y-auto pb-24`}>
      {messages.map((message) => {
        const isMyMessage = message.sender === 'me';

        const bubbleClasses = isMyMessage
          ? 'bg-[#5466ff] text-white rounded-l-xl rounded-br-xl'
          : 'bg-[#f6f6f8] text-gray-800 rounded-r-xl rounded-bl-xl shadow-sm';

        const metadataClasses = isMyMessage
          ? 'text-indigo-200/80'
          : 'text-gray-400';

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
