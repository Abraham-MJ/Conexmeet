'use client';

import React from 'react';
import { useAgoraContext } from '@/app/context/useAgoraContext';
import MessagingContainer from '../sections/MessagingContainer';
import { MdCallEnd } from 'react-icons/md';
import { BsGiftFill } from 'react-icons/bs';
import { FiVideo, FiVideoOff } from 'react-icons/fi';
import { IoMicOutline, IoMicOffOutline } from 'react-icons/io5';
import DisplayVideoView from '../sections/DisplayVideoView';
import { useMobile } from '@/app/hooks/useMobile';
import { useUser } from '@/app/context/useClientContext';

const PageStreamVideo = () => {
  const { state: user } = useUser();
  const isMobile = useMobile(1024);

  const {
    state: agora,
    sendRtmChannelMessage,
    toggleLocalAudio,
    toggleLocalVideo,
    handleLeaveCall,
    callTimer,
  } = useAgoraContext();

  return (
    <div className="fixed left-0 top-0 z-[50] h-screen w-full bg-[#2c2c2c]">
      <div className="z-0 flex h-full w-full flex-shrink-0 flex-col">
        <div className="relative flex h-full flex-shrink-0 flex-col">
          <div className="absolute bottom-0 left-0 right-0 top-0 overflow-hidden after:absolute after:left-0 after:top-0 after:z-[1] after:block after:h-full after:w-full after:bg-[#000000a7] after:content-['']">
            <img
              className="h-full w-full object-cover blur-[32px]"
              alt="stream-avatar"
              src={agora.localUser?.avatar}
            ></img>
          </div>

          <div className="z-20 flex flex-col">
            <div className="absolute bottom-12 left-0 top-0 z-[5] box-border flex w-[330px] flex-col pl-6 pt-6">
              <div className="mb-6 flex shrink-0 items-center">
                <div className="relative flex items-center gap-2 transition duration-300 ease-in-out">
                  <div
                    onClick={handleLeaveCall}
                    className="relative box-border flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-red-500 text-white backdrop-blur-md transition-all duration-300 ease-in-out hover:scale-105"
                  >
                    <div className="flex items-center p-2 text-center">
                      <span className="text-sm font-medium">
                        <MdCallEnd className="h-6 w-6 text-white" />
                      </span>
                    </div>
                  </div>
                  {user.user.gender === 'female' && (
                    <div className="relative box-border flex h-10 min-w-[90px] items-center justify-center rounded-[20px] bg-[#ffffff29] text-white backdrop-blur-md transition-colors duration-300 ease-in-out">
                      <div className="flex items-center p-2 text-center">
                        <span className="text-sm font-medium">{callTimer}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="relative flex flex-1 flex-col gap-2">
                {agora.remoteUsers.length !== 0 && (
                  <div className="flex max-w-[200px] shrink-0 flex-col items-stretch gap-2 p-2">
                    <div className="pointer-events-auto box-border flex w-full select-none flex-col py-2 text-white backdrop-blur-[6px] transition-colors duration-300 ease-in-out [text-shadow:0_1px_2px_#0000003d,0_0_10px_#00000052]">
                      <div className="flex items-center justify-start">
                        <span className="text-base font-medium">
                          {agora.remoteUsers[0].user_name}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="relative box-border flex w-full flex-1 shrink-0 basis-[1px] flex-col p-0">
                  <MessagingContainer
                    messages={agora.chatMessages}
                    sendMessage={sendRtmChannelMessage}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="z-20 flex flex-col">
            <div className="bottom-12 z-[5] box-border flex w-[330px] flex-col">
              <div className="pointer-events-none absolute bottom-12 right-0 top-0 z-[5] box-border flex w-[330px] flex-col justify-between pt-6">
                <div className="mb-6 flex shrink-0 items-center">
                  <div className="mb-6 flex w-full shrink-0 items-center justify-end gap-3 pr-6">
                    <button
                      onClick={toggleLocalVideo}
                      className="pointer-events-auto relative m-0 box-border flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-none bg-[#ffffff29] p-0 text-white no-underline opacity-100 shadow-none backdrop-blur-md transition-all duration-300 ease-in-out [-webkit-tap-highlight-color:transparent] hover:scale-105"
                    >
                      {agora.isLocalVideoMuted ? (
                        <FiVideoOff className="h-7 w-7" />
                      ) : (
                        <FiVideo className="h-6 w-6" />
                      )}
                    </button>
                    <button
                      onClick={toggleLocalAudio}
                      className="pointer-events-auto relative m-0 box-border flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-none bg-[#ffffff29] p-0 text-white no-underline opacity-100 shadow-none backdrop-blur-md transition-all duration-300 ease-in-out [-webkit-tap-highlight-color:transparent] hover:scale-105"
                    >
                      {agora.isLocalAudioMuted ? (
                        <IoMicOffOutline className="h-7 w-7" />
                      ) : (
                        <IoMicOutline className="h-7 w-7" />
                      )}
                    </button>
                  </div>
                </div>

                {/* {agora.localUser?.role === 'male' && (
                  <div className="relative flex w-full flex-1 flex-col">
                    <div className="pointer-events-auto flex min-h-0 flex-1 flex-col">
                      <div className="flex min-h-0 flex-1 translate-x-0 flex-col opacity-100">
                        <div className="flex min-h-0 flex-1 flex-col [mask-image:linear-gradient(180deg,transparent_0px,black_16px,black_calc(100%_-_16px),transparent_100%)]">
                          <div className="pointer-events-auto relative mr-6 flex w-auto flex-1 shrink-0 basis-[1px] flex-col items-end gap-3 self-end overflow-auto overflow-x-visible p-0">
                            {[...Array(15)].map(() => {
                              return (
                                <div className="h-18 pointer-events-auto relative mb-1 ml-0 flex w-14 shrink-0 flex-col items-center justify-center rounded-lg transition-colors duration-200 ease-in-out">
                                  <img
                                    src="https://cget.tango.me/contentserver/download/YtVLbgAA-cHLJgT-jgRS1A/kNUMcJQ6"
                                    alt=""
                                    className="mb-0 h-12 w-12"
                                  />
                                  <div className="flex items-center text-[10px] leading-4 text-white">
                                    <div className="flex items-center justify-center text-[10px] font-medium leading-4 tracking-normal">
                                      <div className="flex items-center justify-center">
                                        <span>Free</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )} */}

                <div className="mt-4 flex shrink-0">
                  <div className="w-full justify-end">
                    <div className="mt-4 flex shrink-0 justify-end pr-6">
                      <button className="pointer-events-auto relative m-0 box-border flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-none bg-[#ffffff29] p-0 text-white no-underline opacity-100 shadow-none backdrop-blur-md transition-all duration-300 ease-in-out [-webkit-tap-highlight-color:transparent] hover:scale-105">
                        <BsGiftFill className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 h-screen w-full">
            <DisplayVideoView
              localUser={agora?.localUser}
              remoteUser={agora?.remoteUsers[0] ?? []}
              localVideoTrack={agora?.localVideoTrack}
              isVideoRemote={agora?.remoteUsers?.[0]?.hasVideo ?? true}
              isAudioRemote={agora?.remoteUsers?.[0]?.hasAudio ?? true}
              isVideoLocal={agora?.isLocalVideoMuted ?? true}
              isAudioLocal={agora?.isLocalAudioMuted ?? true}
              isMobile={isMobile}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageStreamVideo;
