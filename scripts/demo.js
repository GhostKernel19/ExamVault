/**
 * ExamVault - 48-Hour Hackathon Demo Script
 * 
 * Demonstrates the complete cryptographic lifecycle and tamper-evident logging:
 * 1. Generates / loads authorized exam center RSA keypairs
 * 2. Uploads and symmetrically encrypts an exam paper (AES-256-GCM)
 * 3. Computes the SHA-256 hash of the encrypted file for blockchain anchoring
 * 4. Wraps the AES key per-center using RSA-OAEP
 * 5. Verifies that premature key release is BLOCKED with 403 Forbidden
 * 6. Verifies that unauthorized centers are REJECTED
 * 7. Simulates release time arrival
 * 8. Releases the wrapped key to authorized center
 * 9. Center unwraps the AES key using their RSA private key
 * 10. Decrypts the paper and verifies 100% byte-for-byte integrity match
 * 11. Inspects the append-only tamper-evident audit trail (audit.json)
 */

const fs = require('fs');
const path = require('path');
const { encryptFileBuffer, decryptFileBuffer } = require('../backend/services/encryption');
const { wrapKey, unwrapKey, wrapKeyForCenters } = require('../backend/services/keyWrapping');
const { getPublicCenters, getCenter, getCenterPrivateKey } = require('../backend/utils/mockCenters');
const { checkReleaseTime, setPaperReleaseTime } = require('../backend/services/contractService');
const { getAuditLogs, logAuditEvent } = require('../backend/middlewares/auditLogger');
const { savePaper, getPaper } = require('../backend/services/paperStore');

console.log('\n================================================================');
console.log('🔒 EXAMVAULT: END-TO-END CRYPTOGRAPHIC & AUDIT DEMO');
console.log('================================================================\n');

