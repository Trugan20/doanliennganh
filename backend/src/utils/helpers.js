'use strict';

const { SCORE_LABELS } = require('./constants');

/**
 * Generate a random alphanumeric ID of given length
 */
const generateId = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

/**
 * Return today's date as YYYY-MM-DD string
 */
const todayString = () => new Date().toISOString().split('T')[0];

/**
 * Add N days to a date string and return YYYY-MM-DD
 */
const addDays = (dateStr, days) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

/**
 * Check if a date string is in the future
 */
const isFutureDate = (dateStr) => new Date(dateStr) > new Date();

/**
 * Sanitise a string – trim and remove dangerous chars
 */
const sanitize = (str) =>
  typeof str === 'string' ? str.trim().replace(/[<>]/g, '') : str;

/**
 * Pick only allowed keys from an object
 */
const pick = (obj, keys) =>
  keys.reduce((acc, key) => { if (key in obj) acc[key] = obj[key]; return acc; }, {});

/**
 * Omit keys from an object
 */
const omit = (obj, keys) =>
  Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));

/**
 * Compute the overall dental score label
 */
const getScoreLabel = (score) => {
  if (score >= SCORE_LABELS.EXCELLENT.min) return SCORE_LABELS.EXCELLENT;
  if (score >= SCORE_LABELS.GOOD.min)      return SCORE_LABELS.GOOD;
  if (score >= SCORE_LABELS.FAIR.min)      return SCORE_LABELS.FAIR;
  return SCORE_LABELS.POOR;
};

/**
 * Calculate overall dental score from sub-metrics
 */
const calculateOverallScore = ({ gumHealth, toothDecay, alignment, cleanliness }) => {
  const weights = { gumHealth: 0.3, toothDecay: 0.3, alignment: 0.2, cleanliness: 0.2 };
  const raw =
    (gumHealth  || 0) * weights.gumHealth  +
    (toothDecay || 0) * weights.toothDecay  +
    (alignment  || 0) * weights.alignment   +
    (cleanliness|| 0) * weights.cleanliness;
  return Math.round(raw);
};

/**
 * Format file size in bytes to human-readable string
 */
const formatFileSize = (bytes) => {
  if (bytes < 1024)             return `${bytes} B`;
  if (bytes < 1024 * 1024)      return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Build a MongoDB text search filter from a query string
 */
const buildSearchFilter = (search, fields) => {
  if (!search) return {};
  const regex = { $regex: search, $options: 'i' };
  return { $or: fields.map(f => ({ [f]: regex })) };
};

/**
 * Safely parse JSON, returning defaultValue on failure
 */
const safeJsonParse = (str, defaultValue = null) => {
  try { return JSON.parse(str); } catch { return defaultValue; }
};

/**
 * Slugify a string (for file names etc.)
 */
const slugify = (str) =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/**
 * Mask email for privacy: a***@domain.com
 */
const maskEmail = (email) => {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  return `${local[0]}***@${domain}`;
};

/**
 * Deep clone a plain object
 */
const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

/**
 * Chunk an array into smaller arrays of given size
 */
const chunk = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
};

module.exports = {
  generateId,
  todayString,
  addDays,
  isFutureDate,
  sanitize,
  pick,
  omit,
  getScoreLabel,
  calculateOverallScore,
  formatFileSize,
  buildSearchFilter,
  safeJsonParse,
  slugify,
  maskEmail,
  deepClone,
  chunk,
};