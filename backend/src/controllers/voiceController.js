'use strict';

const fs = require('fs');
const path = require('path');
const { sendSuccess, sendError } = require('../utils/response');

// POST /api/voice/transcribe  [doctor only]
// Accepts an audio file and returns a mock transcription
const transcribe = async (req, res) => {
  try {
    if (!req.file) return sendError(res, 400, 'No audio file uploaded.');

    // In production: integrate with Whisper API or Google Speech-to-Text
    // Mock response for now
    const transcription = {
      text: 'Patient reports toothache in upper right molar. Sensitivity to cold. No swelling observed. Recommending X-ray for further evaluation.',
      confidence: 0.94,
      language: 'en',
      duration: 8.5,
      words: [
        { word: 'Patient', start: 0.0, end: 0.4 },
        { word: 'reports', start: 0.4, end: 0.8 },
        { word: 'toothache', start: 0.9, end: 1.4 },
      ],
      processedAt: new Date(),
    };

    // Clean up uploaded audio file
    fs.unlink(req.file.path, () => {});

    return sendSuccess(res, 200, 'Audio transcribed successfully', transcription);
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return sendError(res, 500, err.message);
  }
};

// POST /api/voice/note  [doctor only – save transcribed note to medical record]
const saveNote = async (req, res) => {
  try {
    const { transcription, patientId, recordId, noteType = 'general' } = req.body;

    if (!transcription) return sendError(res, 400, 'Transcription text is required.');

    // In production, attach to MedicalRecord or create a new note
    const note = {
      id: Date.now().toString(),
      transcription,
      doctorId: req.user._id,
      doctorName: req.user.name,
      patientId,
      recordId,
      noteType,
      savedAt: new Date(),
    };

    return sendSuccess(res, 201, 'Voice note saved', note);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// POST /api/voice/tts  [doctor only – text to speech for patient instructions]
const textToSpeech = async (req, res) => {
  try {
    const { text, language = 'en', voice = 'neutral' } = req.body;

    if (!text) return sendError(res, 400, 'Text is required.');
    if (text.length > 2000) return sendError(res, 400, 'Text too long. Maximum 2000 characters.');

    // Mock TTS response — in production integrate with Google TTS or AWS Polly
    return sendSuccess(res, 200, 'Text-to-speech generated', {
      text,
      language,
      voice,
      audioUrl: null, // Would be a URL to generated audio file
      durationMs: text.length * 60, // rough estimate
      message: 'TTS integration pending. Connect Google TTS or AWS Polly in production.',
    });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

module.exports = { transcribe, saveNote, textToSpeech };