'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, Building2 } from 'lucide-react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed left-0 right-0 top-0 z-50 backdrop-blur-md">
      <div className="mx-auto max-w-[1580px] px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center py-2">
            <Link href="/" className="block">
              <Image
                src="/images/conexmeet.png"
                alt="Conexmeet"
                width={140}
                height={40}
                sizes="140px"
                style={{ 
                  width: 'auto', 
                  height: '40px',
                  maxWidth: '140px'
                }}
              />
            </Link>
          </div>

          <div className="hidden items-center space-x-6 md:flex">
            <Link
              href={'https://app.conexmeet.live/login'}
              target="_blank"
              className="flex items-center px-4 py-2 font-medium text-gray-600 transition-colors duration-200 hover:text-gray-900"
            >
              <Building2 className="mr-2 h-4 w-4 text-gray-400" />
              Agencias
            </Link>

            <Link
              href="/auth/sign-in"
              className="inline-flex items-center rounded-full bg-gradient-to-r from-[#f711ba] to-[#ff465d] px-6 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:from-[#ff465d] hover:to-[#f711ba] hover:shadow-lg"
            >
              Iniciar Sesión / Registrarse
            </Link>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="rounded-md p-2 text-gray-600 transition-colors duration-200 hover:text-gray-900"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="border-t border-gray-100 py-4 md:hidden">
            <div className="flex flex-col space-y-3">
              <button className="flex items-center rounded-lg px-4 py-3 text-left font-medium text-gray-600 transition-all duration-200">
                <Building2 className="mr-3 h-4 w-4 text-gray-400" />
                Agencias
              </button>

              <Link
                href="/auth/sign-in"
                className="mx-2 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#f711ba] to-[#ff465d] px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:shadow-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                Iniciar Sesión / Registrarse
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
