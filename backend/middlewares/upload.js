/**
 * ExamVault - File Upload Middleware
 * 
 * Uses Multer with memoryStorage so plaintext exam papers are never written
 * unencrypted to disk. The buffer is encrypted in-memory before being saved.
 */

const multer = require('multer');

// Configure memory storage
const storage = multer.memoryStorage();

// File filter (optional safety check, can accept PDFs, docs, txt, etc.)
const fileFilter = (req, file, cb) => {
  // Allow all standard exam file formats: pdf, docx, doc, txt, zip, png, jpg
  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB max paper size
  },
  fileFilter
});

module.exports = upload;
