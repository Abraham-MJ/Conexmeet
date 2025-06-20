import React from 'react';
import { IoMdClose } from 'react-icons/io';
import StyledModal from '../../UI/StyledModal';
import { cn } from '@/lib/utils';
import { IoVideocamOffOutline } from 'react-icons/io5';
import { BellIcon } from 'lucide-react';

interface ModalChannelNotFoundProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  status: 'online' | 'in_call';
}

const ModalChannelNotFound: React.FC<ModalChannelNotFoundProps> = ({
  isOpen,
  onClose,
  name,
  status,
}) => {
  let icon, title, message, iconBgColor, buttonBgColor, buttonHoverBgColor;

  if (status === 'in_call') {
    icon = <IoVideocamOffOutline className="h-8 w-8 text-red-600" />;
    iconBgColor = 'bg-red-100';
    buttonBgColor = 'bg-red-600';
    buttonHoverBgColor = 'hover:bg-red-700';
    title = `${name} está en otra llamada`;
    message = (
      <>
        En este momento <span className="font-semibold">{name}</span> se
        encuentra ocupada. ¡No te preocupes! Podemos enviarte una notificación
        en cuanto termine su llamada y esté disponible.
      </>
    );
  } else {
    icon = <BellIcon className="h-8 w-8 text-gray-600" />;
    iconBgColor = 'bg-gray-100';
    buttonBgColor = 'bg-gray-600';
    buttonHoverBgColor = 'hover:bg-gray-700';
    title = `¡Te avisamos cuando ${name} esté disponible!`;
    message = (
      <>
        En este momento <span className="font-semibold">{name}</span> no se
        encuentra en línea. Podemos enviarte una notificación justo cuando se
        conecte.
      </>
    );
  }

  const handleNotifyClick = () => {
    onClose();
  };

  return (
    <StyledModal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      position="center"
      noClose
      noPadding
      width="500px"
    >
      <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white shadow-xl">
        <div
          className="absolute right-4 top-4 z-10 cursor-pointer rounded-full border p-3 transition-all duration-300 hover:scale-110"
          onClick={onClose}
        >
          <IoMdClose className="h-6 w-6 text-[#747474]" />
        </div>

        <div className="flex flex-col items-center gap-4 p-8 text-center">
          <div
            className={cn(
              'mb-2 flex h-16 w-16 items-center justify-center rounded-full',
              iconBgColor,
            )}
          >
            {icon}
          </div>

          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>

          <p className="text-base text-gray-600">{message}</p>

          <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row">
            <button
              onClick={handleNotifyClick}
              className={cn(
                'w-full rounded-lg px-6 py-3 text-base font-semibold text-white shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-opacity-50',
                buttonBgColor,
                buttonHoverBgColor,
              )}
            >
              Sí, avísame
            </button>

            <button
              onClick={onClose}
              className="w-full rounded-lg bg-gray-200 px-6 py-3 text-base font-semibold text-gray-700 transition-all duration-300 hover:bg-gray-300 focus:outline-none"
            >
              No, gracias
            </button>
          </div>
        </div>
      </div>
    </StyledModal>
  );
};

export default ModalChannelNotFound;
