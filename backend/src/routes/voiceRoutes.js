'use strict';

const router = require('express').Router();
const { transcribe, saveNote, textToSpeech } = require('../controllers/voiceController');
const { auth, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Separate multer config for audio files
const audioDir = path.join(process.env.UPLOAD_DIR || 'uploads', 'audio');
if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, audioDir),
  filename:    (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});

const audioFilter = (req, file, cb) => {
  const allowed = ['audio/webm', 'audio/ogg', 'audio/wav', 'audio/mp4', 'audio/mpeg', 'audio/mp3'];
  const allowedExts = ['.webm', '.ogg', '.wav', '.mp4', '.mp3', '.m4a'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid audio file type.'), false);
  }
};

const audioUpload = multer({
  storage: audioStorage,
  fileFilter: audioFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB for audio
});

// Doctor-only voice routes
router.use(auth, authorize('doctor'));

router.post('/transcribe', audioUpload.single('audio'), transcribe);
router.post('/note',       saveNote);
router.post('/tts',        textToSpeech);

module.exports = router;