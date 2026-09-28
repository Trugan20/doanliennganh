'use strict';

const Appointment = require('../models/Appointment');
const User        = require('../models/User');
const Service     = require('../models/Service');
const { todayString, addDays } = require('../utils/helpers');
const emailService = require('./emailService');

/**
 * Check whether a doctor has a conflicting appointment at a given date+time.
 * @returns {boolean} true if slot is already taken
 */
const isSlotTaken = async (doctorId, date, time, excludeId = null) => {
  const filter = {
    doctor: doctorId,
    date,
    time,
    status: { $in: ['pending', 'confirmed'] },
  };
  if (excludeId) filter._id = { $ne: excludeId };
  const conflict = await Appointment.findOne(filter);
  return !!conflict;
};

/**
 * Get all available time slots for a doctor on a given date.
 * @returns {string[]} array of HH:MM strings that are not booked
 */
const getAvailableSlots = async (doctorId, date, slotDurationMins = 30) => {
  const allSlots = [];
  const startHour = 8;
  const endHour   = 17;

  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += slotDurationMins) {
      allSlots.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
    }
  }

  const booked = await Appointment.find({
    doctor: doctorId,
    date,
    status: { $in: ['pending', 'confirmed'] },
  }).select('time');

  const bookedTimes = new Set(booked.map(a => a.time));
  return allSlots.filter(slot => !bookedTimes.has(slot));
};

/**
 * Book an appointment with full validation, conflict checking, and email.
 */
const bookAppointment = async ({ patientId, doctorId, serviceId, date, time, notes }) => {
  // Validate doctor
  const doctor = await User.findById(doctorId);
  if (!doctor || doctor.role !== 'doctor' || !doctor.isActive) {
    throw Object.assign(new Error('Doctor not found or not available.'), { status: 404 });
  }

  // Validate service
  let serviceName = 'General Consultation';
  let fee = 0;
  let duration = 30;
  if (serviceId) {
    const service = await Service.findById(serviceId);
    if (service && service.active) {
      serviceName = service.name;
      fee = service.price;
      duration = service.duration;
    }
  }

  // Check slot availability
  const taken = await isSlotTaken(doctorId, date, time);
  if (taken) {
    throw Object.assign(
      new Error('This time slot is already booked. Please choose a different time.'),
      { status: 409 }
    );
  }

  const patient = await User.findById(patientId);
  const appointment = await Appointment.create({
    patient: patientId,
    patientName: patient.name,
    doctor: doctorId,
    doctorName: doctor.name,
    service: serviceId || undefined,
    serviceName,
    date,
    time,
    duration,
    fee,
    notes,
  });

  // Send confirmation email (non-blocking)
  emailService.appointmentConfirmationEmail({
    to: patient.email,
    patientName: patient.name,
    doctorName: doctor.name,
    date,
    time,
    service: serviceName,
  }).catch(err => console.error('Email error:', err.message));

  return appointment;
};

/**
 * Cancel an appointment and notify the patient.
 */
const cancelAppointment = async (appointmentId, cancelledByUserId, reason = '') => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw Object.assign(new Error('Appointment not found.'), { status: 404 });
  }

  if (['completed', 'cancelled'].includes(appointment.status)) {
    throw Object.assign(
      new Error(`Cannot cancel a ${appointment.status} appointment.`),
      { status: 400 }
    );
  }

  const cancelledBy = cancelledByUserId === appointment.patient.toString() ? 'patient'
    : cancelledByUserId === appointment.doctor.toString() ? 'doctor' : 'admin';

  appointment.status = 'cancelled';
  appointment.cancelReason = reason;
  appointment.cancelledBy = cancelledBy;
  await appointment.save();

  // Notify patient
  const patient = await User.findById(appointment.patient).select('email name');
  if (patient) {
    emailService.appointmentCancellationEmail({
      to: patient.email,
      patientName: patient.name,
      date: appointment.date,
      time: appointment.time,
      reason,
    }).catch(() => {});
  }

  return appointment;
};

/**
 * Get appointments that need reminder emails (tomorrow's appointments not yet reminded).
 */
const getUpcomingForReminders = async () => {
  const tomorrow = addDays(todayString(), 1);
  return Appointment.find({
    date: tomorrow,
    status: { $in: ['pending', 'confirmed'] },
    reminderSent: false,
  })
    .populate('patient', 'name email')
    .populate('doctor',  'name');
};

/**
 * Send reminder emails for tomorrow's appointments.
 * Designed to be called by a cron job.
 */
const sendDueReminders = async () => {
  const appointments = await getUpcomingForReminders();
  let sent = 0;

  for (const apt of appointments) {
    try {
      await emailService.appointmentReminderEmail({
        to: apt.patient.email,
        patientName: apt.patient.name,
        doctorName: apt.doctorName,
        date: apt.date,
        time: apt.time,
      });
      apt.reminderSent = true;
      await apt.save();
      sent++;
    } catch (err) {
      console.error(`Reminder failed for appointment ${apt._id}:`, err.message);
    }
  }

  return { total: appointments.length, sent };
};

/**
 * Complete an appointment and update fee/payment status.
 */
const completeAppointment = async (appointmentId, { doctorNotes, isPaid, fee } = {}) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw Object.assign(new Error('Appointment not found.'), { status: 404 });
  }
  if (appointment.status === 'cancelled') {
    throw Object.assign(new Error('Cannot complete a cancelled appointment.'), { status: 400 });
  }

  appointment.status = 'completed';
  if (doctorNotes !== undefined) appointment.doctorNotes = doctorNotes;
  if (isPaid      !== undefined) appointment.isPaid = isPaid;
  if (fee         !== undefined) appointment.fee = fee;
  await appointment.save();
  return appointment;
};

module.exports = {
  isSlotTaken,
  getAvailableSlots,
  bookAppointment,
  cancelAppointment,
  sendDueReminders,
  completeAppointment,
  getUpcomingForReminders,
};