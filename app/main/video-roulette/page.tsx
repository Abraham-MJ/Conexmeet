'use client';

import { cn } from '@/lib/utils';
import { useUser } from '@/app/context/useClientContext';
import FemaleViewVideo from './sections/female-section';
import MaleViewVideo from './sections/male-section';
import ContainerGlobal from '@/app/components/shared/global/ContainerGlobal';

export default function VideoRoulettePage() {
  const { state } = useUser();

  return (
    <ContainerGlobal>
      <div className={cn('relative h-full w-full overflow-hidden bg-white')}>
        {state?.user?.gender === 'female' && <FemaleViewVideo />}

        {state?.user?.gender === 'male' && <MaleViewVideo />}
      </div>
    </ContainerGlobal>
  );
}
