import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(duration);
dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

// Re-export dayjs for direct usage
export { dayjs };

/**
 * Get current date in UTC
 */
export function now(): Date {
  return dayjs.utc().toDate();
}

/**
 * Get current timestamp in milliseconds
 */
export function timestamp(): number {
  return Date.now();
}

/**
 * Format date to string
 * @param date - Date to format
 * @param format - Format string (default: 'YYYY-MM-DD HH:mm:ss')
 */
export function formatDate(
  date: Date | string | number,
  format = 'YYYY-MM-DD HH:mm:ss',
): string {
  return dayjs(date).format(format);
}

/**
 * Format date to ISO string
 */
export function toISOString(date: Date | string | number): string {
  return dayjs(date).toISOString();
}

/**
 * Parse date string to Date object
 */
export function parseDate(dateString: string): Date {
  return dayjs(dateString).toDate();
}

/**
 * Add time to date
 */
export function addTime(
  date: Date | string,
  amount: number,
  unit: dayjs.ManipulateType,
): Date {
  return dayjs(date).add(amount, unit).toDate();
}

/**
 * Subtract time from date
 */
export function subtractTime(
  date: Date | string,
  amount: number,
  unit: dayjs.ManipulateType,
): Date {
  return dayjs(date).subtract(amount, unit).toDate();
}

/**
 * Get start of period (day, week, month, year)
 */
export function startOf(date: Date | string, unit: dayjs.OpUnitType): Date {
  return dayjs(date).startOf(unit).toDate();
}

/**
 * Get end of period
 */
export function endOf(date: Date | string, unit: dayjs.OpUnitType): Date {
  return dayjs(date).endOf(unit).toDate();
}

/**
 * Get difference between two dates
 */
export function diff(
  date1: Date | string,
  date2: Date | string,
  unit: dayjs.QUnitType = 'millisecond',
): number {
  return dayjs(date1).diff(dayjs(date2), unit);
}

/**
 * Check if date is before another date
 */
export function isBefore(
  date: Date | string,
  compareDate: Date | string,
): boolean {
  return dayjs(date).isBefore(dayjs(compareDate));
}

/**
 * Check if date is after another date
 */
export function isAfter(
  date: Date | string,
  compareDate: Date | string,
): boolean {
  return dayjs(date).isAfter(dayjs(compareDate));
}

/**
 * Check if date is between two dates
 */
export function isDateBetween(
  date: Date | string,
  startDate: Date | string,
  endDate: Date | string,
): boolean {
  return dayjs(date).isBetween(startDate, endDate);
}

/**
 * Get relative time string (e.g., "2 hours ago")
 */
export function fromNow(date: Date | string): string {
  return dayjs(date).fromNow();
}

/**
 * Get relative time to another date
 */
export function toNow(date: Date | string): string {
  return dayjs(date).toNow();
}

/**
 * Check if date is today
 */
export function isToday(date: Date | string): boolean {
  return dayjs(date).isSame(dayjs(), 'day');
}

/**
 * Check if date is in the past
 */
export function isPast(date: Date | string): boolean {
  return dayjs(date).isBefore(dayjs());
}

/**
 * Check if date is in the future
 */
export function isFuture(date: Date | string): boolean {
  return dayjs(date).isAfter(dayjs());
}

/**
 * Convert to specific timezone
 */
export function toTimezone(date: Date | string, tz: string): Date {
  return dayjs(date).tz(tz).toDate();
}

/**
 * Get age from birthdate
 */
export function getAge(birthDate: Date | string): number {
  return dayjs().diff(dayjs(birthDate), 'year');
}

/**
 * Get duration in human readable format
 */
export function humanizeDuration(milliseconds: number): string {
  return dayjs.duration(milliseconds).humanize();
}

/**
 * Format date to PostgreSQL date string (YYYY-MM-DD)
 * Returns null if date is null or undefined
 * @param date - Date to format
 * @returns Formatted date string or null
 */
export function toDateString(
  date: Date | string | number | null | undefined,
): string | null {
  if (!date) return null;
  return dayjs(date).format('YYYY-MM-DD');
}

/**
 * Parse time string (HH:mm) to total minutes from start of day
 * @param time Time string in format HH:mm
 * @returns Total minutes
 */
export function parseTimeToMinutes(time: string): number {
  if (!time) return 0;
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}
