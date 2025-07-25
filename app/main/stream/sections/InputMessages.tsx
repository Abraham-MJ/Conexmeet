'use client';

import { EmojiPickerButton } from '@/app/components/UI/StyledEmoji';
import { EmojiStyle, Theme } from 'emoji-picker-react';
import React, { useState } from 'react';
import { useTranslation } from '@/app/hooks/useTranslation';

interface InputMessagesProps {
  sendMessage: (message: string) => void;
}

const InputMessages: React.FC<InputMessagesProps> = ({ sendMessage }) => {
  const { t } = useTranslation();
  const [message, setMessage] = useState<string>('');

  const handleSendMessage = async (e: React.KeyboardEvent) => {
    if (message.trim() !== '' && e.key === 'Enter' && !e.shiftKey) {
      try {
        e.preventDefault();
        await sendMessage(message);
        setMessage('');
      } catch (error) {
        console.error(`SectionChat: ${t('errors.sendMessage')}:`, error);
      }
    }
  };

  const handleSendClick = async () => {
    if (message.trim() !== '') {
      try {
        await sendMessage(message);
        setMessage('');
      } catch (error) {
        console.error(`SectionChat: ${t('errors.sendMessage')}:`, error);
      }
    }
  };

  return (
    <div className="relative mx-2 mb-0 mt-1 box-border flex min-h-12 flex-row items-end rounded-3xl bg-[#ffffff29] p-2 ps-1 backdrop-blur-[12px] transition-colors duration-300 ease-in-out">
      <input
        className="m-0 mx-9 ml-3 mr-14 box-border !h-[20px] w-full flex-1 resize-none self-center border-none bg-transparent pr-3 text-sm leading-tight text-white outline-none"
        placeholder={t('video.saySomething')}
        data-testid="textarea"
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
        }}
        onKeyPress={handleSendMessage}
      ></input>
      <EmojiPickerButton
        onEmojiSelect={(emojiData: { emoji: string }) => {
          setMessage((prev) => prev + emojiData.emoji);
        }}
        placement="top-end"
        offset={10}
        emojiPickerProps={{
          width: 400,
          height: 400,
          emojiStyle: EmojiStyle.FACEBOOK,
          theme: Theme.DARK,
        }}
      >
        <button
          className="pointer-events-auto absolute right-10 m-0 box-border flex h-8 items-center justify-center overflow-hidden rounded-[18px] border-none bg-transparent p-0 no-underline opacity-100 outline-none transition duration-300 ease-in-out"
          data-testid="show-emoji-picker"
        >
          <span className="translate-z-0 relative flex max-w-full items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              fill="none"
              viewBox="0 0 32 32"
            >
              <path
                fill="#fff"
                fillRule="evenodd"
                d="M16 4.25C9.51 4.25 4.25 9.51 4.25 16S9.51 27.75 16 27.75 27.75 22.49 27.75 16 22.49 4.25 16 4.25M5.75 16c0-5.66 4.589-10.25 10.25-10.25S26.25 10.34 26.25 16 21.66 26.25 16 26.25 5.75 21.66 5.75 16m6.125 2.064a.8.8 0 1 0-1.431.715c2.09 4.18 8.344 4.856 11.096.04a.8.8 0 0 0-1.389-.794c-2.09 3.659-6.733 3.125-8.276.039m1.706-5.891a.8.8 0 0 1 .8.8v2.422a.8.8 0 0 1-1.6 0v-2.422a.8.8 0 0 1 .8-.8m5.643.8a.8.8 0 0 0-1.6 0v2.422a.8.8 0 0 0 1.6 0z"
                clipRule="evenodd"
              ></path>
            </svg>
          </span>
        </button>
      </EmojiPickerButton>
      <button
        className="pointer-events-auto absolute right-2.5 m-0 box-border flex h-8 items-center justify-center overflow-hidden rounded-[18px] border-none bg-transparent p-0 no-underline opacity-100 outline-none transition duration-300 ease-in-out"
        data-testid="send-message-button"
        onClick={handleSendClick}
      >
        <span className="translate-z-0 relative flex max-w-full items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            fill="none"
            viewBox="0 0 32 32"
          >
            <path
              fill="#fff"
              d="m8.507 13.481-.758.254.001.006zm0 4.275-.757-.26-.001.006zm15.211-1.337a.8.8 0 1 0 0-1.6zM7.076 24.726l.343.723zm-.698-.618.759.254zm.354-16.874 18.212 8.65.686-1.445-18.21-8.65zm18.212 8.12-18.212 8.65.687 1.445 18.211-8.65zm-14.947.005-.733-2.137-1.514.519.733 2.137zm-.731-2.132-2.13-6.352-1.516.508 2.129 6.352zm-2.13 11.135 2.13-6.352-1.517-.508-2.13 6.352 1.518.508zm2.128-6.346.733-2.138-1.514-.519-.733 2.138zm-.024-1.597h14.478v-1.6H9.24zm-2.508 7.585a.294.294 0 0 1 .405.358l-1.517-.508c-.366 1.092.758 2.09 1.799 1.595zm18.212-8.12a.294.294 0 0 1 0-.53l.686 1.445c.995-.473.995-1.888 0-2.36zM7.419 5.788c-1.04-.494-2.165.503-1.8 1.595l1.518-.508a.294.294 0 0 1-.405.359z"
            ></path>
          </svg>
        </span>
      </button>
    </div>
  );
};

export default InputMessages;
