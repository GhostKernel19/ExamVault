/**
 * ExamVault - Smart Contract Integration Service
 * 
 * Verifies exam paper timelocks and access permissions on-chain (Sepolia),
 * with fallback to local scheduled timestamps or demo simulation.
 */

const { ethers } = require('ethers');
const ExamVaultABI = require('../config/ExamVaultABI.json');

// In-memory registry of scheduled release timestamps (in milliseconds)
const paperReleaseTimes = new Map();

function getContractInstance() {
  const rpcUrl = process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
  const address = process.env.CONTRACT_ADDRESS;
  if (!address || address.startsWith('0x123') || address.startsWith('0x000')) {
    return null;
  }
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  return new ethers.Contract(address, ExamVaultABI, provider);
}

/**
 * Checks whether the scheduled release time for a given paperId has passed.
 * 1. Checks SIMULATE_RELEASE_PASSED
 * 2. Attempts on-chain check via smart contract getTimeUntilRelease
 * 3. Checks in-memory registry paperReleaseTimes
 * 4. Defaults to false (locked)
 * 
 * @param {string} paperId - Unique paper identifier
 * @returns {Promise<boolean>} Resolves to true if release time has passed, false otherwise
 */
async function checkReleaseTime(paperId) {
  if (process.env.SIMULATE_RELEASE_PASSED === 'true') {
    return true;
  }

  // Attempt smart contract verification if configured
  try {
    const contract = getContractInstance();
    if (contract) {
      const isRegistered = await contract.isPaperRegistered(paperId);
      if (isRegistered) {
        const secondsRemaining = await contract.getTimeUntilRelease(paperId);
        return Number(secondsRemaining) === 0;
      }
    }
  } catch (err) {
    // Graceful fallback to local timestamp check
  }

  // Check scheduled release time if registered locally
  if (paperReleaseTimes.has(paperId)) {
    const scheduledTime = paperReleaseTimes.get(paperId);
    return Date.now() >= scheduledTime;
  }

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
  let scheduledTime = paperReleaseTimes.get(paperId) || null;
  const isSimulated = process.env.SIMULATE_RELEASE_PASSED === 'true';

  // Check on-chain release time if available
  try {
    const contract = getContractInstance();
    if (contract) {
      const isRegistered = await contract.isPaperRegistered(paperId);
      if (isRegistered) {
        const details = await contract.getPaperDetails(paperId);
        scheduledTime = Number(details[1]) * 1000;
      }
    }
  } catch (err) {}

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
