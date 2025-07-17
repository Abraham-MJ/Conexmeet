'use client';

import React, {
  ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import StyledModal from '../../UI/StyledModal';
import { cn } from '@/lib/utils';
import { IoMdClose } from 'react-icons/io';
import { Trash2, UploadCloud } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useVideoRouletteFemale } from '@/app/hooks/api/useVideoRouletteFemale';

interface ModalUploadStoryProps {
  isOpen: boolean;
  onClose: () => void;
}

const ModalUploadStory: React.FC<ModalUploadStoryProps> = ({
  isOpen,
  onClose,
}) => {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadStory, isLoadingUpload } = useVideoRouletteFemale();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (videoSrc) {
        URL.revokeObjectURL(videoSrc);
      }
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setVideoFile(file);
    }
  };

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const resetState = useCallback(() => {
    if (videoSrc) {
      URL.revokeObjectURL(videoSrc);
    }
    setVideoSrc(null);
    setVideoFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [videoSrc]);

  const handleUpload = async () => {
    if (videoFile) {
      const result = await uploadStory(videoFile);
      if (result.success) {
        console.log('Historia subida con éxito:', result.message);
        onClose();
      } else {
        console.error('Error al subir historia:', result.message);
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    );
  };

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen, resetState]);

  return (
    <StyledModal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      position="center"
      noClose
      noPadding
      width="40%"
    >
      <div
        className={cn(
          'relative h-full w-full overflow-hidden rounded-2xl bg-white shadow-xl',
        )}
      >
        <div className="flex items-center justify-between border-b p-4 pb-4">
          <span className="text-lg font-medium">Subir historia:</span>
          <div
            className="h-12 w-12 cursor-pointer rounded-full border p-3 transition-all duration-300 hover:scale-110"
            onClick={onClose}
          >
            <IoMdClose className="h-6 w-6 text-[#747474]" />
          </div>
        </div>
        <div className="max-h-[630px] p-4">
          {!videoSrc ? (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="video/*"
                className="hidden"
                disabled={isLoadingUpload}
              />
              <div
                onClick={isLoadingUpload ? undefined : handleChooseFile}
                className={cn(
                  'mt-2 flex h-[300px] w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-colors',
                  isLoadingUpload
                    ? 'cursor-not-allowed opacity-60'
                    : 'hover:border-[#ff465d] hover:bg-[#ff465d]/5',
                )}
              >
                <div className="text-center">
                  <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    <span className="font-semibold text-[#ff465d]">
                      Haz clic para subir
                    </span>{' '}
                    o arrastra y suelta
                  </p>
                  <p className="text-xs text-gray-500">
                    MP4, MOV, AVI (max. 500MB)
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="group relative aspect-video w-full overflow-hidden rounded-lg">
                <video
                  src={videoSrc}
                  controls
                  className="h-full w-full object-cover"
                />
                <button
                  onClick={resetState}
                  className={cn(
                    'absolute right-2 top-2 z-10 rounded-full bg-black/50 p-1.5 text-white transition-opacity',
                    isLoadingUpload
                      ? 'cursor-not-allowed opacity-0'
                      : 'opacity-0 group-hover:opacity-100',
                  )}
                  aria-label="Quitar video"
                  disabled={isLoadingUpload}
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="rounded-md bg-gray-100 p-3 text-sm text-gray-700">
                <p className="truncate font-medium">{videoFile?.name}</p>
                <p className="text-gray-500">
                  {videoFile ? formatFileSize(videoFile.size) : ''}
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  className={cn(
                    'w-full rounded-xl border bg-white py-7 text-lg font-medium text-gray-500 transition-all duration-300 hover:bg-gray-50',
                  )}
                  disabled={isLoadingUpload}
                  onClick={resetState}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className={cn(
                    'w-full rounded-xl bg-[linear-gradient(308.52deg,#f711ba_4.3%,#ff465d_95.27%)] py-7 text-lg font-medium text-white transition-all duration-300 hover:bg-[#e8356a]',
                  )}
                  disabled={!videoFile || isLoadingUpload}
                  onClick={handleUpload}
                >
                  {isLoadingUpload ? (
                    <div className="text-md flex items-center justify-center font-latosans">
                      Cargando
                      {[1, 2, 3].map((index) => (
                        <motion.span
                          key={index}
                          animate={{ opacity: [0, 1, 1, 0] }}
                          transition={{
                            repeat: Infinity,
                            duration: 1.5,
                            delay: index * 0.2,
                          }}
                        >
                          {' '}
                          .{' '}
                        </motion.span>
                      ))}
                    </div>
                  ) : (
                    'Subir'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </StyledModal>
  );
};

export default ModalUploadStory;
