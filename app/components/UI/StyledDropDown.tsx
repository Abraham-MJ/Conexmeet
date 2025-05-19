'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal } from 'lucide-react';

interface DropDownProps {
  items: { id: string; title: string; onClick: () => void }[];
}

export default function StyledDropDown({ items }: DropDownProps) {
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
        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border py-1 text-gray-500 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-gray-100"
        onClick={toggleDropdown}
      >
        <MoreHorizontal className="h-5 w-5 text-[#181a21]" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-6 w-72 overflow-hidden rounded-lg border bg-white duration-200 animate-in fade-in slide-in-from-top-5">
          <nav className="py-2">
            <ul>
              {items.map(({ id, onClick, title }) => {
                return (
                  <li className="cursor-pointer px-1" key={id}>
                    <div
                      className="flex items-center gap-3 rounded-md px-2 py-2 text-gray-700 transition-colors hover:bg-gray-100"
                      onClick={onClick}
                    >
                      <span>{title}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
}
