'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  format,
  parse,
  setYear,
  setMonth,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MdEditCalendar } from 'react-icons/md';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

const months = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// Generate years from 1950 to current year
const currentYear = new Date().getFullYear();
const years = Array.from(
  { length: currentYear - 1949 },
  (_, i) => currentYear - i,
);

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
  const [currentMonth, setCurrentMonth] = useState(date || new Date());
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

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

  const handleDateSelect = (selectedDate: Date) => {
    setDate(selectedDate);
    setIsOpen(false);
  };

  const handleMonthChange = (monthIndex: string) => {
    setCurrentMonth(setMonth(currentMonth, parseInt(monthIndex)));
  };

  const handleYearChange = (year: string) => {
    setCurrentMonth(setYear(currentMonth, parseInt(year)));
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const newMonth =
        direction === 'prev'
          ? setMonth(prev, prev.getMonth() - 1)
          : setMonth(prev, prev.getMonth() + 1);
      return newMonth;
    });
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Add empty cells for days before month start
    const startDay = monthStart.getDay();
    const emptyCells = Array.from({ length: startDay }, (_, i) => (
      <div key={`empty-${i}`} className="h-8 w-8" />
    ));

    return (
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => (
          <div
            key={day}
            className="flex h-8 w-8 items-center justify-center text-xs font-medium text-gray-500"
          >
            {day}
          </div>
        ))}
        {emptyCells}
        {days.map((day) => (
          <button
            key={day.toISOString()}
            onClick={() => handleDateSelect(day)}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors duration-200 hover:bg-gray-100',
              isSameDay(day, date || new Date()) &&
                'bg-gradient-to-r from-[#f711ba] to-[#ff465d] text-white hover:opacity-90',
              isToday(day) &&
                !isSameDay(day, date || new Date()) &&
                'bg-blue-100 text-blue-600',
              !isSameMonth(day, currentMonth) && 'text-gray-300',
            )}
          >
            {format(day, 'd')}
          </button>
        ))}
      </div>
    );
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
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
            ref={triggerRef}
            type="button"
            variant={'outline'}
            className={cn(
              'flex h-12 w-full justify-start rounded-lg border px-4 py-4 font-latosans text-gray-700 shadow-none outline-none backdrop-blur-sm transition-all duration-200',
              error
                ? 'border-red-500 bg-red-50'
                : 'border-gray-300 bg-white/50 font-latosans',
            )}
          >
            <MdEditCalendar size={20} className="mr-2 text-gray-400" />
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
      <PopoverContent
        className="p-4"
        align="start"
        style={{ width: triggerRef.current?.offsetWidth || 'auto' }}
      >
        <div className="space-y-4">
          {/* Header with month/year selectors */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center space-x-2">
              <Select
                value={currentMonth.getMonth().toString()}
                onValueChange={handleMonthChange}
              >
                <SelectTrigger className="h-9 w-32 text-sm px-3 py-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={currentMonth.getFullYear().toString()}
                onValueChange={handleYearChange}
              >
                <SelectTrigger className="h-9 w-24 text-sm px-3 py-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-48">
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Calendar grid */}
          {renderCalendar()}
        </div>
      </PopoverContent>
    </Popover>
  );
};
