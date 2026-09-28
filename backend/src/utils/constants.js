'use strict';

const ROLES = Object.freeze({
  ADMIN:   'admin',
  DOCTOR:  'doctor',
  PATIENT: 'patient',
});

const APPOINTMENT_STATUSES = Object.freeze({
  PENDING:   'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW:   'no-show',
});

const IMAGE_TYPES = Object.freeze({
  XRAY:  'xray',
  PHOTO: 'photo',
  SCAN:  'scan',
  OTHER: 'other',
});

const SERVICE_CATEGORIES = Object.freeze([
  'Preventive',
  'Restorative',
  'Cosmetic',
  'Emergency',
  'General',
  'Orthodontics',
  'Surgery',
]);

const BLOOD_TYPES = Object.freeze([
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', '',
]);

const CHAT_TYPES = Object.freeze({
  PUBLIC:  'public',
  PRIVATE: 'private',
});

const SCORE_METRICS = Object.freeze([
  'overall',
  'gumHealth',
  'toothDecay',
  'alignment',
  'cleanliness',
]);

const SCORE_LABELS = Object.freeze({
  EXCELLENT: { min: 85, label: 'Excellent', emoji: '🌟' },
  GOOD:      { min: 70, label: 'Good',      emoji: '👍' },
  FAIR:      { min: 55, label: 'Fair',      emoji: '⚠️'  },
  POOR:      { min: 0,  label: 'Poor',      emoji: '🚨' },
});

const DEFAULT_PAGINATION = Object.freeze({
  PAGE:  1,
  LIMIT: 20,
  MAX_LIMIT: 100,
});

const JWT_EXPIRES_IN = '7d';

const MAX_UPLOAD_SIZE_MB = 10;
const MAX_AUDIO_SIZE_MB  = 25;
const MAX_BATCH_IMAGES   = 10;

const ALLOWED_IMAGE_MIMETYPES = Object.freeze([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const ALLOWED_AUDIO_MIMETYPES = Object.freeze([
  'audio/webm',
  'audio/ogg',
  'audio/wav',
  'audio/mp4',
  'audio/mpeg',
  'audio/mp3',
]);

const HTTP_STATUS = Object.freeze({
  OK:         200,
  CREATED:    201,
  NO_CONTENT: 204,
  BAD_REQUEST:   400,
  UNAUTHORIZED:  401,
  FORBIDDEN:     403,
  NOT_FOUND:     404,
  CONFLICT:      409,
  UNPROCESSABLE: 422,
  TOO_LARGE:     413,
  SERVER_ERROR:  500,
});

const RATE_LIMITS = Object.freeze({
  GLOBAL:   { windowMs: 15 * 60 * 1000, max: 200 },
  AUTH:     { windowMs: 15 * 60 * 1000, max: 20  },
  CHAT:     { windowMs:  1 * 60 * 1000, max: 30  },
  UPLOAD:   { windowMs: 15 * 60 * 1000, max: 50  },
});

module.exports = {
  ROLES,
  APPOINTMENT_STATUSES,
  IMAGE_TYPES,
  SERVICE_CATEGORIES,
  BLOOD_TYPES,
  CHAT_TYPES,
  SCORE_METRICS,
  SCORE_LABELS,
  DEFAULT_PAGINATION,
  JWT_EXPIRES_IN,
  MAX_UPLOAD_SIZE_MB,
  MAX_AUDIO_SIZE_MB,
  MAX_BATCH_IMAGES,
  ALLOWED_IMAGE_MIMETYPES,
  ALLOWED_AUDIO_MIMETYPES,
  HTTP_STATUS,
  RATE_LIMITS,
};