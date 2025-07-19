import React from 'react';
import { IoMicOffOutline, IoMicOutline } from 'react-icons/io5';

interface ControlsStreamProps {
  isLocalAudioMuted: boolean;
  toggleLocalAudio: () => Promise<void>;
}

const ControlsStream: React.FC<ControlsStreamProps> = ({
  isLocalAudioMuted,
  toggleLocalAudio,
}) => {
  return (
    <div className="mb-6 flex flex-shrink-0 items-center justify-end gap-4 pe-6">
      <button
        onClick={toggleLocalAudio}
        className="pointer-events-auto relative m-0 box-border flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-none bg-[#ffffff29] text-base text-white no-underline opacity-100 outline-none backdrop-blur-[12px] transition duration-300 ease-in-out hover:scale-105 hover:cursor-pointer hover:bg-[#ffffff3d]"
      >
        {isLocalAudioMuted ? (
          <IoMicOffOutline className="h-8 w-8" />
        ) : (
          <IoMicOutline className="h-8 w-8" />
        )}
      </button>
    </div>
  );
};

export default ControlsStream;
