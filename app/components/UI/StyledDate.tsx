'use client';

import React, { useEffect, useState } from 'react';
import { format, parse } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { MdEditCalendar } from 'react-icons/md';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { itemVariants } from '@/app/utils/animations';
import { motion } from 'framer-motion';

interface StyledInputProps {
  label?: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  value: string;
  name: string;
  error?: string;
  placeholder: string;
  onFocus: () => void;
}

export const StyledDate: React.FC<StyledInputProps> = ({
  label,
  handleChange,
  value,
  name,
  error,
  placeholder,
  onFocus,
}) => {
  const [date, setDate] = useState<Date | undefined>(
    value ? parse(value, 'yyyy/MM/dd', new Date()) : undefined,
  );

  useEffect(() => {
    if (date) {
      onFocus();
      const formattedDate = format(date, 'yyyy/MM/dd');

      handleChange({
        target: {
          name,
          value: formattedDate,
        },
      } as React.ChangeEvent<HTMLInputElement>);
    }
  }, [date]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <motion.div
          className="relative flex h-[68px] flex-col"
          variants={itemVariants}
        >
          <label
            htmlFor={name}
            className="mb-1 font-latosans text-sm font-medium text-gray-700"
          >
            {label || 'Fecha de nacimiento'}
          </label>
          <Button
            type="button"
            variant={'outline'}
            className={cn(
              'flex h-12 w-full justify-start rounded-lg border px-4 py-4 font-latosans text-gray-700 shadow-none outline-none backdrop-blur-sm transition-all duration-200',
              error
                ? 'border-red-500 bg-red-50'
                : 'border-gray-300 bg-white/50 font-latosans',
            )}
          >
            <MdEditCalendar size={40} className="text-gray-400" />
            {date ? (
              <span>{format(date, 'yyyy/MM/dd')}</span>
            ) : (
              <span className="font-latosans font-medium text-gray-400">
                {placeholder}
              </span>
            )}
          </Button>
          {error && (
            <p className="font-latosans text-sm text-red-500">{error}</p>
          )}
        </motion.div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date} onSelect={setDate} />
      </PopoverContent>
    </Popover>
  );
};
