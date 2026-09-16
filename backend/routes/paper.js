/**
 * ExamVault - Paper API Routes
 * 
 * Endpoints for paper uploading, key release authorization, and audit logging.
 */

const express = require('express');
const router = express.Router();

const upload = require('../middlewares/upload');
const { auditMiddleware } = require('../middlewares/auditLogger');
const {
  uploadPaper,
  releaseKey,
  getAuditLog,
  downloadEncryptedPaper,
  listAuthorizedCenters,
  simulateReleaseTimePassed
} = require('../controllers/paperController');

// Apply audit logging middleware to all paper routes
router.use(auditMiddleware);

/**
 * @route   POST /api/paper/upload
 * @desc    Upload paper, encrypt with AES-256-GCM, generate SHA-256 hash, wrap key per center
 * @access  Admin / Exam Controller
 */
router.post('/upload', upload.single('paper'), uploadPaper);

/**
 * @route   GET /api/paper/centers
 * @desc    List authorized exam centers and public keys
 * @access  Public
 */
router.get('/centers', listAuthorizedCenters);

/**
 * @route   GET /api/paper/:paperId/release-key
 * @desc    Release wrapped AES key to authorized center if release time passed
 * @query   centerId (e.g. ?centerId=center-delhi-01)
 * @access  Authorized Exam Center
 */
router.get('/:paperId/release-key', releaseKey);

/**
 * @route   GET /api/paper/:paperId/audit-log
 * @desc    Get audit trail of all access and key-release attempts
 * @access  Auditor / Exam Authority
 */
router.get('/:paperId/audit-log', getAuditLog);

/**
 * @route   GET /api/paper/:paperId/download-encrypted
 * @desc    Download the encrypted .enc paper file
 * @access  Authorized Centers / Public (payload is encrypted)
 */
router.get('/:paperId/download-encrypted', downloadEncryptedPaper);

/**
 * @route   POST /api/paper/:paperId/simulate-release
 * @desc    Demo helper: fast-forwards paper release time for instant demoing
 * @access  Development / Demo
 */
router.post('/:paperId/simulate-release', simulateReleaseTimePassed);

module.exports = router;
