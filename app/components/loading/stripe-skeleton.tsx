import React from 'react';

interface StripeSkeletonLoaderProps {
  className?: string;
}

const StripeSkeletonLoader: React.FC<StripeSkeletonLoaderProps> = ({
  className = '',
}) => {
  return (
    <div
      className={`rounded-md p-4 ${className}`}
      aria-label="Cargando formulario de pago"
      role="status"
    >
      <div className="animate-pulse space-y-5">
        <div className="h-[50px] w-full rounded-xl bg-gray-300 bg-gradient-to-t from-gray-200 to-transparent"></div>

        <div className="flex space-x-4">
          <div className="h-[50px] flex-1 rounded-xl bg-gray-300 bg-gradient-to-t from-gray-200 to-transparent"></div>
          <div className="h-[50px] flex-1 rounded-xl bg-gray-300 bg-gradient-to-t from-gray-200 to-transparent"></div>
        </div>

        <div className="h-[50px] w-full rounded-xl bg-gray-300 bg-gradient-to-t from-gray-200 to-transparent"></div>
      </div>
    </div>
  );
};

export default StripeSkeletonLoader;
