'use client';

import { cn } from '@/lib/utils';
import { useUser } from '@/app/context/useClientContext';
import FemaleViewVideo from './sections/female-section';
import MaleViewVideo from './sections/male-section';

export default function VideoRoulettePage() {
  const { state } = useUser();

  return (
    <div className="flex h-[calc(100%-64px)] w-full items-center justify-center">
      <div
        className={cn(
          'relative h-[80%] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-[0px_20px_46px_0px_#B1B1B1]',
        )}
      >
        {state?.user?.gender === 'female' && <FemaleViewVideo />}

        {state?.user?.gender === 'male' && <MaleViewVideo />}
      </div>
    </div>
  );
}
