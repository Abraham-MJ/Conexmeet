'use client';

import { useUser } from '@/app/context/useClientContext';
import type { MessageContent } from '@/app/types/chat';
import type React from 'react';
import { IoCheckmarkDone, IoCheckmarkOutline } from 'react-icons/io5';

interface MessageContentProps {
  messages: MessageContent[];
}

const ConversationContent: React.FC<MessageContentProps> = ({ messages }) => {
  const { state: user } = useUser();

  return (
    <div
      className={`h-full space-y-3 overflow-y-auto pb-24`}
    >
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
        >
          <div className="min-w-[25%] max-w-[70%]">
            <div
              className={`relative rounded-xl py-2 pl-3 ${
                message.sender === 'me'
                  ? 'bg-[#5466ff] pr-16 text-white'
                  : 'bg-[#f6f6f8] pr-9 text-gray-800'
              }`}
            >
              <p className="text-[15px]">{message.text}</p>
              <div className={`flex w-full items-center justify-between`}>
                <span
                  className={`absolute bottom-1 text-[10px] ${message.sender === 'me' ? 'right-7 text-indigo-200' : 'right-2 text-gray-400'}`}
                >
                  {message.time}
                </span>

                {message.sender === 'me' && (
                  <div className="absolute bottom-1 right-2 ml-1">
                    {message.read ? (
                      <IoCheckmarkDone className="h-4 w-4" />
                    ) : (
                      <IoCheckmarkOutline className="h-4 w-4" />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConversationContent;
