/**
 * ExamVault - Paper Controller
 * 
 * Handles exam paper upload, encryption, multi-center RSA key wrapping,
 * scheduled key release checks, and audit trail inquiries.
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const { encryptFileBuffer } = require('../services/encryption');
const { wrapKeyForCenters } = require('../services/keyWrapping');
const { checkReleaseTime, setPaperReleaseTime, getReleaseStatus } = require('../services/contractService');
const { savePaper, getPaper, listPapers } = require('../services/paperStore');
const { getAuditLogs, logAuditEvent } = require('../middlewares/auditLogger');
const { getPublicCenters, getCenter } = require('../utils/mockCenters');

const UPLOAD_DIR = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * POST /api/paper/upload
 * 
 * Accepts a file upload, performs AES-256-GCM encryption, computes SHA-256 hash,
 * wraps the AES key for all authorized exam centers, and returns on-chain ready payload.
 */
async function uploadPaper(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No paper file provided. Please upload a file via multipart form-data (key: "paper").'
      });
    }

    const paperId = `paper-${Date.now()}-${uuidv4().substring(0, 8)}`;
    const originalFilename = req.file.originalname;
    const fileBuffer = req.file.buffer;

    // 1. Determine authorized centers
    // Default to all pre-configured centers unless specified in req.body
    let authorizedCenters = getPublicCenters();
    if (req.body.centerIds) {
      const requestedIds = Array.isArray(req.body.centerIds) 
        ? req.body.centerIds 
        : JSON.parse(req.body.centerIds);
      authorizedCenters = requestedIds
        .map(id => getCenter(id))
        .filter(Boolean);
    }

    if (!authorizedCenters || authorizedCenters.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid authorized exam centers available for key wrapping.'
      });
    }

    // 2. Encrypt the file using AES-256-GCM
    const { aesKey, encryptedBuffer, encryptedFileHash } = encryptFileBuffer(fileBuffer);

    // 3. Save encrypted file to disk (/uploads/<paperId>.enc)
    const encryptedFileName = `${paperId}.enc`;
    const encryptedFilePath = path.join(UPLOAD_DIR, encryptedFileName);
    fs.writeFileSync(encryptedFilePath, encryptedBuffer);

    // 4. Wrap AES key individually for each authorized center using RSA-OAEP
    const wrappedKeys = wrapKeyForCenters(aesKey, authorizedCenters);

    // 5. Configure scheduled release time
    // If releaseTime provided in req.body (e.g. ISO string or unix ms), use it;
    // Otherwise, default to 1 hour in future for realistic demo behavior
    const releaseTimeMs = req.body.releaseTime 
      ? new Date(req.body.releaseTime).getTime()
      : Date.now() + 60 * 60 * 1000; // 1 hour from now

    setPaperReleaseTime(paperId, releaseTimeMs);

    // 6. Save metadata record to store
    const paperRecord = {
      paperId,
      title: req.body.title || originalFilename,
      originalFilename,
      mimeType: req.file.mimetype,
      fileSizeBytes: fileBuffer.length,
      encryptedFileSizeBytes: encryptedBuffer.length,
      encryptedFileName,
      encryptedFilePath,
      encryptedFileHash,
      wrappedKeys,
      authorizedCenterIds: authorizedCenters.map(c => c.centerId),
      releaseTime: releaseTimeMs,
      uploadedAt: new Date().toISOString()
    };

    savePaper(paperRecord);

    // 7. Log the successful creation in audit trail
    logAuditEvent({
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1',
      paperId,
      centerId: 'ADMIN',
      action: 'PAPER_UPLOAD_AND_ENCRYPT',
      status: 'SUCCESS',
      statusCode: 201,
      details: `File "${originalFilename}" encrypted. Wrapped for ${authorizedCenters.length} centers.`
    });

    // 8. Return response formatted for on-chain anchoring
    return res.status(201).json({
      success: true,
      paperId,
      encryptedFileHash,
      wrappedKeys,
      originalFilename,
      fileSizeBytes: fileBuffer.length,
      encryptedFileSizeBytes: encryptedBuffer.length,
      releaseTime: new Date(releaseTimeMs).toISOString(),
      authorizedCenters: authorizedCenters.map(c => ({ centerId: c.centerId, name: c.name })),
      blockchainReady: {
        contractMethod: "registerPaper(string paperId, bytes32 encryptedFileHash, uint256 releaseTime)",
        paperId,
        encryptedFileHash,
        releaseTimeUnixSeconds: Math.floor(releaseTimeMs / 1000)
      }
    });

  } catch (error) {
    console.error('Error during paper upload:', error);
    return res.status(500).json({
      success: false,
      error: `Internal paper processing error: ${error.message}`
    });
  }
}

