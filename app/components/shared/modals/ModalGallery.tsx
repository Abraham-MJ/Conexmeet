'use client';

import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface ModalGalleryProps {
  onClose: () => void;
  images: string[];
  initialIndex: number;
}

const ModalGallery: React.FC<ModalGalleryProps> = ({
  onClose,
  images,
  initialIndex,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex: number) =>
      prevIndex > 0 ? prevIndex - 1 : images.length - 1,
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex < images.length - 1 ? prevIndex + 1 : 0,
    );
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="animate-fade-in fixed inset-0 -top-4 z-50 flex items-center justify-center bg-black/80">
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/80"
      >
        <X className="h-6 w-6" />
      </button>

      {images.length > 1 && (
        <button
          onClick={goToPrevious}
          className="absolute left-4 z-50 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/80"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>
      )}

      <div className="relative flex h-full max-h-[90vh] w-full max-w-4xl items-center justify-center p-4">
        <img
          src={images[currentIndex] || '/placeholder.svg'}
          alt={`Imagen ${currentIndex + 1} de ${images.length}`}
          className="max-h-full max-w-full rounded-lg object-contain"
        />
      </div>

      {images.length > 1 && (
        <button
          onClick={goToNext}
          className="absolute right-4 z-50 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/80"
        >
          <ChevronRight className="h-8 w-8" />
        </button>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-4 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
};

export default ModalGallery;
