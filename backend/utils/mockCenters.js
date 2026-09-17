/**
 * ExamVault - Mock Exam Centers Registry
 * 
 * Provides pre-configured exam centers with valid RSA 2048-bit keypairs.
 * These are ready for testing the full upload -> wrap -> release -> unwrap flow.
 */

const { generateRSAKeyPair } = require('../services/keyWrapping');

// Pre-generate key pairs on module initialization for demo consistency
const delhiKeys = generateRSAKeyPair();
const mumbaiKeys = generateRSAKeyPair();
const bangaloreKeys = generateRSAKeyPair();

const centersRegistry = {
  'center-delhi-01': {
    centerId: 'center-delhi-01',
    name: 'Delhi Northern Examination Center',
    location: 'New Delhi, India',
    publicKey: delhiKeys.publicKey,
    _privateKey: delhiKeys.privateKey // For demo/testing unwrap verification only
  },
  'center-mumbai-02': {
    centerId: 'center-mumbai-02',
    name: 'Mumbai Central Examination Bureau',
    location: 'Mumbai, India',
    publicKey: mumbaiKeys.publicKey,
    _privateKey: mumbaiKeys.privateKey
  },
  'center-bengaluru-03': {
    centerId: 'center-bengaluru-03',
    name: 'Bengaluru Tech Institute Center',
    location: 'Bengaluru, India',
    publicKey: bangaloreKeys.publicKey,
    _privateKey: bangaloreKeys.privateKey
  },
  '0x71c80e4c92e3532c3a50058bdb63b9b972fe3e2c': {
    centerId: '0x71C80e4C92e3532C3A50058bDb63B9B972FE3e2C',
    name: 'Delhi Authority Center (0x71C8...)',
    location: 'New Delhi, India',
    publicKey: delhiKeys.publicKey,
    _privateKey: delhiKeys.privateKey
  },
  '0x8626f6940e2eb28930efb4cef49b2d1f2c9c1199': {
    centerId: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
    name: 'Mumbai Secondary Center (0x8626...)',
    location: 'Mumbai, India',
    publicKey: mumbaiKeys.publicKey,
    _privateKey: mumbaiKeys.privateKey
  }
};

/**
 * Returns public information for all authorized centers (safe for API response).
 */
function getPublicCenters() {
  return Object.values(centersRegistry).map(({ centerId, name, location, publicKey }) => ({
    centerId,
    name,
    location,
    publicKey
  }));
}

/**
 * Gets a center by ID or Ethereum address (case-insensitive).
 * @param {string} centerId 
 */
function getCenter(centerId) {
  if (!centerId || typeof centerId !== 'string') return null;
  if (centersRegistry[centerId]) return centersRegistry[centerId];
  const lower = centerId.toLowerCase();
  if (centersRegistry[lower]) return centersRegistry[lower];
  for (const [key, center] of Object.entries(centersRegistry)) {
    if (key.toLowerCase() === lower || center.centerId.toLowerCase() === lower) {
      return center;
    }
  }
  return null;
}

/**
 * Gets or dynamically creates an exam center entry (with generated RSA keys).
 * Enables seamless key-wrapping for any arbitrary Ethereum address passed from MetaMask.
 * @param {string} centerId
 * @param {string} [name]
 */
function getOrCreateCenter(centerId, name = null) {
  if (!centerId || typeof centerId !== 'string') return null;
  const existing = getCenter(centerId);
  if (existing) return existing;

  const keys = generateRSAKeyPair();
  const label = name || (centerId.startsWith('0x') ? `Center (${centerId.substring(0, 8)}...)` : `Center ${centerId}`);
  return registerCenter(centerId, label, keys.publicKey, keys.privateKey);
}

/**
 * Gets the private key of a center (used by demo script/test client to simulate center unwrap).
 * @param {string} centerId 
 */
function getCenterPrivateKey(centerId) {
  const center = getCenter(centerId);
  return center ? center._privateKey : null;
}

/**
 * Dynamically registers a new exam center.
 * @param {string} centerId 
 * @param {string} name 
 * @param {string} publicKey 
 * @param {string} [privateKey]
 */
function registerCenter(centerId, name, publicKey, privateKey = null) {
  const newCenter = {
    centerId,
    name,
    location: 'Registered Center',
    publicKey,
    _privateKey: privateKey
  };
  centersRegistry[centerId] = newCenter;
  centersRegistry[centerId.toLowerCase()] = newCenter;
  return newCenter;
}

module.exports = {
  getPublicCenters,
  getCenter,
  getOrCreateCenter,
  getCenterPrivateKey,
  registerCenter
};
