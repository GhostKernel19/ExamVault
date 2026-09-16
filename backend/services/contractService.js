/**
 * ExamVault - Smart Contract Integration Service (Stub / Ethers.js Ready)
 * 
 * In production, ExamVault anchors paper records on-chain (Ethereum / Polygon / Arbitrum):
 * 
 * struct PaperRecord {
 *     bytes32 encryptedFileHash;
 *     uint256 releaseTime;
 *     address admin;
 *     bool exists;
 * }
 * 
 * This service currently stubs the smart contract's release time verification,
 * and provides clear hooks for dropping in real ethers.js calls once the contract is deployed.
 */

// In-memory registry of scheduled release timestamps (in milliseconds)
// Stored per paperId for demo/testing purposes
const paperReleaseTimes = new Map();

/**
 * Checks whether the scheduled release time for a given paperId has passed.
 * 
 * STUB BEHAVIOR:
 * 1. If SIMULATE_RELEASE_PASSED=true in .env, returns true.
 * 2. If a specific release time was set for the paper (via upload or setPaperReleaseTime),
 *    checks if Date.now() >= releaseTime.
 * 3. Default fallback: defaults to false unless releaseTime was reached.
 * 
 * @param {string} paperId - Unique paper identifier
 * @returns {Promise<boolean>} Resolves to true if release time has passed, false otherwise
 */
async function checkReleaseTime(paperId) {
  // Global simulation flag (configured via .env)
  if (process.env.SIMULATE_RELEASE_PASSED === 'true') {
    return true;
  }

  // Check scheduled release time if registered
  if (paperReleaseTimes.has(paperId)) {
    const scheduledTime = paperReleaseTimes.get(paperId);
    return Date.now() >= scheduledTime;
  }

  /**
   * =========================================================================
   * PRODUCTION ETHERS.JS SMART CONTRACT INTEGRATION (Drop-in Ready)
   * =========================================================================
   * 
   * const { ethers } = require('ethers');
   * const ExamVaultABI = require('../contracts/ExamVaultABI.json');
   * 
   * const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
   * const contract = new ethers.Contract(
   *   process.env.CONTRACT_ADDRESS,
   *   ExamVaultABI,
   *   provider
   * );
   * 
   * try {
   *   const paper = await contract.getPaper(paperId);
   *   const latestBlock = await provider.getBlock('latest');
   *   const blockTimestamp = latestBlock.timestamp; // in seconds
   * 
   *   // Check if current on-chain timestamp has reached paper.releaseTime
   *   return blockTimestamp >= Number(paper.releaseTime);
   * } catch (error) {
   *   console.error(`Smart contract verification error for paper ${paperId}:`, error);
   *   return false;
   * }
   * =========================================================================
   */

  // Default: if no release time is registered, return false (locked by default)
  return false;
}

/**
 * Registers or updates the release time for a paper (useful for demo/testing).
 * 
 * @param {string} paperId 
 * @param {number|Date} releaseTime - Timestamp in ms or Date object
 */
function setPaperReleaseTime(paperId, releaseTime) {
  const timestampMs = releaseTime instanceof Date ? releaseTime.getTime() : Number(releaseTime);
  paperReleaseTimes.set(paperId, timestampMs);
  return timestampMs;
}

/**
 * Gets release time details for a paper.
 * 
 * @param {string} paperId 
 * @returns {{
 *   paperId: string,
 *   releaseTime: number|null,
 *   currentTime: number,
 *   hasPassed: boolean,
 *   isSimulated: boolean
 * }}
 */
async function getReleaseStatus(paperId) {
  const currentTime = Date.now();
  const scheduledTime = paperReleaseTimes.get(paperId) || null;
  const isSimulated = process.env.SIMULATE_RELEASE_PASSED === 'true';
  const hasPassed = await checkReleaseTime(paperId);

  return {
    paperId,
    releaseTime: scheduledTime,
    currentTime,
    hasPassed,
    isSimulated
  };
}

module.exports = {
  checkReleaseTime,
  setPaperReleaseTime,
  getReleaseStatus
};
