/**
 * ExamVault - Key Wrapping Service
 * 
 * Implements RSA-OAEP asymmetric key wrapping and unwrapping using Node.js built-in `crypto`.
 * Each authorized exam center holds an RSA keypair. During paper upload, the AES symmetric
 * key is wrapped (encrypted) individually for every center using that center's RSA public key.
 * Only the designated center possessing the matching RSA private key can unwrap the AES key.
 */

const crypto = require('crypto');

const OAEP_HASH = 'sha256';
const PADDING = crypto.constants.RSA_PKCS1_OAEP_PADDING;

/**
 * Wraps (encrypts) an AES symmetric key using an exam center's RSA public key.
 * 
 * @param {Buffer|string} aesKey - 32-byte AES key (Buffer or hex string)
 * @param {string} centerPublicKeyPem - RSA public key in PEM format
 * @returns {string} Base64-encoded wrapped key
 */
function wrapKey(aesKey, centerPublicKeyPem) {
  if (!centerPublicKeyPem) {
    throw new Error('Center public key (PEM) is required');
  }

  const keyBuffer = Buffer.isBuffer(aesKey) ? aesKey : Buffer.from(aesKey, 'hex');

  const wrappedBuffer = crypto.publicEncrypt(
    {
      key: centerPublicKeyPem,
      padding: PADDING,
      oaepHash: OAEP_HASH
    },
    keyBuffer
  );

  return wrappedBuffer.toString('base64');
}

/**
 * Unwraps (decrypts) a wrapped AES key using the exam center's RSA private key.
 * 
 * @param {string|Buffer} wrappedKey - Base64-encoded wrapped key or Buffer
 * @param {string} centerPrivateKeyPem - RSA private key in PEM format
 * @param {string} [passphrase] - Optional passphrase if private key is encrypted
 * @returns {Buffer} Raw 32-byte AES key buffer
 */
function unwrapKey(wrappedKey, centerPrivateKeyPem, passphrase = undefined) {
  if (!wrappedKey) {
    throw new Error('Wrapped key is required');
  }
  if (!centerPrivateKeyPem) {
    throw new Error('Center private key (PEM) is required');
  }

  const wrappedBuffer = Buffer.isBuffer(wrappedKey) 
    ? wrappedKey 
    : Buffer.from(wrappedKey, 'base64');

  const keyOptions = {
    key: centerPrivateKeyPem,
    padding: PADDING,
    oaepHash: OAEP_HASH
  };

  if (passphrase) {
    keyOptions.passphrase = passphrase;
  }

  try {
    const aesKeyBuffer = crypto.privateDecrypt(keyOptions, wrappedBuffer);
    return aesKeyBuffer;
  } catch (err) {
    throw new Error(`Key unwrapping failed: ${err.message}`);
  }
}

/**
 * Wraps an AES key for multiple authorized centers.
 * 
 * @param {Buffer|string} aesKey - 32-byte AES key
 * @param {Array<{centerId: string, publicKey: string}> | Object.<string, {publicKey: string}>} centers
 * @returns {Object.<string, string>} Map of centerId -> base64 wrapped key
 */
function wrapKeyForCenters(aesKey, centers) {
  const wrappedKeys = {};

  if (Array.isArray(centers)) {
    for (const center of centers) {
      if (!center.centerId || !center.publicKey) {
        throw new Error(`Invalid center configuration: missing centerId or publicKey`);
      }
      wrappedKeys[center.centerId] = wrapKey(aesKey, center.publicKey);
    }
  } else if (typeof centers === 'object' && centers !== null) {
    for (const [centerId, details] of Object.entries(centers)) {
      const pubKey = typeof details === 'string' ? details : details.publicKey;
      if (!pubKey) {
        throw new Error(`Center ${centerId} missing public key`);
      }
      wrappedKeys[centerId] = wrapKey(aesKey, pubKey);
    }
  } else {
    throw new Error('Centers must be an Array or Object map');
  }

  return wrappedKeys;
}

/**
 * Utility: Generates an RSA 2048-bit keypair in PEM format.
 * Useful for mocking centers or setting up new exam centers.
 * 
 * @returns {{ publicKey: string, privateKey: string }}
 */
function generateRSAKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  return { publicKey, privateKey };
}

module.exports = {
  wrapKey,
  unwrapKey,
  wrapKeyForCenters,
  generateRSAKeyPair,
  PADDING,
  OAEP_HASH
};
