'use strict';

/**
 * Job Registry — starts all background jobs when called.
 *
 * Call `startJobs()` from server.js after the DB connects.
 * All cancel functions are collected so graceful shutdown is possible.
 */

const logger = require('../utils/logger');
const reminderJob = require('./reminderJob');

const cancellers = [];

const startJobs = () => {
  if (process.env.NODE_ENV === 'test') {
    logger.info('[Jobs] Skipping background jobs in test environment.');
    return;
  }

  logger.info('[Jobs] Starting background jobs...');

  try {
    const cancelReminder = reminderJob.schedule();
    cancellers.push(cancelReminder);
  } catch (err) {
    logger.error('[Jobs] Failed to start reminderJob:', { error: err.message });
  }

  logger.info(`[Jobs] ${cancellers.length} job(s) running.`);
};

const stopJobs = () => {
  logger.info('[Jobs] Stopping background jobs...');
  cancellers.forEach(cancel => {
    try { cancel(); } catch (_) {}
  });
  cancellers.length = 0;
  logger.info('[Jobs] All jobs stopped.');
};

module.exports = { startJobs, stopJobs };