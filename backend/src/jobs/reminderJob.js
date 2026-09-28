'use strict';

/**
 * Appointment Reminder Job
 *
 * Sends reminder emails for appointments scheduled for tomorrow.
 * Designed to run once daily at 08:00.
 *
 * Uses a lightweight interval-based scheduler (no extra dependencies).
 * In production, replace with a robust queue like Bull or node-cron.
 */

const { sendDueReminders } = require('../services/appointmentService');
const logger = require('../utils/logger');

const JOB_NAME = 'AppointmentReminder';

/**
 * Execute the reminder job once.
 */
const run = async () => {
  logger.info(`[${JOB_NAME}] Starting job...`);
  try {
    const result = await sendDueReminders();
    logger.info(`[${JOB_NAME}] Done. Sent ${result.sent}/${result.total} reminders.`);
    return result;
  } catch (err) {
    logger.error(`[${JOB_NAME}] Failed: ${err.message}`);
    throw err;
  }
};

/**
 * Schedule the job to run daily at 08:00 server time.
 * Returns a cancel function.
 */
const schedule = () => {
  logger.info(`[${JOB_NAME}] Scheduling daily reminder job at 08:00...`);

  const msUntilNext8am = () => {
    const now = new Date();
    const next = new Date();
    next.setHours(8, 0, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    return next - now;
  };

  let timeoutId;
  let intervalId;

  const tick = async () => {
    await run().catch(() => {}); // errors already logged in run()
    // Re-schedule for next day
    intervalId = setInterval(async () => {
      await run().catch(() => {});
    }, 24 * 60 * 60 * 1000);
  };

  timeoutId = setTimeout(tick, msUntilNext8am());

  logger.info(`[${JOB_NAME}] First run in ${Math.round(msUntilNext8am() / 60000)} minutes.`);

  return () => {
    clearTimeout(timeoutId);
    clearInterval(intervalId);
    logger.info(`[${JOB_NAME}] Job cancelled.`);
  };
};

module.exports = { run, schedule };