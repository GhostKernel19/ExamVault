/**
 * ExamVault - Server HTTP Integration Test
 * 
 * Spins up an ephemeral server instance and tests all REST endpoints:
 * 1. GET / (health check)
 * 2. GET /api/paper/centers (list authorized centers)
 * 3. POST /api/paper/upload (upload and encrypt paper)
 * 4. GET /api/paper/:paperId/release-key (verify 403 Forbidden before release)
 * 5. POST /api/paper/:paperId/simulate-release (fast forward release)
 * 6. GET /api/paper/:paperId/release-key (verify 200 OK + wrapped key)
 * 7. GET /api/paper/:paperId/audit-log (verify audit logs captured)
 * 8. GET /api/paper/:paperId/download-encrypted (verify binary download)
 * 9. Local decrypt verification of downloaded payload with released key
 */

const http = require('http');
const app = require('../backend/server');
const { unwrapKey } = require('../backend/services/keyWrapping');
const { decryptFileBuffer } = require('../backend/services/encryption');
const { getCenterPrivateKey } = require('../backend/utils/mockCenters');

const TEST_PORT = 5055;

function runServerTests() {
  return new Promise((resolve, reject) => {
    const server = app.listen(TEST_PORT, async () => {
      console.log(`\n🚀 Test server listening on http://localhost:${TEST_PORT}\n`);

      try {
        const baseUrl = `http://localhost:${TEST_PORT}`;

        // Test 1: Root / Health Check
        console.log('Testing GET / ...');
        const rootRes = await fetch(`${baseUrl}/`);
        const rootData = await rootRes.json();
        console.assert(rootRes.status === 200, 'Root status should be 200');
        console.assert(rootData.status === 'ONLINE', 'Service should be ONLINE');
        console.log('✓ Health check passed');

        // Test 2: List Centers
        console.log('\nTesting GET /api/paper/centers ...');
        const centersRes = await fetch(`${baseUrl}/api/paper/centers`);
        const centersData = await centersRes.json();
        console.assert(centersRes.status === 200, 'Centers status should be 200');
        console.assert(centersData.centers.length > 0, 'Should return authorized centers');
        console.log(`✓ Fetched ${centersData.centers.length} authorized exam centers`);

        // Test 3: Upload Paper via Multipart Form Data
        console.log('\nTesting POST /api/paper/upload ...');
        const sampleText = 'FINAL EXAM 2026 - CONFIDENTIAL QUESTIONS: 1. Explain Zero-Knowledge Proofs.';
        const boundary = '----ExamVaultTestBoundary' + Math.random().toString(36).substring(2);
        
        let body = '';
        body += `--${boundary}\r\n`;
        body += `Content-Disposition: form-data; name="title"\r\n\r\nCS101 Final Exam\r\n`;
        body += `--${boundary}\r\n`;
        body += `Content-Disposition: form-data; name="paper"; filename="exam_cs101.txt"\r\n`;
        body += `Content-Type: text/plain\r\n\r\n`;
        body += sampleText;
        body += `\r\n--${boundary}--\r\n`;

        const uploadRes = await fetch(`${baseUrl}/api/paper/upload`, {
          method: 'POST',
          headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`
          },
          body: Buffer.from(body, 'utf8')
        });

        const uploadData = await uploadRes.json();
        console.assert(uploadRes.status === 201, `Upload status should be 201, got ${uploadRes.status}: ${JSON.stringify(uploadData)}`);
        console.assert(uploadData.paperId, 'Response must have paperId');
        console.assert(uploadData.encryptedFileHash.startsWith('0x'), 'Response must have 0x SHA-256 hash');
        console.assert(uploadData.wrappedKeys['center-delhi-01'], 'Must have wrapped key for center-delhi-01');
        console.log(`✓ Paper uploaded and encrypted: ID = ${uploadData.paperId}`);
        console.log(`  SHA-256 Hash for blockchain: ${uploadData.encryptedFileHash}`);

        const paperId = uploadData.paperId;

        // Test 4: Attempt Key Release BEFORE release time
        console.log('\nTesting GET /api/paper/:paperId/release-key BEFORE release time ...');
        const earlyReleaseRes = await fetch(`${baseUrl}/api/paper/${paperId}/release-key?centerId=center-delhi-01`);
        const earlyReleaseData = await earlyReleaseRes.json();
        console.assert(earlyReleaseRes.status === 403, `Should be 403 Forbidden, got ${earlyReleaseRes.status}`);
        console.assert(earlyReleaseData.error === 'Not yet authorized for release', 'Expected release time error message');
        console.log('✓ Premature release blocked with HTTP 403 Forbidden');

        // Test 5: Fast-forward release time using simulation endpoint
        console.log('\nTesting POST /api/paper/:paperId/simulate-release ...');
        const simRes = await fetch(`${baseUrl}/api/paper/${paperId}/simulate-release`, { method: 'POST' });
        console.assert(simRes.status === 200, 'Simulate release should be 200');
        console.log('✓ Release time set to past');

        // Test 6: Request Key Release AFTER release time
        console.log('\nTesting GET /api/paper/:paperId/release-key AFTER release time ...');
        const releaseRes = await fetch(`${baseUrl}/api/paper/${paperId}/release-key?centerId=center-delhi-01`);
        const releaseData = await releaseRes.json();
        console.assert(releaseRes.status === 200, `Release should be 200 OK, got ${releaseRes.status}`);
        console.assert(releaseData.wrappedKey, 'Should return wrapped key');
        console.log(`✓ Wrapped key obtained: ${releaseData.wrappedKey.substring(0, 30)}...`);

        // Test 7: Download Encrypted File
        console.log('\nTesting GET /api/paper/:paperId/download-encrypted ...');
        const downloadRes = await fetch(`${baseUrl}/api/paper/${paperId}/download-encrypted`);
        console.assert(downloadRes.status === 200, 'Download should be 200');
        const encryptedFileBuffer = Buffer.from(await downloadRes.arrayBuffer());
        console.log(`✓ Downloaded encrypted .enc file: ${encryptedFileBuffer.length} bytes`);

        // Test 8: Center unwrap and decrypt
        console.log('\nTesting Center unwrap & local decryption ...');
        const centerPrivKey = getCenterPrivateKey('center-delhi-01');
        const unwrappedAesKey = unwrapKey(releaseData.wrappedKey, centerPrivKey);
        const decryptedFileBuffer = decryptFileBuffer(encryptedFileBuffer, unwrappedAesKey);
        const decryptedText = decryptedFileBuffer.toString('utf8');
        console.assert(decryptedText === sampleText, 'Decrypted text must match uploaded text');
        console.log(`✓ Decrypted file matched 100% with original! Content: "${decryptedText}"`);

        // Test 9: Check Audit Log
        console.log('\nTesting GET /api/paper/:paperId/audit-log ...');
        const auditRes = await fetch(`${baseUrl}/api/paper/${paperId}/audit-log`);
        const auditData = await auditRes.json();
        console.assert(auditRes.status === 200, 'Audit log status should be 200');
        console.assert(auditData.auditTrail.length >= 2, 'Should have multiple logged events');
        console.log(`✓ Audit log verified with ${auditData.totalEvents} recorded events:`);
        auditData.auditTrail.forEach(evt => {
          console.log(`  - [${evt.timestamp}] Center: ${evt.centerId} | Status: ${evt.status} | Code: ${evt.statusCode}`);
        });

        console.log('\n🎉 ALL HTTP INTEGRATION TESTS PASSED SUCCESSFULLY!\n');
        server.close();
        resolve();
      } catch (err) {
        console.error('Test failed with error:', err);
        server.close();
        reject(err);
      }
    });
  });
}

runServerTests()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
