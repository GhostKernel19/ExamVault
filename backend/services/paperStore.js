/**
 * ExamVault - Paper Storage Service
 * 
 * Manages paper metadata and references to encrypted files stored in /uploads.
 * In a hackathon / MVP setup, this acts as the fast in-memory & file-backed store.
 */

const fs = require('fs');
const path = require('path');

// In-memory paper registry
const papers = new Map();

/**
 * Saves a new paper record.
 * @param {Object} paperRecord 
 */
function savePaper(paperRecord) {
  if (!paperRecord.paperId) {
    throw new Error('paperRecord must include a paperId');
  }

  papers.set(paperRecord.paperId, {
    ...paperRecord,
    savedAt: new Date().toISOString()
  });

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
