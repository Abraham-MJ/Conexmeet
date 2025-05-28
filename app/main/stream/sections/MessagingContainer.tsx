import React, { useEffect, useRef, useState } from 'react';
import { EmojiPickerButton } from '@/app/components/UI/StyledEmoji';
import { EmojiStyle, Theme } from 'emoji-picker-react';
import { BsEmojiGrin } from 'react-icons/bs';
import { ChatMessage } from '@/app/types/streams';

interface MessagesProps {
  messages: ChatMessage[];
  sendMessage: (message: string) => void;
}

const MessagingContainer: React.FC<MessagesProps> = ({
  messages,
  sendMessage,
}) => {
  const [message, setMessage] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.KeyboardEvent) => {
    if (message.trim() !== '' && e.key === 'Enter' && !e.shiftKey) {
      try {
        e.preventDefault();
        await sendMessage(message);
        setMessage('');
      } catch (error) {
        console.error('SectionChat: Error al enviar mensaje:', error);
      }
    }
  };

  return (
    <>
      <div className="relative flex flex-1 shrink-0 basis-[1px] flex-col">
        <div className="relative h-full overflow-hidden">
          <div className="absolute inset-0 touch-pan-y overflow-y-auto overflow-x-hidden overscroll-y-contain">
            <div className="box-border flex min-h-[calc(100%-1px)] flex-col-reverse pb-[10px]">
              <div className="my-1 flex flex-col gap-3">
                {messages.map((items, index) => {
                  return (
                    <div
                      className="origin-left-bottom animate-chat-event-animation box-border flex w-fit max-w-full cursor-pointer items-start justify-start whitespace-pre-wrap break-words rounded-[14px] p-0.5 text-white [text-shadow:0_1px_2px_#0000003d,0_0_10px_#00000052]"
                      key={`${items.rtmUid}-${items.timestamp}-${index}`}
                    >
                      <span className="flex items-center">
                        <div className="relative isolate flex h-6 w-6 items-center justify-center">
                          <div className="relative h-6 w-6">
                            {/* <img
                              alt="stream-avatar"
                              src={agora.localUser?.avatar}
                              className="relative h-[24px] max-h-full w-[24px] max-w-full rounded-full bg-cover bg-center bg-no-repeat object-cover"
                            /> */}
                          </div>
                        </div>
                      </span>
                      <div className="z-[2] ml-1.5 w-full self-center overflow-hidden pr-[25px] text-start leading-5 tracking-normal">
                        <span className="inline-block max-w-full cursor-pointer text-ellipsis whitespace-nowrap pr-[5px] text-[15px] font-medium leading-5 tracking-normal [text-shadow:0_1px_2px_#0000003d,0_0_10px_#00000052]">
                          {items.user_name}:
                        </span>

                        <span className="text-normal text-sm">
                          {items.text}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-1.5 rounded-3xl">
        <div className="shrink-0">
          <div className="flex items-center gap-2 rounded-full bg-white/10 p-1.5 px-3 backdrop-blur-xl focus-within:ring-0">
            <input
              type="text"
              placeholder="Escribe un mensaje..."
              className="h-full w-full flex-1 bg-transparent py-2 text-sm text-white placeholder-gray-400 focus:outline-none"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
              }}
              onKeyPress={handleSendMessage}
              disabled={false}
            />
            <EmojiPickerButton
              onEmojiSelect={(emojiData: { emoji: string }) => {
                setMessage((prev) => prev + emojiData.emoji);
              }}
              placement="top-end"
              offset={10}
              emojiPickerProps={{
                width: 400,
                height: 400,
                emojiStyle: EmojiStyle.GOOGLE,
                theme: Theme.DARK,
              }}
            >
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 backdrop-blur-xl transition-all duration-300 hover:bg-white/5 hover:text-white"
                aria-label="Abrir selector de emojis"
                disabled={false}
              >
                <BsEmojiGrin size={18} />
              </button>
            </EmojiPickerButton>
          </div>
        </div>
      </div>
    </>
  );
};

export default MessagingContainer;
