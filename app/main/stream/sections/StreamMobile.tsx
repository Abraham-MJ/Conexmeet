'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import BackgroundImage from './BackgroundImage';
import { AgoraState } from '@/app/types/streams';
import { MdCallEnd } from 'react-icons/md';
import { IoMicOffOutline, IoMicOutline } from 'react-icons/io5';
import MessagesHistory from './Messages';
import { useListGifts } from '@/app/hooks/api/useListGifts';
import { GiftItem } from './GiftContainer';
import { TbMessage2Heart, TbPlayerTrackNextFilled } from 'react-icons/tb';
import { LuSendHorizontal } from 'react-icons/lu';

interface StreamMobileProps {
  agora: AgoraState;
  callTimer: string;
  handleLeaveCall: () => Promise<void>;
  toggleLocalAudio: () => Promise<void>;
  sendMessage: (messageText: string) => Promise<void>;
  sendGift: (
    gifId: string | number,
    giftCostInMinutes: number,
    gift_image: string,
    giftPoints: number,
    gift_name: string,
  ) => Promise<
    | { success: boolean; message?: string; cost_in_minutes: number }
    | { success: boolean; message?: string }
  >;
  hopToRandomChannel: () => Promise<void>;
  isChannelHoppingLoading: boolean;
}

const VIDEO_WIDTH = 120;
const VIDEO_HEIGHT = 130;
const PADDING = 8;

