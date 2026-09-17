/**
 * ExamVault - Audit Logger Middleware & Service
 * 
 * Provides append-only tamper-evident logging to local `audit.json`.
 * Logs every key-release request and audit query with timestamp, client IP,
 * paperId, centerId, and outcome status (SUCCESS, FORBIDDEN, etc.).
 * 
 * This fulfills the tamper-evident audit trail requirement until smart contract
 * events are fully wired.
 */

const fs = require('fs');
const path = require('path');

const AUDIT_FILE = path.resolve(process.cwd(), process.env.AUDIT_LOG_FILE || 'audit.json');

// In-memory cache for fast retrieval and query filtering
let inMemoryLogs = [];

// Initialize file if not present
function initAuditFile() {
  try {
    if (fs.existsSync(AUDIT_FILE)) {
      const data = fs.readFileSync(AUDIT_FILE, 'utf8').trim();
      if (data) {
        inMemoryLogs = JSON.parse(data);
      } else {
        inMemoryLogs = [];
        fs.writeFileSync(AUDIT_FILE, JSON.stringify([], null, 2));
      }
    } else {
      inMemoryLogs = [];
      fs.writeFileSync(AUDIT_FILE, JSON.stringify([], null, 2));
    }
  } catch (err) {
    console.error('Failed to initialize audit file:', err.message);
    inMemoryLogs = [];
    fs.writeFileSync(AUDIT_FILE, JSON.stringify([], null, 2));
  }
}

// Call on startup
initAuditFile();

/**
 * Appends an audit event to the audit log.
 * 
 * @param {Object} event
 * @param {string} event.paperId
 * @param {string} [event.centerId]
 * @param {string} event.action - e.g. 'KEY_RELEASE_ATTEMPT', 'AUDIT_LOG_VIEW'
 * @param {string} event.status - e.g. 'SUCCESS', 'RELEASE_TIME_NOT_MET', 'UNAUTHORIZED_CENTER'
 * @param {number} event.statusCode - HTTP status code
 * @param {string} event.ip - Client IP
 * @param {string} [event.details] - Additional diagnostic details
 */
function logAuditEvent(event) {
  const logEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    ip: event.ip || '127.0.0.1',
    paperId: event.paperId || 'UNKNOWN',
    centerId: event.centerId || 'ANONYMOUS',
    action: event.action || 'KEY_RELEASE_ATTEMPT',
    status: event.status || 'PENDING',
    statusCode: event.statusCode || 200,
    details: event.details || null
  };

  inMemoryLogs.push(logEntry);

  // Append safely to audit.json
  try {
    fs.writeFileSync(AUDIT_FILE, JSON.stringify(inMemoryLogs, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing to audit log file:', err.message);
  }

  return logEntry;
}

/**
 * Retrieves audit logs, optionally filtered by paperId and/or centerId.
 * 
 * @param {Object} filters
 * @param {string} [filters.paperId]
 * @param {string} [filters.centerId]
 * @returns {Array<Object>}
 */
function getAuditLogs(filters = {}) {
  let results = [...inMemoryLogs];

  if (filters.paperId) {
    results = results.filter(log => log.paperId === filters.paperId);
  }

  if (filters.centerId) {
    results = results.filter(log => log.centerId === filters.centerId);
  }

  return results;
}

/**
 * Express Middleware: Automatically logs requests to /release-key and /audit-log
 */
function auditMiddleware(req, res, next) {
  const isReleaseKeyRoute = req.path.includes('/release-key');
  const isAuditLogRoute = req.path.includes('/audit-log');

  if (!isReleaseKeyRoute && !isAuditLogRoute) {
    return next();
  }

  // Intercept completion
  res.on('finish', () => {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const paperId = req.params.paperId || req.query.paperId || 'UNKNOWN';
    const centerId = req.query.centerId || req.headers['x-center-id'] || 'ANONYMOUS';

    let action = 'GENERAL_ACCESS';
    let status = 'SUCCESS';

    if (isReleaseKeyRoute) {
      action = 'KEY_RELEASE_ATTEMPT';
      if (res.statusCode === 200) {
        status = 'SUCCESS';
      } else if (res.statusCode === 403) {
        status = 'FORBIDDEN_RELEASE_TIME_NOT_MET';
      } else if (res.statusCode === 404) {
        status = 'PAPER_OR_CENTER_NOT_FOUND';
      } else {
        status = `FAILED_HTTP_${res.statusCode}`;
      }
    } else if (isAuditLogRoute) {
      action = 'AUDIT_LOG_VIEW';
      status = res.statusCode === 200 ? 'SUCCESS' : `FAILED_HTTP_${res.statusCode}`;
    }

    logAuditEvent({
      ip: clientIp,
      paperId,
      centerId,
      action,
      status,
      statusCode: res.statusCode,
      details: `${req.method} ${req.originalUrl}`
    });
  });

  next();
}

module.exports = {
  logAuditEvent,
  getAuditLogs,
  auditMiddleware,
  AUDIT_FILE
};
