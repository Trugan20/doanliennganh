const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// Get upload directory - same as server.js
const uploadDir = path.join(
  __dirname,
  "../../",
  process.env.UPLOAD_DIR || "uploads",
);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    let subDir = "images";
    if ([".dcm", ".dicom"].includes(ext)) subDir = "xrays";
    else if ([".stl", ".obj", ".ply"].includes(ext)) subDir = "scans";
    else if ([".webm", ".ogg", ".mp3", ".wav", ".m4a", ".aac"].includes(ext))
      subDir = "audio";

    const uploadPath = path.join(uploadDir, subDir);
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/dicom",
    "application/octet-stream",
    "audio/webm",
    "audio/ogg",
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/m4a",
    "audio/aac",
  ];
  const allowedExts = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
    ".dcm",
    ".dicom",
    ".stl",
    ".obj",
    ".webm",
    ".ogg",
    ".mp3",
    ".wav",
    ".m4a",
    ".aac",
  ];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowed.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only images and dental scan files are allowed.",
      ),
      false,
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024,
  },
});

module.exports = upload;
