import React, { useState, useEffect, useRef, useId } from 'react';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

interface DateTimePickerProps {
  label?: string;
  value: string; // Expected format: YYYY-MM-DDTHH:MM
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  error,
}) => {
  const generatedId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Parse initial value
  const getInitialDate = (val: string) => {
    if (!val) return new Date();
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const [selectedDate, setSelectedDate] = useState<Date>(() => getInitialDate(value));
  const [viewDate, setViewDate] = useState<Date>(() => getInitialDate(value));

  // Sync state if value prop changes
  useEffect(() => {
    if (value) {
      const d = getInitialDate(value);
      setSelectedDate(d);
      setViewDate(d);
    }
  }, [value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatToDateTimeLocal = (date: Date): string => {
    const pad = (num: number) => String(num).padStart(2, '0');
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const h = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${y}-${m}-${d}T${h}:${min}`;
  };

  const handleDateSelect = (day: number) => {
    const nextDate = new Date(selectedDate);
    nextDate.setFullYear(viewDate.getFullYear());
    nextDate.setMonth(viewDate.getMonth());
    nextDate.setDate(day);
    setSelectedDate(nextDate);
    onChange(formatToDateTimeLocal(nextDate));
  };

  const handleTimeChange = (hours: number, minutes: number) => {
    const nextDate = new Date(selectedDate);
    nextDate.setHours(hours);
    nextDate.setMinutes(minutes);
    setSelectedDate(nextDate);
    onChange(formatToDateTimeLocal(nextDate));
  };

  const handleMonthNavigate = (direction: 'prev' | 'next') => {
    const nextViewDate = new Date(viewDate);
    if (direction === 'prev') {
      nextViewDate.setMonth(viewDate.getMonth() - 1);
    } else {
      nextViewDate.setMonth(viewDate.getMonth() + 1);
    }
    setViewDate(nextViewDate);
  };

  const setToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setViewDate(today);
    onChange(formatToDateTimeLocal(today));
  };

  // Helper to generate days of the month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
  const firstDay = getFirstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth());

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const formattedDisplay = () => {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div ref={containerRef} className="flex flex-col w-full gap-1.5 relative">
      {label && (
        <label htmlFor={generatedId} className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
      )}
      <div className="relative w-full flex items-center">
        <input
          id={generatedId}
          type="text"
          readOnly
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          placeholder="Pilih Tanggal dan Waktu"
          value={formattedDisplay()}
          className={`w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-950 shadow-sm transition-colors duration-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-blue-500 dark:focus:ring-blue-500 cursor-pointer pr-10 ${
            error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
          }`}
        />
        <div className="absolute right-3.5 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
          <CalendarIcon className="h-5 w-5" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-[100%] left-0 z-50 mt-2 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl shadow-zinc-200/50 dark:shadow-none backdrop-blur-xl w-[290px] animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-3.5">
            <button
              type="button"
              onClick={() => handleMonthNavigate('prev')}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-zinc-550 dark:text-zinc-400 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
              {months[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>
            <button
              type="button"
              onClick={() => handleMonthNavigate('next')}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-zinc-550 dark:text-zinc-400 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1 text-[11px] font-bold text-zinc-400 dark:text-zinc-500">
            <span>Min</span>
            <span>Sen</span>
            <span>Sel</span>
            <span>Rab</span>
            <span>Kam</span>
            <span>Jum</span>
            <span>Sab</span>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-center mb-3">
            {/* Pad leading empty slots */}
            {Array.from({ length: firstDay }, (_, i) => (
              <span key={`empty-${i}`} />
            ))}
            {/* Days list */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const isSelected =
                selectedDate.getDate() === day &&
                selectedDate.getMonth() === viewDate.getMonth() &&
                selectedDate.getFullYear() === viewDate.getFullYear();
              
              const isToday =
                new Date().getDate() === day &&
                new Date().getMonth() === viewDate.getMonth() &&
                new Date().getFullYear() === viewDate.getFullYear();

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDateSelect(day)}
                  className={`h-7.5 w-7.5 flex items-center justify-center rounded-lg text-xs font-semibold cursor-pointer transition-colors duration-150 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                      : isToday
                      ? 'border border-blue-500/50 text-blue-600 dark:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Time Picker Block */}
          <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800/80 mt-3 text-xs">
            <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
              <Clock className="h-4.5 w-4.5 text-zinc-400" />
              <span>Waktu</span>
            </div>
            <div className="flex items-center gap-1">
              <select
                value={selectedDate.getHours()}
                onChange={(e) => handleTimeChange(Number(e.target.value), selectedDate.getMinutes())}
                className="px-2 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-150 rounded-xl font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {String(i).padStart(2, '0')}
                  </option>
                ))}
              </select>
              <span className="font-bold text-zinc-400 dark:text-zinc-500">:</span>
              <select
                value={selectedDate.getMinutes()}
                onChange={(e) => handleTimeChange(selectedDate.getHours(), Number(e.target.value))}
                className="px-2 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-150 rounded-xl font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                {Array.from({ length: 60 }, (_, i) => (
                  <option key={i} value={i}>
                    {String(i).padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer controls */}
          <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
            <button
              type="button"
              onClick={setToday}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {error && <span className="text-sm text-red-650 dark:text-red-400">{error}</span>}
    </div>
  );
};
