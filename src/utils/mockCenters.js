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
 * Gets a center by ID.
 * @param {string} centerId 
 */
function getCenter(centerId) {
  return centersRegistry[centerId] || null;
}

/**
 * Gets the private key of a center (used by demo script/test client to simulate center unwrap).
 * @param {string} centerId 
 */
function getCenterPrivateKey(centerId) {
  const center = centersRegistry[centerId];
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
  centersRegistry[centerId] = {
    centerId,
    name,
    location: 'Custom Registered Center',
    publicKey,
    _privateKey: privateKey
  };
  return centersRegistry[centerId];
}

module.exports = {
  getPublicCenters,
  getCenter,
  getCenterPrivateKey,
  registerCenter
};
