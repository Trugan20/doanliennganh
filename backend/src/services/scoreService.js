'use strict';

const DentalScore = require('../models/DentalScore');
const MedicalRecord = require('../models/MedicalRecord');
const Appointment = require('../models/Appointment');
const { calculateOverallScore, getScoreLabel, todayString } = require('../utils/helpers');

/**
 * Auto-calculate and persist a dental score for a patient based on
 * their medical history and appointment compliance.
 *
 * This is called after a doctor creates/updates a medical record,
 * or on demand by the scoring engine.
 */
const recalculateScore = async (patientId, assessedByUserId) => {
  // Fetch latest records (up to 10)
  const records = await MedicalRecord.find({ patient: patientId })
    .sort({ createdAt: -1 })
    .limit(10);

  // Fetch appointment stats
  const [totalAppts, completedAppts] = await Promise.all([
    Appointment.countDocuments({ patient: patientId }),
    Appointment.countDocuments({ patient: patientId, status: 'completed' }),
  ]);

  // Derive sub-scores from record data
  const diagnosisKeywords = records.map(r => (r.diagnosis || '').toLowerCase()).join(' ');

  const gumHealth    = deriveGumHealth(diagnosisKeywords);
  const toothDecay   = deriveToothDecay(diagnosisKeywords);
  const alignment    = deriveAlignment(diagnosisKeywords);
  const cleanliness  = deriveCleanliness(diagnosisKeywords, totalAppts, completedAppts);
  const overall      = calculateOverallScore({ gumHealth, toothDecay, alignment, cleanliness });

  const scoreLabel   = getScoreLabel(overall);
  const recommendations = buildRecommendations({ gumHealth, toothDecay, alignment, cleanliness, overall });

  let score = await DentalScore.findOne({ patient: patientId });

  if (!score) {
    score = new DentalScore({
      patient: patientId,
      patientName: records[0]?.patientName || '',
    });
  }

  score.overall      = overall;
  score.gumHealth    = gumHealth;
  score.toothDecay   = toothDecay;
  score.alignment    = alignment;
  score.cleanliness  = cleanliness;
  score.recommendations = recommendations;
  score.lastAssessedBy = assessedByUserId;
  score.lastAssessedAt = new Date();

  // Append history entry if not already recorded today
  const today = todayString();
  if (!score.history.some(h => h.date === today)) {
    score.history.push({ date: today, score: overall });
  }

  await score.save();
  return { score, label: scoreLabel };
};

/**
 * Return the dental score for a patient, creating a default if missing.
 */
const getOrCreateScore = async (patientId, patientName) => {
  let score = await DentalScore.findOne({ patient: patientId })
    .populate('lastAssessedBy', 'name specialization');

  if (!score) {
    score = await DentalScore.create({
      patient: patientId,
      patientName,
      overall: 70,
      gumHealth: 70,
      toothDecay: 70,
      alignment: 70,
      cleanliness: 70,
      history: [{ date: todayString(), score: 70 }],
    });
  }

  return score;
};

/**
 * Update individual score metrics for a patient.
 */
const updateMetrics = async (patientId, metrics, assessedByUserId) => {
  let score = await DentalScore.findOne({ patient: patientId });
  if (!score) throw new Error('Dental score record not found for this patient.');

  const allowedKeys = ['overall', 'gumHealth', 'toothDecay', 'alignment', 'cleanliness'];
  allowedKeys.forEach(key => {
    if (metrics[key] !== undefined) score[key] = metrics[key];
  });

  // Recalculate overall if sub-metrics provided but overall not explicitly set
  if (!metrics.overall && (metrics.gumHealth || metrics.toothDecay || metrics.alignment || metrics.cleanliness)) {
    score.overall = calculateOverallScore({
      gumHealth:   score.gumHealth,
      toothDecay:  score.toothDecay,
      alignment:   score.alignment,
      cleanliness: score.cleanliness,
    });
  }

  score.lastAssessedBy = assessedByUserId;
  score.lastAssessedAt = new Date();

  const today = todayString();
  if (!score.history.some(h => h.date === today)) {
    score.history.push({ date: today, score: score.overall });
  }

  await score.save();
  return score;
};

// ─── Private Heuristics ───────────────────────────────────────────────────────

function deriveGumHealth(diagnosisText) {
  let score = 85;
  if (diagnosisText.includes('gingivitis'))    score -= 20;
  if (diagnosisText.includes('periodontitis')) score -= 35;
  if (diagnosisText.includes('gum recession')) score -= 25;
  if (diagnosisText.includes('bleeding'))      score -= 10;
  return Math.max(10, Math.min(100, score));
}

function deriveToothDecay(diagnosisText) {
  let score = 90;
  if (diagnosisText.includes('caries'))      score -= 20;
  if (diagnosisText.includes('cavity'))      score -= 20;
  if (diagnosisText.includes('decay'))       score -= 25;
  if (diagnosisText.includes('abscess'))     score -= 30;
  if (diagnosisText.includes('root canal'))  score -= 15;
  if (diagnosisText.includes('erosion'))     score -= 15;
  return Math.max(10, Math.min(100, score));
}

function deriveAlignment(diagnosisText) {
  let score = 80;
  if (diagnosisText.includes('malocclusion'))    score -= 20;
  if (diagnosisText.includes('crowding'))        score -= 15;
  if (diagnosisText.includes('impacted'))        score -= 10;
  if (diagnosisText.includes('misalignment'))    score -= 20;
  if (diagnosisText.includes('braces'))          score += 10; // undergoing treatment
  return Math.max(10, Math.min(100, score));
}

function deriveCleanliness(diagnosisText, total, completed) {
  let score = 75;
  if (diagnosisText.includes('tartar'))    score -= 15;
  if (diagnosisText.includes('plaque'))    score -= 10;
  if (diagnosisText.includes('staining'))  score -= 10;
  // Appointment compliance bonus
  if (total > 0) {
    const compliance = completed / total;
    score += Math.round(compliance * 15);
  }
  return Math.max(10, Math.min(100, score));
}

function buildRecommendations({ gumHealth, toothDecay, alignment, cleanliness, overall }) {
  const recs = [];
  if (gumHealth    < 70) recs.push('Schedule a professional gum treatment and practice daily flossing.');
  if (toothDecay   < 70) recs.push('Reduce sugary foods and drinks. Visit your dentist for cavity treatment.');
  if (alignment    < 70) recs.push('Consider an orthodontic consultation for alignment correction.');
  if (cleanliness  < 70) recs.push('Improve brushing technique – brush twice daily for 2 minutes with fluoride toothpaste.');
  if (overall      >= 85) recs.push('Excellent dental health! Maintain your current routine and visit every 6 months.');
  else if (overall >= 70) recs.push('Good dental health. Regular check-ups every 6 months recommended.');
  else recs.push('Schedule a comprehensive dental examination as soon as possible.');
  return recs;
}

module.exports = { recalculateScore, getOrCreateScore, updateMetrics };