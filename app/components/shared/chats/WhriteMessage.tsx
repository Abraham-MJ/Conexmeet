'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BsEmojiGrin } from 'react-icons/bs';
import { IoIosLink, IoMdClose, IoMdSend } from 'react-icons/io';
import { EmojiPickerButton } from '../../UI/StyledEmoji';
import { EmojiClickData, EmojiStyle } from 'emoji-picker-react';
import { useUser } from '@/app/context/useClientContext';
import { useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { SelectedImage, WhriteMessageProps } from '@/app/types/chat';

const MAX_FILES = 3;
const TYPING_TIMEOUT_DURATION = 2000;

const WhriteMessage: React.FC<WhriteMessageProps> = ({
  onSendMessage,
  remote_id,
  sendTypingStarted,
  sendTypingStopped,
}) => {
  const { chat_id } = useParams<{ chat_id: string }>();
  const { state: userState } = useUser();

  const [newMessage, setNewMessage] = useState('');
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasSentTypingStartedRef = useRef<boolean>(false);

  const peerRtmUidForTyping = remote_id;

  useEffect(() => {
    return () => {
      selectedImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (hasSentTypingStartedRef.current && peerRtmUidForTyping) {
        sendTypingStopped(peerRtmUidForTyping);
        hasSentTypingStartedRef.current = false;
      }
    };
  }, [selectedImages, peerRtmUidForTyping, sendTypingStopped]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    if (!peerRtmUidForTyping) return;

    if (!hasSentTypingStartedRef.current && e.target.value.trim() !== '') {
      sendTypingStarted(peerRtmUidForTyping);
      hasSentTypingStartedRef.current = true;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (hasSentTypingStartedRef.current) {
        sendTypingStopped(peerRtmUidForTyping);
        hasSentTypingStartedRef.current = false;
      }
    }, TYPING_TIMEOUT_DURATION);
  };

  const performSendMessage = useCallback(() => {
    if (newMessage.trim() === '' && selectedImages.length === 0) {
      return;
    }
    if (!chat_id) {
      console.error(
        'WhriteMessage: chatIdFromParams (usado como room_id para onSendMessage) es indefinido.',
      );
      return;
    }
    if (!userState.user?.id) {
      console.error(
        'WhriteMessage: userState.user.id (remitente) es indefinido.',
      );
      return;
    }
    onSendMessage({
      file: null,
      message: newMessage.trim(),
      room_id: chat_id,
      translate: '',
      type: 'chat',
      user_id: remote_id.toString(),
    });

    if (peerRtmUidForTyping && hasSentTypingStartedRef.current) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      sendTypingStopped(peerRtmUidForTyping);
      hasSentTypingStartedRef.current = false;
    }

    setNewMessage('');
    selectedImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setSelectedImages([]);
  }, [
    newMessage,
    selectedImages,
    onSendMessage,
    chat_id,
    userState.user?.id,
    peerRtmUidForTyping,
    sendTypingStopped,
  ]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      performSendMessage();
    }
  };

  const handleEmojiSelection = (emojiData: EmojiClickData) => {
    setNewMessage((prevText) => prevText + emojiData.emoji);
    if (!hasSentTypingStartedRef.current && peerRtmUidForTyping) {
      sendTypingStarted(peerRtmUidForTyping);
      hasSentTypingStartedRef.current = true;
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      if (hasSentTypingStartedRef.current && peerRtmUidForTyping) {
        sendTypingStopped(peerRtmUidForTyping);
        hasSentTypingStartedRef.current = false;
      }
    }, TYPING_TIMEOUT_DURATION);
  };

  const handleInputBlur = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (hasSentTypingStartedRef.current && peerRtmUidForTyping) {
      sendTypingStopped(peerRtmUidForTyping);
      hasSentTypingStartedRef.current = false;
    }
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newImages: SelectedImage[] = [];
    const currentImageCount = selectedImages.length;
    let WritableFiles = Array.from(files);

    if (currentImageCount + WritableFiles.length > MAX_FILES) {
      WritableFiles = WritableFiles.slice(0, MAX_FILES - currentImageCount);
    }

    WritableFiles.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const imageId = Date.now().toString() + Math.random().toString();
        const previewUrl = URL.createObjectURL(file);
        newImages.push({ id: imageId, file, previewUrl });
      } else {
      }
    });

    if (newImages.length > 0) {
      setSelectedImages((prevImages) => [...prevImages, ...newImages]);
    }

    if (event.target) {
      event.target.value = '';
    }
  };

  const removeImageById = (idToRemove: string) => {
    setSelectedImages((prevImages) =>
      prevImages.filter((image) => {
        if (image.id === idToRemove) {
          URL.revokeObjectURL(image.previewUrl);
          return false;
        }
        return true;
      }),
    );
  };

  const canSendMessage = newMessage.trim() !== '' || selectedImages.length > 0;

  return (
    <>
      {/* {userState.user?.gender === 'male' && selectedImages.length === 0 && (
        <RewardsList />
      )} */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        aria-label="File input"
      />

      {selectedImages.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 py-2">
          {selectedImages.map((image) => (
            <div
              key={image.id}
              className="relative h-14 w-14 rounded-lg border border-gray-200"
            >
              <img
                src={image.previewUrl}
                alt={`Previsualización ${image.file.name}`}
                className="h-full w-full cursor-pointer rounded-md object-cover"
              />
              <button
                onClick={() => removeImageById(image.id)}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border bg-white p-1 text-gray-600 shadow-md transition-colors hover:bg-gray-100"
                aria-label="Quitar imagen"
              >
                <IoMdClose className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={cn('flex items-center border-gray-200 px-4 py-2')}>
        <input
          type="text"
          value={newMessage}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          onBlur={handleInputBlur}
          placeholder="Escribe un mensaje..."
          className="mr-2 flex-1 rounded-full border-0 bg-[#f6f6f8] px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-0 focus:ring-transparent"
          aria-label="Message input"
          disabled={!peerRtmUidForTyping}
        />
        <div className="flex items-center space-x-1">
          <EmojiPickerButton
            onEmojiSelect={handleEmojiSelection}
            placement="top-end"
            offset={10}
            emojiPickerProps={{
              width: 300,
              height: 380,
              emojiStyle: EmojiStyle.GOOGLE,
            }}
          >
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-700"
              aria-label="Abrir selector de emojis"
            >
              <BsEmojiGrin size={20} />
            </button>
          </EmojiPickerButton>

          <button
            type="button"
            onClick={handleAttachmentClick}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-700"
            aria-label="Adjuntar archivo"
          >
            <IoIosLink size={24} />
          </button>

          <button
            type="button"
            onClick={performSendMessage}
            disabled={!canSendMessage || !peerRtmUidForTyping}
            className={`flex h-9 w-9 items-center justify-center rounded-full ${
              canSendMessage && peerRtmUidForTyping
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'cursor-not-allowed bg-gray-300 text-gray-500'
            }`}
            aria-label="Enviar mensaje"
          >
            <IoMdSend size={20} />
          </button>
        </div>
      </div>
    </>
  );
};

export default WhriteMessage;
