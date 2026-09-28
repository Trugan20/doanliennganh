'use strict';

const fs   = require('fs');
const path = require('path');

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const COLORS = {
  error: '\x1b[31m', // red
  warn:  '\x1b[33m', // yellow
  info:  '\x1b[36m', // cyan
  debug: '\x1b[35m', // magenta
  reset: '\x1b[0m',
};

const currentLevel = LEVELS[process.env.LOG_LEVEL] ?? (process.env.NODE_ENV === 'production' ? LEVELS.info : LEVELS.debug);

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const errorLogStream = fs.createWriteStream(path.join(logsDir, 'error.log'), { flags: 'a' });
const combinedLogStream = fs.createWriteStream(path.join(logsDir, 'combined.log'), { flags: 'a' });

const formatMessage = (level, message, meta) => {
  const ts = new Date().toISOString();
  const metaStr = meta && Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `[${ts}] [${level.toUpperCase()}] ${message}${metaStr}`;
};

const log = (level, message, meta = {}) => {
  if (LEVELS[level] > currentLevel) return;

  const formatted = formatMessage(level, message, meta);

  // Console output with color
  if (process.env.NODE_ENV !== 'test') {
    const color = COLORS[level] || '';
    console.log(`${color}${formatted}${COLORS.reset}`);
  }

  // File output
  combinedLogStream.write(formatted + '\n');
  if (level === 'error') errorLogStream.write(formatted + '\n');
};

const logger = {
  error: (message, meta)  => log('error', message, meta),
  warn:  (message, meta)  => log('warn',  message, meta),
  info:  (message, meta)  => log('info',  message, meta),
  debug: (message, meta)  => log('debug', message, meta),

  /** Log an HTTP request */
  http: (req, statusCode, responseTimeMs) => {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    log(level, `${req.method} ${req.originalUrl} ${statusCode} – ${responseTimeMs}ms`, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  },

  /** Log a database query (debug only) */
  db: (operation, collection, durationMs) => {
    log('debug', `DB ${operation} on ${collection} – ${durationMs}ms`);
  },
};

module.exports = logger;