/**
 * GET /api/paper/:paperId/release-key
 * 
 * Verifies that the scheduled release time has passed and center is authorized.
 * If authorized, returns that center's wrapped key.
 * If not, returns 403 Forbidden.
 */
async function releaseKey(req, res) {
  try {
    const { paperId } = req.params;
    const centerId = req.query.centerId || req.headers['x-center-id'];

    if (!centerId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required query parameter "centerId" (e.g. ?centerId=center-delhi-01) or header "x-center-id".'
      });
    }

    // 1. Retrieve paper
    const paper = getPaper(paperId);
    if (!paper) {
      return res.status(404).json({
        success: false,
        error: `Paper not found with ID: ${paperId}`
      });
    }

    // 2. Check if center is authorized
    if (!paper.wrappedKeys || !paper.wrappedKeys[centerId]) {
      return res.status(403).json({
        success: false,
        error: `Center "${centerId}" is not authorized to receive the decryption key for this paper.`
      });
    }

    // 3. Verify smart contract release time condition
    const isReleaseTimeReached = await checkReleaseTime(paperId);
    const releaseStatus = await getReleaseStatus(paperId);

    if (!isReleaseTimeReached) {
      return res.status(403).json({
        success: false,
        error: 'Not yet authorized for release',
        paperId,
        centerId,
        releaseTime: releaseStatus.releaseTime ? new Date(releaseStatus.releaseTime).toISOString() : 'Scheduled on-chain',
        currentTime: new Date(releaseStatus.currentTime).toISOString(),
        message: 'The scheduled exam paper release window has not arrived yet. Decryption key is securely locked.'
      });
    }

    // 4. Release time reached and center authorized -> release wrapped key
    const wrappedKey = paper.wrappedKeys[centerId];

    return res.status(200).json({
      success: true,
      paperId: paper.paperId,
      centerId,
      wrappedKey,
      encryptedFileHash: paper.encryptedFileHash,
      algorithm: 'AES-256-GCM + RSA-OAEP(SHA-256)',
      downloadUrl: `/api/paper/${paperId}/download-encrypted`,
      message: 'Key successfully released. Decrypt the wrapped key using your center RSA private key.'
    });

  } catch (error) {
    console.error('Error during key release:', error);
    return res.status(500).json({
      success: false,
      error: `Error checking key release: ${error.message}`
    });
  }
}

/**
 * GET /api/paper/:paperId/audit-log
 * 
 * Returns the tamper-evident audit history of all access and key-release attempts.
 */
async function getAuditLog(req, res) {
  try {
    const { paperId } = req.params;
    const centerId = req.query.centerId;

    const logs = getAuditLogs({ paperId, centerId });

    return res.status(200).json({
      success: true,
      paperId,
      totalEvents: logs.length,
      auditTrail: logs
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: `Error retrieving audit log: ${error.message}`
    });
  }
}

/**
 * GET /api/paper/:paperId/download-encrypted
 * 
 * Serves the raw encrypted .enc file so authorized exam centers can download
 * and decrypt it locally using their unwrapped AES key.
 */
async function downloadEncryptedPaper(req, res) {
  try {
    const { paperId } = req.params;
    const paper = getPaper(paperId);

    if (!paper || !paper.encryptedFilePath || !fs.existsSync(paper.encryptedFilePath)) {
      return res.status(404).json({
        success: false,
        error: 'Encrypted paper file not found.'
      });
    }

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${paper.encryptedFileName}"`);
    res.setHeader('X-Encrypted-File-Hash', paper.encryptedFileHash);

    return res.sendFile(paper.encryptedFilePath);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: `Failed to download file: ${error.message}`
    });
  }
}

/**
 * GET /api/paper/centers
 * 
 * Returns the list of registered exam centers and their RSA public keys.
 */
async function listAuthorizedCenters(req, res) {
  return res.status(200).json({
    success: true,
    centers: getPublicCenters()
  });
}

/**
 * POST /api/paper/:paperId/simulate-release
 * 
 * Demo helper: sets the paper's release time to now or the past
 * to allow testing the release flow during hackathon presentations.
 */
async function simulateReleaseTimePassed(req, res) {
  const { paperId } = req.params;
  const paper = getPaper(paperId);

  if (!paper) {
    return res.status(404).json({ success: false, error: 'Paper not found' });
  }

  // Set release time to 1 minute in the past
  const simulatedTime = Date.now() - 60000;
  setPaperReleaseTime(paperId, simulatedTime);
  paper.releaseTime = simulatedTime;

  return res.status(200).json({
    success: true,
    paperId,
    message: 'Paper release time updated to the past. Key release is now unlocked!',
    newReleaseTime: new Date(simulatedTime).toISOString()
  });
}

module.exports = {
  uploadPaper,
  releaseKey,
  getAuditLog,
  downloadEncryptedPaper,
  listAuthorizedCenters,
  simulateReleaseTimePassed
};
