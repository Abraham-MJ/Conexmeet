import { useMobile } from '@/app/hooks/useMobile';
import { cn } from '@/lib/utils';
import React, { useRef } from 'react';
import { IoIosArrowBack } from 'react-icons/io';

const emojiShortcuts = [
  { emoji: '🌀', count: 11, color: 'bg-purple-100' },
  { emoji: '😎', count: 5, color: 'bg-yellow-100' },
  { emoji: '⭐', count: 5, color: 'bg-purple-100' },
  { emoji: '🌈', count: 5, color: 'bg-blue-100' },
  { emoji: '🌻', count: 7, color: 'bg-yellow-100' },
  { emoji: '🎈', count: 12, color: 'bg-purple-100' },
  { emoji: '🌹', count: 99, color: 'bg-pink-100' },
  { emoji: '🏈', count: 79, color: 'bg-red-100' },
  { emoji: '🍓', count: 59, color: 'bg-red-100' },
  { emoji: '🍾', count: 299, color: 'bg-yellow-100' },
  { emoji: '🐱', count: 49, color: 'bg-gray-100' },
  { emoji: '🐷', count: 199, color: 'bg-pink-100' },
  { emoji: '🐷', count: 199, color: 'bg-pink-100' },
  { emoji: '🐷', count: 199, color: 'bg-pink-100' },
  { emoji: '🐷', count: 199, color: 'bg-pink-100' },
  { emoji: '🐷', count: 199, color: 'bg-pink-100' },
  { emoji: '🐷', count: 199, color: 'bg-pink-100' },
  { emoji: '🐷', count: 199, color: 'bg-pink-100' },
];

const RewardsList = () => {
  const isMobile = useMobile();
  const emojiRowRef = useRef<HTMLDivElement>(null);

  const scrollEmojiRow = (direction: 'left' | 'right') => {
    if (emojiRowRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      emojiRowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative mb-1 flex items-center justify-between px-2 py-1">
      <button
        onClick={() => scrollEmojiRow('left')}
        className={cn(
          'ml-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-500 hover:bg-gray-50',
          !isMobile && 'border',
        )}
        aria-label="Desplazar izquierda"
      >
        <IoIosArrowBack className="h-6 w-6" />
      </button>

      <div
        ref={emojiRowRef}
        className="scrollbar-hide flex w-[90%] space-x-5 overflow-x-hidden px-4 py-1"
      >
        {emojiShortcuts.map((item, index) => (
          <div
            key={index}
            className="flex cursor-pointer flex-col items-center"
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${item.color}`}
            >
              <span role="img" aria-label="emoji" className="text-xl">
                {item.emoji}
              </span>
            </div>
            <span className="mt-1 text-xs font-medium text-amber-500">
              {item.count}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={() => scrollEmojiRow('right')}
        className={cn(
          'ml-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-500 hover:bg-gray-50',
          !isMobile && 'border',
        )}
        aria-label="Desplazar derecha"
      >
        <IoIosArrowBack className="h-6 w-6 rotate-180" />
      </button>
    </div>
  );
};

export default RewardsList;
