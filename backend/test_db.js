const mongoose = require('mongoose');
const Patient = require('./src/models/Patient');
const User = require('./src/models/User');
const DentalScore = require('./src/models/DentalScore');

async function check() {
  await mongoose.connect('mongodb://localhost:27017/vinamec_dental');
  console.log('Connected');
  const patientId = '69f8c39834a9809bb7e70b2e';
  const patient = await Patient.findById(patientId);
  console.log('Patient:', patient);
  const userDirect = await User.findById(patientId);
  console.log('User direct:', userDirect);
  if (patient) {
    const user = await User.findById(patient.user);
    console.log('User via patient:', user);
  }
  const score = await DentalScore.findOne({ patient: patientId });
  console.log('Score by patientId:', score);
  if (patient) {
    const scoreByUser = await DentalScore.findOne({ patient: patient.user });
    console.log('Score by patient.user:', scoreByUser);
  }
  process.exit(0);
}
check().catch(err => { console.error(err); process.exit(1); });
