'use client';

import { Plus } from 'lucide-react';
import React, { useState } from 'react';

const AddStoriesView = ({ handleOpen }: { handleOpen: () => void }) => {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl bg-white shadow-lg">
      <div
        className="flex h-full cursor-pointer select-none flex-col items-center justify-center bg-gradient-to-br from-[#fc3d6b] via-[#fd5b87] to-purple-500 p-4 text-white"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={handleOpen}
      >
        <div
          className="translate-z-0 mb-10 transform text-center"
          style={{ textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}
        >
          <h1 className="text-2xl font-medium">Agrega un video corto.</h1>
        </div>

        <button className="group relative" aria-label="Agregar video">
          <div
            className="flex h-24 w-24 items-center justify-center rounded-full bg-white bg-opacity-20 backdrop-blur-sm transition-all duration-300 md:mb-16"
            style={{
              boxShadow: isHovering
                ? '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1), 0 0 15px 5px rgba(252, 61, 107, 0.3)'
                : '0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1), 0 0 10px 3px rgba(252, 61, 107, 0.2)',
              transform: isHovering ? 'translateY(-5px)' : 'translateY(0)',
            }}
          >
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full bg-white transition-all duration-300"
              style={{
                boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.1)',
                transform: isHovering ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              <span
                className="text-4xl font-bold text-[#fc3d6b] transition-all duration-300"
                style={{
                  textShadow: isHovering
                    ? '0 0 10px rgba(252, 61, 107, 0.5)'
                    : 'none',
                  transform: isHovering ? 'scale(1.2)' : 'scale(1)',
                }}
              >
                <Plus className="h-6 w-6" />
              </span>
            </div>
          </div>
          <div
            className="absolute -bottom-4 left-0 h-12 w-24 scale-75 transform rounded-full bg-white bg-opacity-10 opacity-70"
            style={{ filter: 'blur(4px)' }}
          ></div>
        </button>

        <div
          className="translate-z-0 transform animate-float text-center"
          style={{
            textShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          <p className="flex items-center justify-center text-sm">
            <span
              className="mr-2 animate-sparkle text-yellow-300"
              style={{
                textShadow: '0 0 10px rgba(253, 224, 71, 0.7)',
              }}
            >
              ✨
            </span>
            Obtén puntos por likes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AddStoriesView;
