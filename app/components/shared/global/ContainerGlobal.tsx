import { useMobile } from '@/app/hooks/useMobile';
import { cn } from '@/lib/utils';
import React from 'react';

const ContainerGlobal = ({
  children,
  classNames,
}: {
  children: React.ReactNode;
  classNames?: string;
}) => {
  const isMobile = useMobile(920);

  return (
    <div
      className={cn(
        isMobile ? 'py-[80px]' : 'pt-[80px]',
        'h-full w-full',
        classNames,
      )}
    >
      {children}
    </div>
  );
};

export default ContainerGlobal;
