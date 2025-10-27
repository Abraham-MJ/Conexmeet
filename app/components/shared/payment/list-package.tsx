import { Package } from '@/app/types/package';
import React from 'react';
import { useTranslation } from '@/app/hooks/useTranslation';

interface PackagesProps {
  packages: Package[];
  setSelectedPackage: (pkg: Package) => void;
  selectedPackage: Package;
  handlePayment: () => void;
  isLoading?: boolean;
}

const PackageSkeleton: React.FC = () => (
  <div className="package-card relative rounded-2xl border border-orange-200/50 bg-gradient-to-b from-orange-300/90 to-orange-400/90 p-3 sm:p-4 shadow-xl backdrop-blur-sm animate-pulse">
    <div className="coin-container mb-2 flex justify-center">
      <div className="relative">
        <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-white/20"></div>
      </div>
    </div>

    <div className="mb-2 text-center">
      <div className="flex items-center justify-center gap-1">
        <div className="h-3 w-3 rounded-full bg-white/20"></div>
        <div className="h-4 w-16 bg-white/20 rounded"></div>
      </div>
    </div>

    <div className="text-center">
      <div className="h-6 w-12 bg-white/20 rounded mx-auto"></div>
    </div>
  </div>
);

const ListPackagesView: React.FC<PackagesProps> = ({
  packages,
  setSelectedPackage,
  selectedPackage,
  handlePayment,
  isLoading = false,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <button className="glow-border -mx-4 transform cursor-default rounded-e-full bg-gradient-to-r from-orange-500 to-red-500 px-4 py-4 text-xl font-semibold text-white">
        {t('payment.specialOffer')} 🎉
      </button>
      <div className="py-8">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* Show 4 skeleton items */}
            {Array.from({ length: 4 }).map((_, index) => (
              <PackageSkeleton key={index} />
            ))}
          </div>
        ) : !packages || packages.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-white/80 text-lg mb-2">No hay paquetes disponibles</div>
            <div className="text-white/60 text-sm">Por favor, intenta más tarde</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {packages.map((pkg, index) => (
              <div
                key={pkg.id}
                className={`package-card relative cursor-pointer rounded-2xl border border-orange-200/50 bg-gradient-to-b from-orange-300/90 to-orange-400/90 p-3 sm:p-4 shadow-xl backdrop-blur-sm transition-all duration-300 hover:scale-105 ${selectedPackage?.id === pkg.id && 'scale'}`}
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => {
                  setSelectedPackage(pkg);
                }}
              >
                <div className="coin-container mb-2 flex justify-center">
                  <div className="relative">
                    <div className="coin-3d flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 shadow-lg">
                      <span className="text-lg sm:text-2xl">💰</span>
                    </div>
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/30 to-transparent"></div>
                  </div>
                </div>

                <div className="mb-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <div className="h-3 w-3 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-400 shadow-sm"></div>
                    <span className="text-sm sm:text-base font-medium text-white drop-shadow-md">
                      {pkg.description}
                    </span>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-lg sm:text-xl font-medium text-white">
                    ${pkg.price}
                  </div>
                </div>

                {selectedPackage?.id === pkg.id && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/0 to-white/40 opacity-100 transition-opacity duration-300"></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={handlePayment}
        disabled={!selectedPackage || isLoading}
        className={`group relative w-full transform overflow-hidden rounded-full transition-all duration-500 ${selectedPackage && !isLoading
          ? 'border bg-gradient-to-b from-orange-300/90 to-orange-400/90 hover:scale-[1.02] hover:shadow-gray-500/25 active:scale-[0.98]'
          : 'opacity-60'
          }`}
      >
        <div className="relative flex items-center justify-center gap-3 px-2 py-3">
          {isLoading ? (
            <div className="flex flex-col items-center">
              <span className="text-lg font-medium text-white/80">
                Cargando paquetes...
              </span>
              <span className="text-sm text-white/60">
                Por favor espera
              </span>
            </div>
          ) : selectedPackage ? (
            <>
              <div className="flex flex-col items-center">
                <span className="font-medium tracking-wide text-white">
                  {t('payment.continuePurchase')}
                </span>
                <span className="text-sm font-medium text-white">
                  ${selectedPackage?.price} - {selectedPackage?.description}
                </span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-lg font-medium text-white/80">
                {t('payment.selectPackage')}
              </span>
              <span className="text-sm text-white/60">
                {t('payment.selectPackageDescription')}
              </span>
            </div>
          )}
        </div>
      </button>
    </>
  );
};

export default ListPackagesView;
