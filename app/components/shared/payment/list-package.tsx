import { Package } from '@/app/types/package';
import React from 'react';

interface PackagesProps {
  packages: Package[];
  setSelectedPackage: (pkg: Package) => void;
  selectedPackage: Package;
  handlePayment: () => void;
}

const ListPackagesView: React.FC<PackagesProps> = ({
  packages,
  setSelectedPackage,
  selectedPackage,
  handlePayment,
}) => {
  return (
    <>
      <button className="glow-border -mx-4 transform cursor-default rounded-e-full bg-gradient-to-r from-orange-500 to-red-500 px-4 py-4 text-xl font-semibold text-white">
        ¡Oferta Especial de Primera Vez! 🎉
      </button>
      <div className="py-8">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-2">
          {packages?.map((pkg, index) => (
            <div
              key={pkg.id}
              className={`package-card relative cursor-pointer rounded-2xl border border-orange-200/50 bg-gradient-to-b from-orange-300/90 to-orange-400/90 p-3 shadow-xl backdrop-blur-sm transition-all duration-300 hover:scale-105 ${selectedPackage?.id === pkg.id && 'scale'}`}
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => {
                setSelectedPackage(pkg);
              }}
            >
              <div className="coin-container mb-3 flex justify-center">
                <div className="relative">
                  <div className="coin-3d flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 shadow-lg">
                    <span className="text-2xl">💰</span>
                  </div>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/30 to-transparent"></div>
                </div>
              </div>

              <div className="mb-2 text-center">
                <div className="flex items-center justify-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-400 shadow-sm"></div>
                  <span className="text-sm font-medium text-white drop-shadow-md">
                    {pkg.description}
                  </span>
                </div>
              </div>

              <div className="text-center">
                <div className="text-lg font-medium text-white">
                  ${pkg.price}
                </div>
              </div>

              {selectedPackage?.id === pkg.id && (
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/0 to-white/40 opacity-100 transition-opacity duration-300"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handlePayment}
        disabled={!selectedPackage}
        className={`group relative w-full transform overflow-hidden rounded-full transition-all duration-500 ${
          selectedPackage
            ? 'border bg-gradient-to-b from-orange-300/90 to-orange-400/90 hover:scale-[1.02] hover:shadow-gray-500/25 active:scale-[0.98]'
            : 'opacity-60'
        }`}
      >
        <div className="relative flex items-center justify-center gap-3 px-2 py-3">
          {selectedPackage ? (
            <>
              <div className="flex flex-col items-center">
                <span className="font-medium tracking-wide text-white">
                  Continuar Compra
                </span>
                <span className="text-sm font-medium text-white">
                  ${selectedPackage?.price} - {selectedPackage?.description}
                </span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-lg font-medium text-white/80">
                Selecciona un Paquete
              </span>
              <span className="text-sm text-white/60">
                Elige tu paquete de monedas para continuar
              </span>
            </div>
          )}
        </div>
      </button>
    </>
  );
};

export default ListPackagesView;
