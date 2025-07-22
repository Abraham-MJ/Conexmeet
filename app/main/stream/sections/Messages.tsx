'use client';

import AnimateGifts from '@/app/components/shared/global/AnimateGifts';
import { useMobile } from '@/app/hooks/useMobile';
import { ChatMessage } from '@/app/types/streams';
import { cn } from '@/lib/utils';
import React, { useRef, useState, useEffect } from 'react';
import { RiTranslate } from 'react-icons/ri';

interface TranslatedChatMessage extends ChatMessage {
  isTranslating?: boolean;
  isTranslated?: boolean;
  display_text?: string;
}

interface MessageGift {
  cost_in_minutes: number;
  gift_image: string;
  is_show: boolean;
  gift_name: string;
}

interface MessagesProps {
  messages: ChatMessage[];
  avatar: {
    local: string;
    remote: string;
  };
}

const MessagesHistory: React.FC<MessagesProps> = ({ messages, avatar }) => {
  const [messageGift, setMessageGift] = useState<MessageGift>({
    cost_in_minutes: 0,
    gift_image: '',
    gift_name: '',
    is_show: false,
  });

  const isMobile = useMobile(1024);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [chatMessages, setChatMessages] = useState<TranslatedChatMessage[]>([]);

  useEffect(() => {
    setChatMessages(
      messages.map((msg) => ({ ...msg, display_text: msg.text })),
    );

    if (audioRef.current && messages.length > 0) {
      if (messages?.[messages?.length - 1]?.type === 'channel-gift') {
        setMessageGift({
          ...messageGift,
          cost_in_minutes:
            messages?.[messages?.length - 1]?.cost_in_minutes ?? 0,
          gift_image: messages?.[messages?.length - 1]?.gift_image ?? '',
          gift_name: messages?.[messages?.length - 1]?.gift_name ?? '',
          is_show: true,
        });

        setTimeout(() => {
          setMessageGift({
            cost_in_minutes: 0,
            gift_image: '',
            gift_name: '',
            is_show: false,
          });
        }, 5000);
      }

      audioRef.current.play().catch((error) => {
        console.warn('Error al reproducir el audio:', error);
      });
    }
    if (messagesEndRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleTranslateClick = (
    clickedMessage: TranslatedChatMessage,
    originalIndex: number,
  ) => {
    if (
      clickedMessage.type !== 'self' &&
      !clickedMessage.isTranslating &&
      !clickedMessage.isTranslated &&
      clickedMessage.translatedText
    ) {
      setChatMessages((prevMessages) =>
        prevMessages.map((msg, i) =>
          i === originalIndex
            ? { ...msg, isTranslating: true, display_text: 'Traduciendo...' }
            : msg,
        ),
      );

      setTimeout(() => {
        setChatMessages((prevMessages) =>
          prevMessages.map((msg, i) =>
            i === originalIndex
              ? {
                  ...msg,
                  isTranslating: false,
                  isTranslated: true,
                  display_text: msg.translatedText,
                }
              : msg,
          ),
        );
      }, 800);
    } else if (clickedMessage.isTranslated) {
      setChatMessages((prevMessages) =>
        prevMessages.map((msg, i) =>
          i === originalIndex
            ? { ...msg, isTranslated: false, display_text: msg.text }
            : msg,
        ),
      );
    }
  };

  return (
    <div className="relative h-full overflow-hidden">
      <div
        className="hide-scrollbar-on-hover mask-gradient-bottom absolute inset-0 touch-pan-y overflow-y-auto overflow-x-hidden overscroll-y-contain"
        ref={messagesContainerRef}
      >
        <div className="box-border flex min-h-[calc(100%-1px)] flex-col justify-end pb-[10px]">
          {chatMessages.map((items, index) => {
            return (
              <div
                className={cn(
                  'my-1',
                  isMobile && 'mr-4 rounded-lg bg-[#0000007a] py-2',
                )}
                key={`${items.rtmUid}-${items.timestamp}-${index}`}
                onClick={() => handleTranslateClick(items, index)}
              >
                <div className="duration-350 text-shadow-md m-0 box-border flex w-fit max-w-full origin-bottom-left animate-fade-in-right cursor-pointer items-start justify-start whitespace-pre-wrap break-words rounded-2xl p-0.5 text-white ease-in-out fill-mode-both">
                  {!isMobile && (
                    <span className="mr-2 flex items-center">
                      <div className="relative isolate flex h-6 w-6 items-center justify-center">
                        <div
                          className="box-border h-full w-full overflow-hidden rounded-full bg-cover bg-center bg-no-repeat"
                          style={{
                            backgroundColor: '#ebecee',
                            backgroundImage: `url(${items?.type === 'self' || items?.type === 'self-gift' ? avatar?.local : avatar?.remote})`,
                          }}
                        ></div>
                      </div>
                    </span>
                  )}
                  <div
                    className={cn(
                      'm-unset w-unset z-10 cursor-auto self-center overflow-hidden pr-[25px] text-left text-sm font-medium not-italic leading-tight tracking-normal',
                      isMobile && 'ml-2',
                      items.type === 'channel-gift' ? 'flex' : '',
                    )}
                  >
                    <span className="text-shadow-md inline-block max-w-full cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap pr-1.5 align-top leading-tight text-[#ffe5df]">
                      <span className="min-h-[17px] overflow-hidden text-ellipsis whitespace-nowrap">
                        {items.user_name}:
                      </span>
                    </span>
                    {items.type === 'self' ||
                    items.type === 'channel' ||
                    items.type === 'self-gift' ? (
                      <>
                        <span className="cursor-pointer font-normal">
                          {items.isTranslating ? (
                            <span className="text-sm text-white">
                              Traduciendo...
                            </span>
                          ) : (
                            items.display_text
                          )}
                          {!items.isTranslating && (
                            <RiTranslate className="relative ml-1 inline-block h-4 w-4 align-text-bottom text-[#bfc1c5]" />
                          )}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="mr-2 flex items-center">
                          <div className="relative isolate flex h-6 w-6 items-center justify-center">
                            <div
                              className="box-border h-full w-full overflow-hidden rounded-full bg-cover bg-center bg-no-repeat"
                              style={{
                                backgroundImage: `url(${items.gift_image})`,
                              }}
                            ></div>
                          </div>
                          <span className="ml-2">
                            {items.gift_name}{' '}
                            {(items?.cost_in_minutes ?? 0) > 0
                              ? `(${items.cost_in_minutes} min)`
                              : ''}
                          </span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef} className="h-[1px] w-[1px]" />
          <audio
            ref={audioRef}
            src={'/sound-notification.mp3'}
            preload="auto"
          />
        </div>
      </div>

      {messageGift.is_show && (
        <AnimateGifts
          image_gift={messageGift.gift_image}
          minutes={messageGift.cost_in_minutes}
          name={messageGift.gift_name}
        />
      )}
    </div>
  );
};

export default MessagesHistory;
