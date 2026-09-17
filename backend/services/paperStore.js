/**
 * ExamVault - Paper Storage Service
 * 
 * Manages paper metadata and references to encrypted files stored in /uploads.
 * Automatically persists records to disk (papers.json) so papers survive server restarts.
 */

const fs = require('fs');
const path = require('path');

const STORE_FILE = path.resolve(process.cwd(), process.env.PAPER_STORE_FILE || 'papers.json');

// In-memory paper registry backed by papers.json
const papers = new Map();

// Initialize from disk if file exists
try {
  if (fs.existsSync(STORE_FILE)) {
    const raw = fs.readFileSync(STORE_FILE, 'utf8');
    const stored = JSON.parse(raw);
    if (Array.isArray(stored)) {
      for (const p of stored) {
        if (p && p.paperId) {
          papers.set(p.paperId, p);
        }
      }
    }
  }
} catch (err) {
  console.warn('Could not load existing papers from disk:', err.message);
}

function persistToDisk() {
  try {
    const data = Array.from(papers.values());
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to persist paper records to disk:', err.message);
  }
}

/**
 * Saves a new paper record.
 * @param {Object} paperRecord 
 */
function savePaper(paperRecord) {
  if (!paperRecord.paperId) {
    throw new Error('paperRecord must include a paperId');
  }

  const record = {
    ...paperRecord,
    savedAt: paperRecord.savedAt || new Date().toISOString()
  };

  papers.set(paperRecord.paperId, record);
  persistToDisk();

  return papers.get(paperRecord.paperId);
}

/**
 * Retrieves a paper record by paperId.
 * @param {string} paperId 
 * @returns {Object|null}
 */
function getPaper(paperId) {
  return papers.get(paperId) || null;
}

/**
 * Checks if a paper exists.
 * @param {string} paperId 
 * @returns {boolean}
 */
function paperExists(paperId) {
  return papers.has(paperId);
}

/**
 * Returns all stored papers (excluding internal file paths).
 */
function listPapers() {
  return Array.from(papers.values()).map(paper => {
    const { encryptedFilePath, ...safePaper } = paper;
    return safePaper;
  });
}

module.exports = {
  savePaper,
  getPaper,
  paperExists,
  listPapers
};
