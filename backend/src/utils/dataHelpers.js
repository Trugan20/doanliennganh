'use strict';

/**
 * Date utility helpers for VinaMec Dental Care API.
 * All functions work with plain YYYY-MM-DD strings or Date objects.
 */

/**
 * Return today as YYYY-MM-DD in local time.
 */
const today = () => {
  const d = new Date();
  return toDateString(d);
};

/**
 * Convert a Date to YYYY-MM-DD string.
 */
const toDateString = (date) => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/**
 * Add N days to a YYYY-MM-DD string. Returns YYYY-MM-DD.
 */
const addDays = (dateStr, days) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return toDateString(d);
};

/**
 * Subtract N days from a YYYY-MM-DD string. Returns YYYY-MM-DD.
 */
const subtractDays = (dateStr, days) => addDays(dateStr, -days);

/**
 * Check if a YYYY-MM-DD date is in the future (strictly after today).
 */
const isFuture = (dateStr) => dateStr > today();

/**
 * Check if a YYYY-MM-DD date is today.
 */
const isToday = (dateStr) => dateStr === today();

/**
 * Check if a YYYY-MM-DD date is in the past (strictly before today).
 */
const isPast = (dateStr) => dateStr < today();

/**
 * Get the number of days between two YYYY-MM-DD strings.
 */
const daysBetween = (from, to) => {
  const a = new Date(from);
  const b = new Date(to);
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
};

/**
 * Format a YYYY-MM-DD string to a human-readable format.
 * e.g. '2024-06-15' → 'Saturday, June 15, 2024'
 */
const formatDate = (dateStr, locale = 'en-US') => {
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString(locale, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

/**
 * Return an array of YYYY-MM-DD strings for the next N days starting from today.
 */
const nextNDays = (n) => {
  return Array.from({ length: n }, (_, i) => addDays(today(), i + 1));
};

/**
 * Check if a given YYYY-MM-DD falls on a weekend (Saturday or Sunday).
 */
const isWeekend = (dateStr) => {
  const day = new Date(dateStr + 'T00:00:00').getDay();
  return day === 0 || day === 6;
};

/**
 * Convert a Date or ISO string to a short timestamp string.
 * e.g. '2024-06-15T09:30:00.000Z' → '2024-06-15 09:30'
 */
const toShortTimestamp = (dt) => {
  const d = new Date(dt);
  return `${toDateString(d)} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
};

/**
 * Parse HH:MM time string to { hours, minutes }.
 */
const parseTime = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
};

/**
 * Check if timeA comes before timeB (both HH:MM strings).
 */
const timeBefore = (timeA, timeB) => {
  const a = parseTime(timeA);
  const b = parseTime(timeB);
  return a.hours < b.hours || (a.hours === b.hours && a.minutes < b.minutes);
};

/**
 * Generate all HH:MM time slots between startTime and endTime
 * with given interval in minutes.
 */
const generateTimeSlots = (startTime = '08:00', endTime = '17:00', intervalMins = 30) => {
  const slots = [];
  let { hours, minutes } = parseTime(startTime);
  const { hours: endH, minutes: endM } = parseTime(endTime);

  while (hours < endH || (hours === endH && minutes < endM)) {
    slots.push(`${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}`);
    minutes += intervalMins;
    if (minutes >= 60) {
      hours += Math.floor(minutes / 60);
      minutes = minutes % 60;
    }
  }
  return slots;
};

/**
 * Get the first day of the month for a given YYYY-MM-DD.
 */
const startOfMonth = (dateStr) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-01`;
};

/**
 * Get the last day of the month for a given YYYY-MM-DD.
 */
const endOfMonth = (dateStr) => {
  const d = new Date(dateStr);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return toDateString(last);
};

module.exports = {
  today,
  toDateString,
  addDays,
  subtractDays,
  isFuture,
  isToday,
  isPast,
  daysBetween,
  formatDate,
  nextNDays,
  isWeekend,
  toShortTimestamp,
  parseTime,
  timeBefore,
  generateTimeSlots,
  startOfMonth,
  endOfMonth,
};