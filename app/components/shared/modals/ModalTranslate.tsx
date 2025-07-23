import React from 'react';
import StyledModal from '../../UI/StyledModal';
import { IoMdClose } from 'react-icons/io';

const ModalTranslate = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
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
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <h2 className="mb-3 text-start text-2xl font-bold text-gray-800">
            Elige un idoma
          </h2>

          <div className="flex w-full flex-col gap-3 py-8">
            <button className="rounded-lg bg-[linear-gradient(308.52deg,#f711ba_4.3%,#ff465d_95.27%)] p-4 font-semibold text-white">
              Español
            </button>
            <button className="rounded-lg bg-[#F0F0F0] p-4 text-[#747474]">
              English
            </button>
          </div>
        </div>
      </div>
    </StyledModal>
  );
};

export default ModalTranslate;
