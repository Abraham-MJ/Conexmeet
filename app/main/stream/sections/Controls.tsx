import React from 'react';
import { ToggleContactApiResponse } from '@/app/hooks/api/useAddContacts';
import useFeatures from '@/app/hooks/api/useFeatures';
import { cn } from '@/lib/utils';
import { IoMicOffOutline, IoMicOutline } from 'react-icons/io5';
import { RiContactsLine } from 'react-icons/ri';

interface ControlsStreamProps {
  isLocalAudioMuted: boolean;
  toggleLocalAudio: () => Promise<void>;
  toggleContact: (userId: number | string) => Promise<ToggleContactApiResponse | null>;
  isLoading: boolean;
  remoteUser: any;
}

const ControlsStream: React.FC<ControlsStreamProps> = ({
  isLocalAudioMuted,
  toggleLocalAudio,
  toggleContact,
  isLoading,
  remoteUser
}) => {
  const {
    contacts,
  } = useFeatures({ activeTabs: 'contacts' });

  const findContacts = contacts?.data?.find((contact: any) => contact?.user?.id === remoteUser?.user_id);

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
      {remoteUser.length !== 0 && <button
        onClick={() => {
          toggleContact(remoteUser.user_id)
        }}
        disabled={isLoading || findContacts !== undefined}
        className={cn("pointer-events-auto relative m-0 box-border flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-none  text-base text-white no-underline opacity-100 outline-none backdrop-blur-[12px] transition duration-300 ease-in-out  ", findContacts === undefined ? 'bg-[#ffffff29] hover:bg-[#ffffff3d] hover:scale-105 hover:cursor-pointer' : 'bg-[linear-gradient(308.52deg,#f711ba_4.3%,#ff465d_95.27%)]')}
      >
        {!isLoading ? <RiContactsLine className="h-6 w-6" /> : <div role="status">
          <svg aria-hidden="true" className="w-8 h-8 text-gray-200 animate-spin fill-[#fff]" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
          </svg>
        </div>}
      </button>}
    </div>
  );
};

export default ControlsStream;