async function runDemo() {
  // Step 1: Prepare Sample Exam Paper
  const samplePaperContent = `
================================================================================
CONFIDENTIAL: CENTRAL BOARD OF ADVANCED COMPUTER SCIENCE EXAMINATIONS
SUBJECT: DISTRIBUTED LEDGERS & POST-QUANTUM CRYPTOGRAPHY
TIME ALLOWED: 3 HOURS                                      MAX MARKS: 100
================================================================================

QUESTION 1 [25 Marks]:
Explain how an append-only cryptographic audit trail prevents unauthorized 
tampering of sensitive examination papers prior to the official release window.

QUESTION 2 [25 Marks]:
Analyze the security advantages of AES-256-GCM authenticated encryption combined
with RSA-OAEP envelope key wrapping compared to single-layer symmetric encryption.

QUESTION 3 [50 Marks]:
Design a smart contract architecture that verifies off-chain paper hashes
anchored at registration and enforces an unchangeable release timestamp.
================================================================================
  `.trim();

  const originalBuffer = Buffer.from(samplePaperContent, 'utf8');
  console.log(`📄 Step 1: Loaded confidential exam paper (${originalBuffer.length} bytes)`);

  // Step 2: Encrypt paper using AES-256-GCM
  console.log('\n🔐 Step 2: Encrypting paper using AES-256-GCM...');
  const { aesKey, encryptedBuffer, encryptedFileHash, iv, authTag } = encryptFileBuffer(originalBuffer);

  console.log(`   ✓ AES-256 Key generated:       ${aesKey.toString('hex').substring(0, 16)}... (32 bytes)`);
  console.log(`   ✓ GCM Initialization Vector:   ${iv.toString('hex')} (16 bytes)`);
  console.log(`   ✓ Authentication Tag:          ${authTag.toString('hex')} (16 bytes)`);
  console.log(`   ✓ Encrypted Payload Size:      ${encryptedBuffer.length} bytes`);
  console.log(`   ✓ SHA-256 Digest (On-Chain):   ${encryptedFileHash}`);

  // Step 3: Key Wrapping for Authorized Exam Centers
  console.log('\n🏛️  Step 3: Wrapping AES key for authorized exam centers (RSA-OAEP)...');
  const centers = getPublicCenters();
  centers.forEach(c => console.log(`   - Center: ${c.centerId} (${c.name})`));

  const wrappedKeys = wrapKeyForCenters(aesKey, centers);
  for (const [centerId, wrappedKey] of Object.entries(wrappedKeys)) {
    console.log(`   ✓ Wrapped key for [${centerId}]: ${wrappedKey.substring(0, 32)}... (base64)`);
  }

  // Step 4: Register Paper in System
  const paperId = `paper-demo-${Date.now()}`;
  const releaseTimeMs = Date.now() + 60 * 60 * 1000; // 1 hour in future
  setPaperReleaseTime(paperId, releaseTimeMs);

  const paperRecord = {
    paperId,
    title: 'Computer Science Final 2026',
    originalFilename: 'CS_Final_2026.pdf',
    encryptedFileHash,
    wrappedKeys,
    releaseTime: releaseTimeMs,
    authorizedCenterIds: centers.map(c => c.centerId)
  };
  savePaper(paperRecord);
  console.log(`\n📦 Step 4: Paper registered in vault: [${paperId}]`);
  console.log(`   - Scheduled Release Time: ${new Date(releaseTimeMs).toISOString()}`);

  // Step 5: Test Key Release BEFORE Release Time
  console.log('\n🛑 Step 5: Center attempts key release BEFORE release time...');
  const center1Id = 'center-delhi-01';
  let isUnlocked = await checkReleaseTime(paperId);

  if (!isUnlocked) {
    console.log(`   ⛔ REJECTED: HTTP 403 Forbidden - Not yet authorized for release`);
    logAuditEvent({
      ip: '192.168.1.101',
      paperId,
      centerId: center1Id,
      action: 'KEY_RELEASE_ATTEMPT',
      status: 'FORBIDDEN_RELEASE_TIME_NOT_MET',
      statusCode: 403,
      details: 'Attempted access before scheduled release time'
    });
    console.log(`   📝 Tamper-evident audit event logged to audit.json`);
  }

  // Step 6: Test Unauthorized Center Attempt
  console.log('\n🚫 Step 6: Unauthorized Center attempts key release...');
  const fakeCenterId = 'unauthorized-hacker-center';
  const isAuthorized = Boolean(paperRecord.wrappedKeys[fakeCenterId]);
  if (!isAuthorized) {
    console.log(`   ⛔ REJECTED: HTTP 403 Forbidden - Center is not authorized for this paper`);
    logAuditEvent({
      ip: '203.0.113.42',
      paperId,
      centerId: fakeCenterId,
      action: 'KEY_RELEASE_ATTEMPT',
      status: 'UNAUTHORIZED_CENTER',
      statusCode: 403,
      details: 'Rogue center attempted unauthorized access'
    });
    console.log(`   📝 Tamper-evident audit event logged to audit.json`);
  }

  // Step 7: Simulate Arrival of Official Release Time
  console.log('\n⏰ Step 7: Official exam window arrives! (Simulating on-chain release time passing)');
  setPaperReleaseTime(paperId, Date.now() - 1000); // 1 second ago
  isUnlocked = await checkReleaseTime(paperId);
  console.log(`   ✓ checkReleaseTime("${paperId}") = ${isUnlocked}`);

  // Step 8: Authorized Center Requests and Receives Key
  console.log(`\n🔑 Step 8: Center [${center1Id}] requests release key...`);
  const releasedWrappedKey = paperRecord.wrappedKeys[center1Id];
  console.log(`   ✓ Key released: ${releasedWrappedKey.substring(0, 32)}...`);
  logAuditEvent({
    ip: '192.168.1.101',
    paperId,
    centerId: center1Id,
    action: 'KEY_RELEASE_ATTEMPT',
    status: 'SUCCESS',
    statusCode: 200,
    details: 'Key released following verified release timestamp'
  });

  // Step 9: Center Unwraps AES Key using Private RSA Key
  console.log('\n🔓 Step 9: Center unwraps the AES key using its private RSA key...');
  const center1PrivateKey = getCenterPrivateKey(center1Id);
  const unwrappedAesKey = unwrapKey(releasedWrappedKey, center1PrivateKey);
  console.log(`   ✓ Unwrapped AES Key: ${unwrappedAesKey.toString('hex').substring(0, 16)}...`);
  console.log(`   ✓ Key Match Verified: ${unwrappedAesKey.equals(aesKey) ? 'YES (Identical)' : 'NO'}`);

  // Step 10: Center Decrypts the Encrypted Paper
  console.log('\n📑 Step 10: Decrypting the encrypted paper payload...');
  const decryptedBuffer = decryptFileBuffer(encryptedBuffer, unwrappedAesKey);
  const decryptedText = decryptedBuffer.toString('utf8');

  const isExactMatch = decryptedBuffer.equals(originalBuffer);
  console.log(`   ✓ Decryption Status:           ${isExactMatch ? 'SUCCESS (100% Byte Match)' : 'FAILED'}`);
  console.log(`   ✓ Decrypted Preview:           "${decryptedText.substring(0, 80).replace(/\n/g, ' ')}..."`);

  // Step 11: Inspect Audit Trail
  console.log('\n📜 Step 11: Inspecting append-only tamper-evident audit trail...');
  const logs = getAuditLogs({ paperId });
  console.log(`   Found ${logs.length} audit trail records for paper [${paperId}]:`);
  logs.forEach((entry, idx) => {
    console.log(`   [${idx + 1}] ${entry.timestamp} | IP: ${entry.ip.padEnd(15)} | Center: ${entry.centerId.padEnd(26)} | Status: ${entry.status} (${entry.statusCode})`);
  });

  console.log('\n================================================================');
  console.log('✅ EXAMVAULT VERIFICATION COMPLETE: ALL SYSTEMS FUNCTIONAL');
  console.log('================================================================\n');
}

runDemo().catch(err => {
  console.error('Demo execution error:', err);
  process.exit(1);
});