const StreamMobile: React.FC<StreamMobileProps> = ({
  agora,
  callTimer,
  handleLeaveCall,
  toggleLocalAudio,
  sendMessage,
  sendGift,
  hopToRandomChannel,
  isChannelHoppingLoading,
}) => {
  const { contentGifts } = useListGifts();
  const [isOpenChat, setIsOpenChat] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [isLocalVideoMain, setIsLocalVideoMain] = useState<boolean>(false);

  const [localVideoPosition, setLocalVideoPosition] = useState({
    x: window.innerWidth - VIDEO_WIDTH - PADDING,
    y: PADDING + 70,
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const localVideoPlayerRef = useRef<HTMLDivElement>(null);
  const remoteVideoPlayerRef = useRef<HTMLDivElement>(null);
  const chatInputContainerRef = useRef<HTMLDivElement>(null);
  const messagesHistoryRef = useRef<HTMLDivElement>(null);

  const getFixedPositions = useCallback(() => {
    const messagesAreaHeight =
      messagesHistoryRef.current?.clientHeight || window.innerHeight * 0.3;
    const bottomControlsHeight =
      (chatInputContainerRef.current?.offsetHeight || 52) + PADDING;

    const bottomLimitY =
      window.innerHeight -
      messagesAreaHeight -
      bottomControlsHeight -
      VIDEO_HEIGHT -
      PADDING;

    return [
      { x: PADDING, y: PADDING + 70 },
      { x: window.innerWidth - VIDEO_WIDTH - PADDING, y: PADDING + 70 },
      { x: PADDING, y: bottomLimitY },
      { x: window.innerWidth - VIDEO_WIDTH - PADDING, y: bottomLimitY },
    ];
  }, []);

  useEffect(() => {
    const localTrack = agora.localVideoTrack;
    const remoteTrack = agora?.remoteUsers[0]?.videoTrack;
    const localPlayerDiv = localVideoPlayerRef.current;
    const remotePlayerDiv = remoteVideoPlayerRef.current;

    try {
      localTrack?.stop();
    } catch (e) {
      console.warn('No se pudo detener la pista local:', e);
    }
    try {
      remoteTrack?.stop();
    } catch (e) {
      console.warn('No se pudo detener la pista remota:', e);
    }

    if (isLocalVideoMain) {
      if (localTrack && remotePlayerDiv) {
        localTrack.play(remotePlayerDiv);
      }
      if (remoteTrack && localPlayerDiv) {
        remoteTrack.play(localPlayerDiv);
      }
    } else {
      if (remoteTrack && remotePlayerDiv) {
        remoteTrack.play(remotePlayerDiv);
      }
      if (localTrack && localPlayerDiv) {
        localTrack.play(localPlayerDiv);
      }
    }

    return () => {
      try {
        localTrack?.stop();
      } catch (e) {
        console.warn('No se pudo detener la pista local en la limpieza:', e);
      }
      try {
        remoteTrack?.stop();
      } catch (e) {
        console.warn('No se pudo detener la pista remota en la limpieza:', e);
      }
    };
  }, [
    agora.localVideoTrack,
    agora.remoteUsers[0]?.videoTrack,
    agora.remoteUsers[0]?.rtcUid,
    isLocalVideoMain,
  ]);

  const handleVideoSwap = () => {
    if (!isDragging) {
      setIsLocalVideoMain((prev) => !prev);
    }
  };

  const handleDragStart = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
  ) => {
    if (localVideoPlayerRef.current) {
      setIsDragging(true);
      const rect = localVideoPlayerRef.current.getBoundingClientRect();
      let clientX: number, clientY: number;

      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      dragOffset.current = {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    }
  };

  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;

    let clientX: number, clientY: number;
    if ('touches' in e) {
      e.preventDefault();
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const newX = clientX - dragOffset.current.x;
    const newY = clientY - dragOffset.current.y;

    const maxX = window.innerWidth - VIDEO_WIDTH;
    const maxY = window.innerHeight - VIDEO_HEIGHT;

    setLocalVideoPosition({
      x: Math.min(Math.max(0, newX), maxX),
      y: Math.min(Math.max(0, newY), maxY),
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);

    const currentX = localVideoPosition.x + VIDEO_WIDTH / 2;
    const currentY = localVideoPosition.y + VIDEO_HEIGHT / 2;

    const fixedPositions = getFixedPositions();
    let closestPosition = fixedPositions[0];
    let minDistance = Infinity;

    fixedPositions.forEach((pos) => {
      const distance = Math.sqrt(
        Math.pow(currentX - (pos.x + VIDEO_WIDTH / 2), 2) +
          Math.pow(currentY - (pos.y + VIDEO_HEIGHT / 2), 2),
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestPosition = pos;
      }
    });

    setLocalVideoPosition(closestPosition);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      document.addEventListener('touchmove', handleDragMove, {
        passive: false,
      });
      document.addEventListener('touchend', handleDragEnd);
    } else {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      document.removeEventListener('touchmove', handleDragMove);
      document.removeEventListener('touchend', handleDragEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      document.removeEventListener('touchmove', handleDragMove);
      document.removeEventListener('touchend', handleDragEnd);
    };
  }, [
    isDragging,
    getFixedPositions,
    localVideoPosition.x,
    localVideoPosition.y,
  ]);

  const handleSendMessage = async () => {
    if (message.trim()) {
      await sendMessage(message);
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        chatInputContainerRef.current &&
        chatInputContainerRef.current.contains(event.target as Node)
      ) {
        return;
      }

      if (isOpenChat) {
        setIsOpenChat(false);
      }
    };

    if (isOpenChat) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpenChat]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="fixed bottom-0 left-0 right-0 top-0 box-border flex flex-[1_0_1px] flex-col overflow-hidden bg-[#2c2c2c]">
        <div className="relative z-10 box-border flex flex-[0_0_100%] flex-col overflow-hidden">
          <div className="flex min-h-[1px] flex-1 flex-col">
            <div className="relative flex h-full w-full flex-shrink-0 flex-col overflow-hidden">
              <BackgroundImage avatar={agora.localUser?.avatar ?? ''} />

              <div className="absolute left-4 top-20 z-50 rounded-full p-2 backdrop:blur-2xl">
                {agora?.remoteUsers.length > 0 &&
                  agora.remoteUsers[0].hasAudio === false && (
                    <IoMicOffOutline className="h-8 w-8 text-white" />
                  )}
              </div>

              <div
                ref={remoteVideoPlayerRef}
                className="absolute bottom-0 left-0 right-0 top-0 z-10 block h-full w-full object-cover"
              />

              <div className="relative mt-2 flex flex-1 justify-between self-stretch overflow-hidden px-4">
                <div className="to-black/24 relative z-10 box-border flex h-16 items-center justify-between bg-gradient-to-t from-transparent">
                  <div className="flex items-center">
                    <button
                      onClick={handleLeaveCall}
                      className="transition-border pointer-events-auto m-0 box-border flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-none bg-[#0000007a] text-white no-underline opacity-100 shadow-none backdrop-blur-3xl transition-colors duration-300 ease-in-out"
                    >
                      <span className="translate-z-0 relative flex max-w-full flex-1 transform items-center justify-center">
                        <MdCallEnd className="h-8 w-8 text-white" />
                      </span>
                    </button>
                  </div>
                </div>
                {agora?.localUser?.role === 'female' && (
                  <div className="relative z-10 mt-4 box-border flex h-8 items-center justify-between rounded-full bg-[#0000007a] px-3">
                    <span className="translate-z-0 relative flex max-w-full flex-1 items-center justify-center font-semibold text-white">
                      {callTimer}
                    </span>
                  </div>
                )}
                <div className="to-black/24 relative z-10 box-border flex h-16 items-center justify-between bg-gradient-to-t from-transparent pl-3">
                  <div className="flex items-center">
                    <button
                      onClick={toggleLocalAudio}
                      className="transition-border pointer-events-auto m-0 box-border flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-none bg-[#0000007a] text-white no-underline opacity-100 shadow-none backdrop-blur-3xl transition-colors duration-300 ease-in-out"
                    >
                      <span className="translate-z-0 relative flex max-w-full flex-1 transform items-center justify-center">
                        {agora.isLocalAudioMuted ? (
                          <IoMicOffOutline className="h-8 w-8" />
                        ) : (
                          <IoMicOutline className="h-8 w-8" />
                        )}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <div
                className="absolute top-20 z-10 h-[130px] w-[120px] cursor-grab overflow-hidden rounded-xl transition-all duration-300 ease-out"
                style={{
                  left: localVideoPosition.x,
                  top: localVideoPosition.y,
                  touchAction: isDragging ? 'none' : 'auto',
                }}
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
                onClick={handleVideoSwap}
              >
                <div
                  ref={localVideoPlayerRef}
                  className="relative h-full w-full rounded-xl bg-[#05030314] object-cover"
                >
                  <div className="absolute bottom-2 left-2 z-50 rounded-full bg-[#0000007a] p-1 backdrop:blur-2xl">
                    {agora?.isLocalAudioMuted && (
                      <span className="">
                        <IoMicOffOutline className="h-5 w-5 text-white" />
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {isChannelHoppingLoading && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-[#fc3d6b]"></div>
                    <p className="text-center font-medium text-white">
                      Cambiando de canal...
                    </p>
                  </div>
                </div>
              )}

              <div className="pointer-events-none relative z-20 flex flex-1 flex-col">
                <div className="pointer-events-none flex flex-1 flex-col justify-end">
                  <div className="relative flex flex-1 flex-col justify-end">
                    <div
                      ref={messagesHistoryRef}
                      className="touch-action-none pointer-events-auto relative z-10 my-0 ml-4 mr-[calc(var(152,8px)+8px)] box-border h-[30vh] w-auto flex-none overflow-hidden overflow-x-hidden border-none"
                    >
                      <MessagesHistory
                        messages={agora.chatMessages}
                        avatar={{
                          local: agora?.localUser?.avatar ?? '',
                          remote: agora?.remoteUsers?.[0]?.avatar ?? '',
                        }}
                      />
                    </div>
                  </div>
                  {agora?.localUser?.role === 'male' && (
                    <div className="hide-scrollbar-on-hover pointer-events-auto mb-4 flex w-[calc(100%-16px)] flex-row overflow-x-auto pl-4">
                      {contentGifts.map((gift: GiftItem) => {
                        return (
                          <button
                            key={gift.id}
                            onClick={() => {
                              sendGift(
                                gift.id,
                                gift.minutes,
                                gift.image,
                                gift.points,
                                gift.name,
                              );
                            }}
                            className="relative ml-3 flex flex-shrink-0 cursor-pointer flex-col items-center justify-center rounded-lg bg-[#0000007a] px-3 py-2 backdrop-blur-3xl transition-colors duration-200 ease-in-out hover:bg-[#0000009a]"
                          >
                            <img
                              src={gift.image}
                              className="mb-0.5 h-10 w-10 object-contain"
                              alt={gift.image}
                            />
                            <span className="flex items-center text-xs text-white">
                              <div className="flex items-center justify-center">
                                <div
                                  className="flex items-center justify-center"
                                  data-testid="gift-price-coins-number"
                                >
                                  <span>{gift.minutes} min</span>
                                </div>
                              </div>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {agora?.remoteUsers.length > 0 && (
                    <div className="relative flex w-full items-center justify-between px-4 pb-4">
                      {isOpenChat ? (
                        <div
                          ref={chatInputContainerRef}
                          className="relative mx-2 mb-0 mt-1 box-border flex h-[52px] flex-1 flex-row items-end rounded-full bg-[#0000007a] p-2 ps-1 backdrop-blur-[12px] transition-colors duration-300 ease-in-out"
                        >
                          <input
                            className="m-0 mx-9 ml-3 mr-14 box-border h-full w-full flex-1 resize-none self-center border-none bg-transparent pr-3 text-sm leading-tight text-white outline-none"
                            placeholder="Di algo..."
                            value={message}
                            onChange={(e) => {
                              setMessage(e.target.value);
                            }}
                            onKeyPress={handleKeyPress}
                            autoFocus
                          />
                          <button
                            onClick={handleSendMessage}
                            className="pointer-events-auto absolute right-2.5 top-[9px] m-0 box-border flex h-8 items-center justify-center overflow-hidden rounded-[18px] border-none bg-transparent p-0 no-underline opacity-100 outline-none transition duration-300 ease-in-out"
                            aria-label="Enviar mensaje"
                          >
                            <span className="translate-z-0 relative flex max-w-full items-center justify-center">
                              <LuSendHorizontal className="h-7 w-7 text-white" />
                            </span>
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setIsOpenChat(true);
                            }}
                            className="transition-border pointer-events-auto m-0 box-border flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-none bg-[#0000007a] text-white no-underline opacity-100 shadow-none backdrop-blur-3xl transition-colors duration-300 ease-in-out"
                            aria-label="Abrir chat"
                          >
                            <span className="translate-z-0 relative flex max-w-full flex-1 transform items-center justify-center">
                              <TbMessage2Heart className="h-8 w-8" />
                            </span>
                          </button>
                          {agora?.localUser?.role === 'male' ? (
                            <button
                              onClick={hopToRandomChannel}
                              className="transition-border pointer-events-auto m-0 box-border flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-none bg-[#0000007a] text-white no-underline opacity-100 shadow-none backdrop-blur-3xl transition-colors duration-300 ease-in-out"
                              aria-label="Enviar un regalo"
                            >
                              <span className="translate-z-0 relative flex max-w-full flex-1 transform items-center justify-center">
                                <TbPlayerTrackNextFilled className="h-8 w-8" />
                              </span>
                            </button>
                          ) : null}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamMobile;
