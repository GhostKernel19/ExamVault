/**
 * ExamVault - File Encryption Service
 * 
 * Implements military-grade AES-256-GCM symmetric encryption using Node.js built-in `crypto`.
 * AES-256-GCM provides authenticated encryption with integrity protection (AEAD),
 * preventing ciphertext tampering or bit-flipping.
 * 
 * Output format for encrypted files:
 * [ IV: 16 bytes ] [ Auth Tag: 16 bytes ] [ Ciphertext: N bytes ]
 * 
 * Also computes SHA-256 hash of the final encrypted payload for on-chain anchoring.
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;       // 256 bits
const IV_LENGTH = 16;        // 128 bits IV
const AUTH_TAG_LENGTH = 16;  // 128 bits GCM Auth Tag

/**
 * Generates a cryptographically secure random 256-bit AES key.
 * @returns {Buffer} 32-byte AES key
 */
function generateAESKey() {
  return crypto.randomBytes(KEY_LENGTH);
}

/**
 * Computes SHA-256 hash of a buffer.
 * @param {Buffer} buffer 
 * @returns {{ hashHex: string, hash0x: string }}
 */
function computeSHA256(buffer) {
  const hashHex = crypto.createHash('sha256').update(buffer).digest('hex');
  return {
    hashHex,
    hash0x: `0x${hashHex}`
  };
}

/**
 * Encrypts a plaintext file buffer using AES-256-GCM.
 * 
 * @param {Buffer} fileBuffer - Plaintext file data
 * @param {Buffer} [customKey] - Optional 32-byte AES key; generates new key if omitted
 * @returns {{
 *   aesKey: Buffer,
 *   encryptedBuffer: Buffer,
 *   encryptedFileHash: string,
 *   iv: Buffer,
 *   authTag: Buffer
 * }}
 */
function encryptFileBuffer(fileBuffer, customKey = null) {
  if (!Buffer.isBuffer(fileBuffer)) {
    throw new Error('Input must be a valid Buffer');
  }

  const aesKey = customKey || generateAESKey();
  if (aesKey.length !== KEY_LENGTH) {
    throw new Error(`AES key must be exactly ${KEY_LENGTH} bytes (256 bits)`);
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, aesKey, iv);

  const ciphertext = Buffer.concat([
    cipher.update(fileBuffer),
    cipher.final()
  ]);

  const authTag = cipher.getAuthTag();

  // Pack as: [ IV (16B) | AuthTag (16B) | Ciphertext (NB) ]
  const encryptedBuffer = Buffer.concat([iv, authTag, ciphertext]);

  // Compute SHA-256 hash of the ENCRYPTED file (anchored on-chain)
  const { hash0x } = computeSHA256(encryptedBuffer);

  return {
    aesKey,
    encryptedBuffer,
    encryptedFileHash: hash0x,
    iv,
    authTag
  };
}

/**
 * Decrypts an encrypted file buffer using AES-256-GCM.
 * 
 * @param {Buffer} encryptedBuffer - Packed buffer: [ IV | AuthTag | Ciphertext ]
 * @param {Buffer|string} aesKey - 32-byte AES key (Buffer or hex string)
 * @returns {Buffer} Plaintext file buffer
 */
function decryptFileBuffer(encryptedBuffer, aesKey) {
  if (!Buffer.isBuffer(encryptedBuffer)) {
    throw new Error('Encrypted input must be a Buffer');
  }

  const keyBuffer = Buffer.isBuffer(aesKey) ? aesKey : Buffer.from(aesKey, 'hex');
  if (keyBuffer.length !== KEY_LENGTH) {
    throw new Error(`AES key must be exactly ${KEY_LENGTH} bytes`);
  }

  const minLength = IV_LENGTH + AUTH_TAG_LENGTH;
  if (encryptedBuffer.length < minLength) {
    throw new Error('Encrypted buffer is too short to contain IV and Auth Tag');
  }

  // Extract packed segments
  const iv = encryptedBuffer.subarray(0, IV_LENGTH);
  const authTag = encryptedBuffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = encryptedBuffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
  decipher.setAuthTag(authTag);

  try {
    const decryptedBuffer = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final()
    ]);
    return decryptedBuffer;
  } catch (err) {
    throw new Error(`Decryption failed (tampered data or invalid key): ${err.message}`);
  }
}

module.exports = {
  generateAESKey,
  encryptFileBuffer,
  decryptFileBuffer,
  computeSHA256,
  ALGORITHM,
  KEY_LENGTH,
  IV_LENGTH,
  AUTH_TAG_LENGTH
};
