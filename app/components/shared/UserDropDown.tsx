'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User, LogOut, CircleUserRound, Menu } from 'lucide-react';
import { useUser } from '@/app/context/useClientContext';
import useLogin from '@/app/hooks/api/useLogin';
import { cn } from '@/lib/utils';

export default function UserDropdown() {
  const { state } = useUser();
  const { logout } = useLogin();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="flex h-10 cursor-pointer items-center rounded-full border bg-[#00000014] px-3 py-1 backdrop-blur-sm transition-all duration-300 hover:scale-105"
        onClick={toggleDropdown}
      >
        <Menu className="h-5 w-5 text-[#181a21]" />
        <div className="mx-2 h-5 w-px bg-[#181a21]" />
        {state?.user?.profile_photo_path ? (
          <img
            src={
              state?.user?.profile_photo_path
                ? state?.user?.profile_photo_path
                : '/images/not-found.svg'
            }
            alt={'Profile'}
            className="h-7 w-7 rounded-full object-cover"
          />
        ) : (
          <CircleUserRound className="h-7 w-7 stroke-[1] text-gray-500" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-6 w-72 overflow-hidden rounded-lg border bg-white shadow-lg duration-200 animate-in fade-in slide-in-from-top-5">
          <div className="p-4 text-white">
            <div className="flex flex-col items-center gap-3">
              <div className="relative rounded-full">
                <img
                  src={
                    state?.user?.profile_photo_path
                      ? state?.user?.profile_photo_path
                      : '/images/not-found.svg'
                  }
                  alt={'Profile'}
                  className="h-20 w-20 rounded-full object-cover"
                />
              </div>
              <div className="flex flex-col text-center">
                <span className="text-sm font-medium text-gray-700">
                  {state?.user?.name}
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {state?.user?.email}
                </span>
              </div>
            </div>
          </div>
          <nav className="border-t py-2">
            <ul>
              <li className="px-2">
                <Link
                  href="/main/profile"
                  className="flex items-center gap-3 rounded-md px-2 py-2 text-gray-700 transition-colors hover:bg-gray-100"
                  onClick={() => setIsOpen(false)}
                >
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full',
                      state?.user?.gender === 'male'
                        ? 'bg-[linear-gradient(308.52deg,#f711ba_4.3%,#ff465d_95.27%)] text-white'
                        : 'bg-[linear-gradient(308.52deg,#f711ba_4.3%,#ff465d_95.27%)] text-white',
                    )}
                  >
                    <User className="h-4 w-4" />
                  </div>
                  <span>Perfil</span>
                </Link>
              </li>
              <li className="px-2">
                <Link
                  href="*"
                  className="flex items-center gap-3 rounded-md px-2 py-2 text-gray-700 transition-colors hover:bg-gray-100"
                  onClick={logout}
                >
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full',
                      state?.user?.gender === 'male'
                        ? 'bg-[linear-gradient(308.52deg,#f711ba_4.3%,#ff465d_95.27%)] text-white'
                        : 'bg-[linear-gradient(308.52deg,#f711ba_4.3%,#ff465d_95.27%)] text-white',
                    )}
                  >
                    <LogOut className="h-4 w-4" />
                  </div>
                  <span>Cerrar Sesión</span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
}
