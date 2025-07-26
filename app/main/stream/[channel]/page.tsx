'use client';

import React from 'react';
import { useAgoraContext } from '@/app/context/useAgoraContext';
import { MdCallEnd } from 'react-icons/md';
import { useMobile } from '@/app/hooks/useMobile';
import { useListGifts } from '@/app/hooks/api/useListGifts';
import BackgroundImage from '../sections/BackgroundImage';
import MessagesHistory from '../sections/Messages';
import InputMessages from '../sections/InputMessages';
import ControlsStream from '../sections/Controls';
import GiftContainer from '../sections/GiftContainer';
import StreamsVideo from '../sections/StreamsVideo';
import StreamMobile from '../sections/StreamMobile';
import { TbPlayerTrackNextFilled } from 'react-icons/tb';
import { useAddContacts } from '@/app/hooks/api/useAddContacts';

export const dynamic = 'force-dynamic';

const PageStreamVideo = () => {
  const { contentGifts } = useListGifts();

  const isMobile = useMobile(1024);

  const {
    toggleContact,
    isLoading,
  } = useAddContacts();

  const {
    state: agora,
    sendRtmChannelMessage,
    toggleLocalAudio,
    handleLeaveCall,
    callTimer,
    sendGift,
    hopToRandomChannel,
    isChannelHoppingLoading,
  } = useAgoraContext();

  if (isMobile) {
    return (
      <StreamMobile
        agora={agora}
        callTimer={callTimer}
        handleLeaveCall={handleLeaveCall}
        toggleLocalAudio={toggleLocalAudio}
        sendMessage={sendRtmChannelMessage}
        sendGift={sendGift}
        hopToRandomChannel={hopToRandomChannel}
        isChannelHoppingLoading={isChannelHoppingLoading}
      />
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col">
      <div className="fixed inset-0 box-border flex flex-1 flex-col overflow-hidden bg-[#2c2c2c]">
        <div className="relative z-10 box-border flex h-full w-full flex-none flex-col overflow-hidden">
          <div className="translate-z-0 flex min-h-[1px] flex-1 translate-x-0 translate-y-0 flex-col">
            <div className="z-0 flex h-full w-full flex-shrink-0 flex-col overflow-hidden bg-[#2c2c2c]">
              {agora.localUser?.role === 'female' && (
                <div className="absolute left-0 right-0 top-0 z-20 box-border flex flex-col items-center pt-4">
                  <div className="relative mt-8 box-border flex w-[460px] flex-col justify-center transition-all duration-300 ease-in-out">
                    <div
                      className="absolute bottom-[-2px] left-1/2 flex -translate-x-1/2 transform items-center justify-center overflow-hidden rounded-full bg-[#ffffff29] px-4 py-2 text-white"
                      style={{
                        textShadow:
                          '0 1px 2px rgba(0, 0, 0, 0.13), 0 0 13px rgba(0, 0, 0, 0.23)',
                        willChange: 'transform',
                      }}
                    >
                      <span className="relative text-[14px] font-semibold leading-[20px]">
                        {callTimer}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="z-[3] flex flex-shrink-0 justify-center bg-transparent transition-colors duration-300 ease-in-out">
                <div className="relative bg-transparent">
                  <StreamsVideo
                    localUser={agora?.localUser}
                    remoteUser={
                      agora?.localUser?.role === 'admin'
                        ? agora?.remoteUsers
                        : (agora?.remoteUsers[0] ?? [])
                    }
                    localVideoTrack={agora?.localVideoTrack}
                    isAudioLocal={agora?.isLocalAudioMuted}
                    isAudioRemote={agora?.remoteUsers[0]?.hasAudio}
                    isChannelHoppingLoading={isChannelHoppingLoading}
                  />
                </div>
              </div>

              <BackgroundImage avatar={agora.localUser?.avatar ?? ''} />

              <div className="absolute inset-x-0 top-4 z-20 box-border flex flex-col items-center pt-4"></div>
              <div className="absolute bottom-12 left-0 top-0 z-50 box-border flex w-[330px] flex-col px-0 pl-6 pt-6">
                <div className="mb-6 flex flex-shrink-0 items-center">
                  <button
                    onClick={handleLeaveCall}
                    className="pointer-events-auto relative m-0 mr-6 box-border flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-none bg-[#ffffff29] text-base text-white no-underline opacity-100 shadow-none outline-none backdrop-blur-sm transition duration-300 ease-in-out hover:scale-105 hover:cursor-pointer hover:bg-[#ffffff3d]"
                  >
                    <span className="translate-z-0 relative flex max-w-full flex-1 items-center justify-center">
                      <MdCallEnd className="h-8 w-8 text-white" />
                    </span>
                  </button>
                </div>

                <div className="relative flex flex-1 flex-col gap-2">
                  <div className="flex max-w-[284px] flex-shrink-0 flex-col items-stretch gap-2 p-2">
                    <div className='"relative text-shadow-md pointer-events-auto isolate inline-flex flex-col items-start text-white'>
                      <div className="w-full">
                        <span className="font-lato break-words text-base font-semibold leading-relaxed tracking-normal">
                          {agora.remoteUsers.length !== 0 && (
                            <>{agora.remoteUsers[0].user_name}</>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {agora.remoteUsers.length !== 0 && (
                    <div className="relative box-border flex h-full w-full flex-1 flex-col bg-none p-0">
                      <div className="relative flex flex-1 flex-col">
                        <MessagesHistory
                          messages={agora.chatMessages}
                          avatar={{
                            local: agora?.localUser?.avatar ?? '',
                            remote: agora?.remoteUsers?.[0]?.avatar ?? '',
                          }}
                        />
                      </div>
                      <InputMessages sendMessage={sendRtmChannelMessage} />
                    </div>
                  )}
                </div>
              </div>

              <div className="pointer-events-none absolute bottom-12 right-0 top-0 z-50 box-border flex w-[330px] flex-col justify-between pt-6">
                <ControlsStream
                  isLocalAudioMuted={agora.isLocalAudioMuted}
                  toggleLocalAudio={toggleLocalAudio}
                  toggleContact={toggleContact}
                  isLoading={isLoading}
                  remoteUser={
                    agora?.localUser?.role === 'admin'
                      ? agora?.remoteUsers
                      : (agora?.remoteUsers[0] ?? [])
                  }
                />
                <div className="relative mr-6 flex min-h-0 flex-1 flex-col">
                  {agora.localUser?.role === 'male' && (
                    <GiftContainer
                      giftsItems={contentGifts}
                      sendGift={sendGift}
                    />
                  )}
                </div>
                {agora.localUser?.role !== 'female' && (
                  <div className="mt-4 flex flex-shrink-0 justify-end pe-6">
                    <button
                      onClick={hopToRandomChannel}
                      className="pointer-events-auto relative m-0 box-border flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-none bg-[#ffffff29] text-base text-white no-underline opacity-100 outline-none backdrop-blur-[12px] transition duration-300 ease-in-out hover:scale-105 hover:cursor-pointer hover:bg-[#ffffff3d]"
                    >
                      <TbPlayerTrackNextFilled className="h-8 w-8" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageStreamVideo;
