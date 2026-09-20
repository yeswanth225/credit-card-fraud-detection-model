import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Check,
  RotateCcw,
} from 'lucide-react';
import {
  MONTH_NAMES,
  MONTH_SHORT_NAMES,
  DAY_NAMES,
  formatDisplayDate,
  formatFullDate,
  isSameDay,
  buildCalendarDays,
  CalendarDayItem,
} from '../utils/dateUtils';
import { Transaction } from '../types';

interface DatePickerPopoverProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date | null) => void;
  transactions: Transaction[];
  className?: string;
}

export const DatePickerPopover: React.FC<DatePickerPopoverProps> = ({
  selectedDate,
  onSelectDate,
  transactions,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMonthYearPickerOpen, setIsMonthYearPickerOpen] = useState(false);

  // Reference for the today date (e.g. 9 Sep 2026 or current browser time)
  const today = useMemo(() => new Date(), []);

  // View year and month being displayed in the calendar
  const [viewYear, setViewYear] = useState<number>(() => {
    return selectedDate ? selectedDate.getFullYear() : today.getFullYear();
  });
  const [viewMonth, setViewMonth] = useState<number>(() => {
    return selectedDate ? selectedDate.getMonth() : today.getMonth();
  });

  // Focused date for keyboard arrow navigation
  const [focusedDate, setFocusedDate] = useState<Date>(() => {
    return selectedDate ? new Date(selectedDate) : new Date(today);
  });

  // Prefers reduced motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // When selectedDate changes externally, sync view if popover is opened
  useEffect(() => {
    if (selectedDate) {
      setViewYear(selectedDate.getFullYear());
      setViewMonth(selectedDate.getMonth());
      setFocusedDate(new Date(selectedDate));
    }
  }, [selectedDate]);

  // Map of date string -> count of transactions on that day
  const activeDatesMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of transactions) {
      const d = new Date(tx.timestamp);
      if (!isNaN(d.getTime())) {
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        map.set(key, (map.get(key) || 0) + 1);
      }
    }
    return map;
  }, [transactions]);

  // Build the day items for the current viewMonth / viewYear
  const calendarDays = useMemo(() => {
    return buildCalendarDays(viewYear, viewMonth, selectedDate, today, activeDatesMap);
  }, [viewYear, viewMonth, selectedDate, today, activeDatesMap]);

  // Click outside handling
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerButtonRef = useRef<HTMLButtonElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsMonthYearPickerOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        setIsMonthYearPickerOpen(false);
        triggerButtonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Arrow navigation within calendar day grid
  const handleGridKeyDown = (e: React.KeyboardEvent) => {
    let nextDate: Date | null = null;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      nextDate = new Date(focusedDate);
      nextDate.setDate(nextDate.getDate() - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextDate = new Date(focusedDate);
      nextDate.setDate(nextDate.getDate() + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      nextDate = new Date(focusedDate);
      nextDate.setDate(nextDate.getDate() - 7);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      nextDate = new Date(focusedDate);
      nextDate.setDate(nextDate.getDate() + 7);
    } else if (e.key === 'PageUp') {
      e.preventDefault();
      nextDate = new Date(focusedDate);
      nextDate.setMonth(nextDate.getMonth() - 1);
    } else if (e.key === 'PageDown') {
      e.preventDefault();
      nextDate = new Date(focusedDate);
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelectDay(focusedDate);
      return;
    }

    if (nextDate) {
      setFocusedDate(nextDate);
      if (nextDate.getFullYear() !== viewYear || nextDate.getMonth() !== viewMonth) {
        setViewYear(nextDate.getFullYear());
        setViewMonth(nextDate.getMonth());
      }
    }
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleSelectDay = (date: Date) => {
    onSelectDate(date);
    setIsOpen(false);
    setIsMonthYearPickerOpen(false);
    triggerButtonRef.current?.focus();
  };

  const handleClearDate = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onSelectDate(null);
    setIsOpen(false);
    setIsMonthYearPickerOpen(false);
    triggerButtonRef.current?.focus();
  };

  const handleJumpToToday = () => {
    handleSelectDay(new Date(today));
  };

  // Available selectable years in quick selector
  const availableYears = useMemo(() => {
    const currentY = today.getFullYear();
    return [currentY - 2, currentY - 1, currentY, currentY + 1];
  }, [today]);

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* TRIGGER BUTTON */}
      <div className="flex items-center">
        <button
          ref={triggerButtonRef}
          type="button"
          onClick={() => {
            setIsOpen((prev) => !prev);
            setIsMonthYearPickerOpen(false);
          }}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          aria-label={
            selectedDate
              ? `Filter by date, currently selected ${formatDisplayDate(selectedDate)}`
              : 'Filter by date, currently showing all dates'
          }
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-150 cursor-pointer ${
            selectedDate
              ? 'bg-[#1C1C28] border-[#6366F1]/50 text-white shadow-xs'
              : 'bg-[#141418] hover:bg-[#1A1A22] text-[#D0D0DC] hover:text-white border-[#23232A]'
          }`}
        >
          <CalendarIcon
            className={`w-3.5 h-3.5 transition-colors ${
              selectedDate ? 'text-[#818CF8]' : 'text-[#88889C]'
            }`}
          />
          <span className="font-mono">
            {selectedDate ? formatDisplayDate(selectedDate) : 'All dates'}
          </span>
          <ChevronDown
            className={`w-3 h-3 text-[#707084] transition-transform duration-150 ${
              isOpen ? 'rotate-180 text-white' : ''
            }`}
          />
        </button>

        {/* Clear (x) button when a date is selected */}
        {selectedDate && (
          <button
            type="button"
            onClick={handleClearDate}
            aria-label="Clear date filter and view all dates"
            title="Clear date filter"
            className="ml-1 p-1 rounded-md text-[#88889C] hover:text-white hover:bg-[#20202C] transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* FLOATING CALENDAR POPOVER */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.96, y: -4 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -4 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.18,
              ease: [0.16, 1, 0.3, 1], // ease-out-expo timing (~200ms)
            }}
            role="dialog"
            aria-label="Calendar date picker"
            className="absolute z-50 left-0 mt-2 w-[310px] rounded-xl bg-[#131316] border border-[#23232A] p-3.5 shadow-2xl shadow-black/80 backdrop-blur-md focus:outline-none"
          >
            {/* MONTH / YEAR HEADER */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1E1E26]">
              {/* Previous Month */}
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label="Previous month"
                className="p-1 rounded-lg text-[#8E8EA2] hover:text-white hover:bg-[#1E1E28] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Month / Year Label with Quick Jump Trigger */}
              <button
                type="button"
                onClick={() => setIsMonthYearPickerOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold text-white hover:bg-[#1C1C26] transition-colors cursor-pointer"
                title="Click to jump to month or year"
                aria-label={`Current view ${MONTH_NAMES[viewMonth]} ${viewYear}. Click to jump to month or year.`}
              >
                <span>{MONTH_NAMES[viewMonth]} {viewYear}</span>
                <ChevronDown
                  className={`w-3 h-3 text-[#707084] transition-transform duration-150 ${
                    isMonthYearPickerOpen ? 'rotate-180 text-[#818CF8]' : ''
                  }`}
                />
              </button>

              {/* Next Month */}
              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Next month"
                className="p-1 rounded-lg text-[#8E8EA2] hover:text-white hover:bg-[#1E1E28] transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* QUICK MONTH / YEAR JUMP SELECTOR OVERLAY */}
            {isMonthYearPickerOpen ? (
              <div className="py-2 space-y-3">
                {/* Year Buttons */}
                <div>
                  <div className="text-[10px] uppercase font-mono tracking-wider text-[#707080] mb-1.5 px-1">
                    Select Year
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {availableYears.map((yr) => (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => {
                          setViewYear(yr);
                        }}
                        className={`py-1 text-xs font-mono rounded-md transition-colors cursor-pointer ${
                          viewYear === yr
                            ? 'bg-[#6366F1] text-white font-medium'
                            : 'bg-[#181822] text-[#A0A0B2] hover:text-white hover:bg-[#20202E]'
                        }`}
                      >
                        {yr}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Month Grid */}
                <div>
                  <div className="text-[10px] uppercase font-mono tracking-wider text-[#707080] mb-1.5 px-1">
                    Select Month
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {MONTH_SHORT_NAMES.map((name, idx) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => {
                          setViewMonth(idx);
                          setIsMonthYearPickerOpen(false);
                        }}
                        className={`py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
                          viewMonth === idx
                            ? 'bg-[#6366F1] text-white font-semibold'
                            : 'bg-[#181822] text-[#A0A0B2] hover:text-white hover:bg-[#20202E]'
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* STANDARD CALENDAR DAY GRID */
              <div>
                {/* Days of Week Header */}
                <div className="grid grid-cols-7 mb-1.5 text-center">
                  {DAY_NAMES.map((d) => (
                    <div
                      key={d}
                      className="text-[10px] font-mono font-medium text-[#646476] uppercase tracking-wider py-1"
                    >
                      {d}
                    </div>
                  ))}
                </div>

                {/* Day Grid Cells */}
                <div
                  ref={gridRef}
                  role="grid"
                  tabIndex={0}
                  onKeyDown={handleGridKeyDown}
                  className="grid grid-cols-7 gap-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#6366F1] rounded-lg"
                  aria-label={`Days in ${MONTH_NAMES[viewMonth]} ${viewYear}. Use arrow keys to navigate.`}
                >
                  {calendarDays.map((item, idx) => {
                    const isFocused = isSameDay(item.date, focusedDate);

                    // Styling rules:
                    // 1. If selected: filled indigo circle
                    // 2. If today: subtle indigo outline ring
                    // 3. If has transactions: prominent text + indicator dot
                    // 4. If no transactions: slightly muted/disabled style (still clickable)
                    // 5. If outside current month: dimmed
                    return (
                      <button
                        key={idx}
                        type="button"
                        role="gridcell"
                        aria-selected={item.isSelected}
                        aria-label={`${formatFullDate(item.date)}${
                          item.hasTransactions ? `, ${item.transactionCount} transactions` : ', no recorded transactions'
                        }${item.isToday ? ', today' : ''}`}
                        onClick={() => handleSelectDay(item.date)}
                        className={`relative group flex flex-col items-center justify-center h-8 rounded-lg text-xs font-mono transition-all duration-150 cursor-pointer ${
                          item.isSelected
                            ? 'bg-[#6366F1] text-white font-semibold shadow-xs'
                            : item.isToday
                            ? 'ring-1 ring-[#6366F1]/70 text-white font-medium hover:bg-[#1C1C28]'
                            : !item.isCurrentMonth
                            ? 'text-[#484858] hover:text-[#9090A4] hover:bg-[#181820]'
                            : item.hasTransactions
                            ? 'text-[#EDEDF5] hover:text-white hover:bg-[#1C1C28] font-medium'
                            : 'text-[#626274] hover:text-[#B0B0C4] hover:bg-[#181820]'
                        } ${isFocused && !item.isSelected ? 'bg-[#1E1E2C]' : ''}`}
                      >
                        <span className="leading-none">{item.date.getDate()}</span>

                        {/* Indicator Dot for days with transaction data */}
                        {item.hasTransactions && (
                          <span
                            className={`w-1 h-1 rounded-full mt-0.5 ${
                              item.isSelected ? 'bg-white' : 'bg-[#818CF8]'
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* POPOVER FOOTER QUICK ACTIONS */}
            <div className="mt-3 pt-2.5 border-t border-[#1E1E26] flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={handleJumpToToday}
                className="text-[11px] font-medium text-[#818CF8] hover:text-[#A5B4FC] transition-colors cursor-pointer"
              >
                Today ({formatDisplayDate(today)})
              </button>

              <button
                type="button"
                onClick={handleClearDate}
                className="flex items-center gap-1 text-[11px] text-[#88889C] hover:text-white transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Show All Dates</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
