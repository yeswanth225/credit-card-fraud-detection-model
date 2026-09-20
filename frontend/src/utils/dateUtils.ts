/**
 * Date utility helpers for FraudShield Transaction Date Filtering
 */

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const MONTH_SHORT_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/**
 * Safely parse a transaction timestamp into a Date object
 */
export function parseTxDate(timestamp: string): Date {
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) {
    // If not a valid timestamp, return now
    return new Date();
  }
  return d;
}

/**
 * Check if two dates represent the exact same calendar day (comparing local year, month, date)
 */
export function isSameDay(d1: Date | null, d2: Date | null): boolean {
  if (!d1 || !d2) return false;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Format a Date for UI badge display, e.g. "09 Sep 2026"
 */
export function formatDisplayDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = MONTH_SHORT_NAMES[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Format a Date for screen reader / full announcements, e.g. "9 September 2026"
 */
export function formatFullDate(date: Date): string {
  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Formats full time of day (HH:mm:ss) from an ISO timestamp or fallback formatted string
 */
export function formatFullTime(timestamp: string, fallbackFormatted?: string): string {
  try {
    const d = new Date(timestamp);
    if (!isNaN(d.getTime())) {
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');
      return `${hours}:${minutes}:${seconds}`;
    }
  } catch {
    // Fallback
  }
  return fallbackFormatted || '00:00:00';
}

/**
 * Generate the days matrix for a calendar month view.
 * Includes preceding trailing days from previous month and succeeding days from next month
 * to form full 7-day grid rows.
 */
export interface CalendarDayItem {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  hasTransactions: boolean;
  transactionCount: number;
}

export function buildCalendarDays(
  viewYear: number,
  viewMonth: number,
  selectedDate: Date | null,
  today: Date,
  activeDatesMap: Map<string, number>
): CalendarDayItem[] {
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
  const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);

  // Day of week for first day (0 = Sunday)
  const startDayOfWeek = firstDayOfMonth.getDay();
  // Total days in this month
  const totalDays = lastDayOfMonth.getDate();

  const days: CalendarDayItem[] = [];

  // Trailing days from previous month
  const prevMonthLastDay = new Date(viewYear, viewMonth, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(viewYear, viewMonth - 1, prevMonthLastDay - i);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const txCount = activeDatesMap.get(key) || 0;
    days.push({
      date: d,
      isCurrentMonth: false,
      isToday: isSameDay(d, today),
      isSelected: isSameDay(d, selectedDate),
      hasTransactions: txCount > 0,
      transactionCount: txCount,
    });
  }

  // Current month days
  for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
    const d = new Date(viewYear, viewMonth, dayNum);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const txCount = activeDatesMap.get(key) || 0;
    days.push({
      date: d,
      isCurrentMonth: true,
      isToday: isSameDay(d, today),
      isSelected: isSameDay(d, selectedDate),
      hasTransactions: txCount > 0,
      transactionCount: txCount,
    });
  }

  // Next month leading days to round out to multiples of 7 (up to 35 or 42 cells)
  const remaining = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(viewYear, viewMonth + 1, i);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const txCount = activeDatesMap.get(key) || 0;
    days.push({
      date: d,
      isCurrentMonth: false,
      isToday: isSameDay(d, today),
      isSelected: isSameDay(d, selectedDate),
      hasTransactions: txCount > 0,
      transactionCount: txCount,
    });
  }

  return days;
}
