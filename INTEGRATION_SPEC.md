# 🔐 ExamVault — System Architecture & Integration Specification
> **Role:** Integration & Systems Architect Reference Doc  
> **Status:** Active Working Specification (Living Document)  
> **Target System:** Blockchain-Powered Secure Exam Paper Distribution  
> **Branch:** `Pranav/integration`

---

## 📌 Executive Summary & Purpose

ExamVault prevents exam paper leaks by combining **cryptographic paper encryption (off-chain/storage)** with **smart contract timelocks and immutable access auditing (on-chain)**. 

### Core Guarantee:
No party—including exam centers, infrastructure admins, or network eavesdroppers—can decrypt or view the exam question paper before the scheduled `releaseTimestamp`. Every attempted access (authorized or premature) leaves a permanent, non-repudiable on-chain audit log.

This document is the **Single Source of Truth (SSOT)** for:
1. **Contract Track:** Functions, parameters, state variables, events, and revert errors.
2. **Backend Track:** REST endpoints, payload schemas, encryption standards, and on-chain relayer/validator logic.
3. **Frontend Track:** Component data shapes, state machines, wallet interactions, and user flows.
4. **Integration/Glue:** Data type conversions (BigInt, hex prefixes, timestamps), error handling, and test scripts.

---

## 🏛️ System Architecture Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Admin as 🎓 Exam Authority (Admin)
    actor Center as 🏫 Exam Center (Proctor)
    participant UI as 💻 Frontend Web App
    participant API as ⚙️ Backend API
    participant IPFS as 📦 Encrypted Storage (IPFS / S3)
    participant SC as ⛓️ Smart Contract (ExamVault.sol)

    %% Phase 1: Creation & Anchoring
    rect rgb(240, 248, 255)
    Note over Admin,SC: Phase 1: Exam Creation & Timelock Anchoring
    Admin->>UI: Upload Exam PDF, Set Release Time (T_release), Select Authorized Centers
    UI->>API: POST /api/exams/create (PDF + Metadata)
    API->>API: Generate AES-256 Key & IV; Encrypt PDF
    API->>IPFS: Store Encrypted PDF -> Returns IPFS CID / URI
    API->>API: Compute paperHash = keccak256(encryptedPayload)
    API->>SC: registerExam(examId, paperHash, releaseTimestamp, authorizedCenters[])
    SC-->>API: Emit ExamRegistered(examId, releaseTimestamp, paperHash)
    API-->>UI: { examId, paperHash, ipfsUri, txHash, status: "LOCKED" }
    end

    %% Phase 2: Premature Access Attempt
    rect rgb(255, 240, 240)
    Note over Center,SC: Phase 2: Early Access Test (Current Time < T_release)
    Center->>UI: Request Decryption Key before T_release
    UI->>SC: requestAccess(examId) [Center Wallet]
    SC-->>SC: Checks: block.timestamp >= releaseTimestamp? (FAILS!)
    SC-->>UI: Revert: TimelockActive(releaseTimestamp, currentTimestamp)
    SC-->>SC: Emit EarlyAccessAttempt(examId, centerAddress, block.timestamp)
    UI-->>Center: Alert: "Access Denied: Exam is timelocked until scheduled time!"
    end

    %% Phase 3: Legitimate Access at Exam Time
    rect rgb(240, 255, 240)
    Note over Center,SC: Phase 3: Timelock Expiry & Decryption (Current Time >= T_release)
    Center->>UI: Request Decryption Key at/after T_release
    UI->>SC: requestAccess(examId) [Center Wallet]
    SC-->>SC: Verify center is whitelisted && block.timestamp >= releaseTimestamp
    SC-->>UI: Success! Emit PaperAccessed(examId, centerAddress, block.timestamp)
    UI->>API: POST /api/exams/:id/release-key (Signed center signature / Tx proof)
    API->>API: Verify on-chain release status for center
    API-->>UI: Return Decryption Key + Encrypted File URL
    UI->>IPFS: Fetch Encrypted Paper
    UI->>UI: Decrypt AES-256 in browser memory -> Display in Secure Viewer
    end
```

---

## 1. ⛓️ Smart Contract Specification (`ExamVault.sol`)

### 1.1 State Variables & Structs

```solidity
struct Exam {
    bytes32 examId;              // Unique identifier (e.g., keccak256("EXAM_MATH_2026_01"))
    bytes32 paperHash;           // keccak256 hash of the encrypted PDF payload
    uint256 releaseTimestamp;    // Unix timestamp in SECONDS when paper can be unlocked
    address examAdmin;           // Address that registered the exam
    bool isCancelled;            // Emergency kill switch by admin
    mapping(address => bool) isAuthorizedCenter; // Whitelisted centers
    mapping(address => bool) hasAccessed;        // Record of successful center unlocks
}

struct AccessLog {
    bytes32 examId;
    address centerAddress;
    uint256 timestamp;
    bool success;
    string reason;               // e.g. "SUCCESS", "TIMELOCK_ACTIVE", "UNAUTHORIZED"
}
```

### 1.2 Function Signatures

| Function | Access | Params | Returns / Effects | Reverts On |
| :--- | :--- | :--- | :--- | :--- |
| `registerExam` | Admin Only | `bytes32 examId`, `bytes32 paperHash`, `uint256 releaseTimestamp`, `address[] centers` | Stores exam; emits `ExamRegistered` | Exam exists; `releaseTimestamp <= block.timestamp`; zero centers |
| `authorizeCenter` | Admin Only | `bytes32 examId`, `address center` | Whitelists an additional center | Exam not found; already authorized |
| `requestAccess` | Center Only | `bytes32 examId` | Logs center access, emits `PaperAccessed`, returns `bool success` | Not whitelisted (`UnauthorizedCenter`); Timelock active (`TimelockActive`); Exam cancelled |
| `getExamDetails` | Public | `bytes32 examId` | `(bytes32 paperHash, uint256 releaseTimestamp, address admin, bool isCancelled)` | Exam not found |
| `isCenterAuthorized`| Public | `bytes32 examId`, `address center` | `bool` | Exam not found |
| `hasCenterAccessed` | Public | `bytes32 examId`, `address center` | `bool` | Exam not found |
| `logEarlyAttempt` | Public | `bytes32 examId` | Emits `EarlyAccessAttempt` for audit tracking | Exam not found |

### 1.3 Events (Audit Log Engine)

```solidity
event ExamRegistered(
    bytes32 indexed examId, 
    bytes32 indexed paperHash, 
    uint256 releaseTimestamp, 
    address admin
);

event PaperAccessed(
    bytes32 indexed examId, 
    address indexed centerAddress, 
    uint256 accessTimestamp
);

event EarlyAccessAttempt(
    bytes32 indexed examId, 
    address indexed centerAddress, 
    uint256 attemptTimestamp
);

event ExamCancelled(
    bytes32 indexed examId, 
    address admin, 
    uint256 timestamp
);
```

### 1.4 Custom Errors (Gas Efficient & Clear Diagnostics)

```solidity
error ExamAlreadyExists(bytes32 examId);
error ExamNotFound(bytes32 examId);
error UnauthorizedCenter(address caller);
error TimelockActive(uint256 releaseTime, uint256 currentTime);
error ExamIsCancelled(bytes32 examId);
error InvalidReleaseTime(uint256 releaseTime);
```

---

## 2. ⚙️ Backend API Specification

**Base URL:** `http://localhost:5000/api` (or configured port)  
**Standard Response Envelope:**
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

### 2.1 Endpoints Overview

#### `POST /api/exams/create` (Admin)
- **Role:** Uploads exam paper, generates encryption key, stores encrypted artifact, and preps on-chain data.
- **Request Type:** `multipart/form-data`
  - `title`: string (e.g. "Physics Final 2026")
  - `examCode`: string (e.g. "PHY-2026-F")
  - `releaseTime`: ISO string / Unix seconds (e.g. `1789542000`)
  - `authorizedCenters`: JSON string array of EVM addresses `["0x70997970C51812dc3A010C7d01b50e0d17dc79C8"]`
  - `file`: PDF file buffer
- **Processing Logic:**
  1. Generate random 256-bit AES key (`cipherKey`) and 12-byte IV (`initializationVector`).
  2. Encrypt PDF using `AES-256-GCM`.
  3. Upload encrypted file to IPFS / local mock storage -> get `storageUri` / `ipfsHash`.
  4. Compute `paperHash = keccak256(encryptedBytes)`.
  5. Store exam metadata and securely store `cipherKey` (gated by release policy or center asymmetric public keys).
- **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "examId": "0x4f87a... (bytes32 hex)",
    "title": "Physics Final 2026",
    "paperHash": "0x9a3e1... (bytes32 hex)",
    "releaseTimestamp": 1789542000,
    "storageUri": "ipfs://QmXyz... or http://localhost:5000/storage/...",
    "authorizedCenters": ["0x70997970C51812dc3A010C7d01b50e0d17dc79C8"],
    "status": "SCHEDULED"
  }
}
```

---

#### `GET /api/exams` (Public / Center)
- **Role:** Lists exams available for a center or admin dashboard.
- **Query Params:** `?centerAddress=0x...` (optional filter)
- **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "examId": "0x4f87a...",
      "title": "Physics Final 2026",
      "examCode": "PHY-2026-F",
      "releaseTimestamp": 1789542000,
      "storageUri": "ipfs://QmXyz...",
      "paperHash": "0x9a3e1...",
      "isUnlocked": false,
      "status": "LOCKED" // "LOCKED" | "READY_TO_UNLOCK" | "ACCESSED" | "CANCELLED"
    }
  ]
}
```

---

#### `POST /api/exams/:examId/request-key` (Center)
- **Role:** Center requests the symmetric decryption key after `releaseTimestamp` and on-chain verification.
- **Request Body:**
```json
{
  "centerAddress": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "txHash": "0xabc123... (on-chain requestAccess transaction)",
  "signature": "0x... (signed auth token confirming identity)"
}
```
- **Validation:**
  - Check contract state: has `block.timestamp >= releaseTimestamp` passed?
  - Verify `txHash` emitted `PaperAccessed` or center is authorized.
- **Response if Early / Forbidden (403 Forbidden):**
```json
{
  "success": false,
  "error": {
    "code": "TIMELOCK_STILL_ACTIVE",
    "message": "Paper decryption key is locked until 1789542000. Current time is 1789541500.",
    "secondsRemaining": 500
  }
}
```
- **Response if Ready (200 OK):**
```json
{
  "success": true,
  "data": {
    "examId": "0x4f87a...",
    "decryptionKey": "base64-or-hex-encoded-aes-key",
    "iv": "base64-or-hex-encoded-iv",
    "authTag": "base64-or-hex-encoded-auth-tag",
    "storageUri": "http://localhost:5000/storage/..."
  }
}
```

---

#### `GET /api/exams/:examId/audit-logs` (Admin / Auditor)
- **Role:** Aggregates both on-chain events (`ExamRegistered`, `PaperAccessed`, `EarlyAccessAttempt`) and server timestamps for full auditability.
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "examId": "0x4f87a...",
    "events": [
      {
        "type": "EXAM_REGISTERED",
        "actor": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        "timestamp": 1789540000,
        "blockNumber": 1042301,
        "txHash": "0x111..."
      },
      {
        "type": "EARLY_ATTEMPT_DENIED",
        "actor": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        "timestamp": 1789541500,
        "blockNumber": 1042350,
        "txHash": "0x222...",
        "notes": "Rejected by contract timelock (500s early)"
      },
      {
        "type": "PAPER_ACCESSED",
        "actor": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        "timestamp": 1789542005,
        "blockNumber": 1042400,
        "txHash": "0x333...",
        "notes": "Decryption authorized and delivered"
      }
    ]
  }
}
```

---

## 3. 💻 Frontend Specification

### 3.1 Portal Personas
1. **Admin / Authority Dashboard (`/admin`):**
   - **Form:** Exam creation (title, paper upload, release time picker, center list).
   - **Transaction Modal:** Triggering contract `registerExam` or viewing backend tx.
   - **Live Audit Stream:** Displays events queried directly from contract RPC + backend sync.
2. **Center / Proctor Dashboard (`/center`):**
   - **Wallet Connection:** Displays connected center address and badge (`Authorized` / `Not Whitelisted`).
   - **Exams Table:** Displays list of assigned exams with:
     - Title & Code
     - Scheduled Release Time
     - Live Countdown Timer (`HH:MM:SS remaining`)
     - Status Pills: `LOCKED` (grey), `COUNTDOWN` (amber), `UNLOCKED` (green), `EARLY_ATTEMPT_LOGGED` (red)
     - **Action Button:**
       - Before time: Clicking triggers `Try Early Access` -> Shows simulated rejection modal with on-chain proof.
       - At/after time: `Unlock & Decrypt` -> Prompts wallet signature / transaction -> Fetches key -> Decrypts & renders PDF inside an in-app viewer.

### 3.2 In-Memory Decryption Pipeline (Client-Side)
```javascript
// Step 1: Fetch encrypted binary arrayBuffer from storageUri
const encryptedBuffer = await fetch(storageUri).then(r => r.arrayBuffer());

// Step 2: Use Web Crypto API or subtle crypto with key & iv from backend
const key = await window.crypto.subtle.importKey(
  "raw", 
  rawKeyBytes, 
  { name: "AES-GCM" }, 
  false, 
  ["decrypt"]
);

// Step 3: Decrypt
const decryptedPdfBytes = await window.crypto.subtle.decrypt(
  { name: "AES-GCM", iv: ivBytes },
  key,
  encryptedBuffer
);

// Step 4: Render in Secure Object URL or PDF viewer
const blob = new Blob([decryptedPdfBytes], { type: "application/pdf" });
const pdfUrl = URL.createObjectURL(blob);
```

---

## 4. 🧩 "The Glue": Data Compatibility Dictionary

| Concept | Smart Contract | Backend API | Frontend App | Pitfall Prevention |
| :--- | :--- | :--- | :--- | :--- |
| **Exam ID** | `bytes32` (`0x...` 64 hex chars) | Hex string (`"0x4f87..."`) | String (`"0x4f87..."`) | Always pad/hash string ID with `ethers.id("...")` or `keccak256` |
| **Paper Hash** | `bytes32` (`0x...` 64 hex chars) | Hex string (`"0x9a3e..."`) | String (`"0x9a3e..."`) | Must match exact SHA-256 or Keccak-256 of encrypted PDF bytes |
| **Release Time**| `uint256` (**SECONDS**) | Integer/Number (**SECONDS**) | Date object / Unix ms | ⚠️ **DO NOT PASS MILLISECONDS TO CONTRACT!** Divide JS `Date.now() / 1000` |
| **Addresses** | `address` (20 bytes checksummed) | String (`"0x7099..."`) | String (`"0x7099..."`) | Always normalize with `ethers.getAddress(addr)` for comparison |
| **Auth Tokens** | N/A | Bearer JWT or Signed Message | EIP-712 / `personal_sign` | Center signs `ExamVault: Request ${examId}` |

---

## 5. 🧪 End-to-End Integration Verification Script

When testing integration across contract, backend, and frontend, run through this 5-step test sequence:

```
[Step 1: Exam Anchoring]
  Admin uploads Exam PDF -> Encrypted -> Hash anchored on-chain.
  PASS criteria: Event `ExamRegistered` emitted with matching paperHash.

[Step 2: Timelock Enforcement (Negative Test)]
  Center attempts to unlock paper 10 minutes prior to scheduled release.
  PASS criteria: 
    - Contract reverts with `TimelockActive` (or backend returns 403 `TIMELOCK_STILL_ACTIVE`).
    - Event `EarlyAccessAttempt` is logged on-chain.
    - Frontend displays crisp warning explaining timelock is enforcing security.

[Step 3: Time Simulation]
  Advance local block timestamp (or wait in real time):
  `await network.provider.send("evm_increaseTime", [600]);`
  `await network.provider.send("evm_mine");`

[Step 4: Authorized Release]
  Center attempts unlock when `block.timestamp >= releaseTimestamp`.
  PASS criteria:
    - Contract emits `PaperAccessed`.
    - Backend releases AES key.
    - Frontend decrypts PDF in-memory and displays document.

[Step 5: Audit Trail Verification]
  Admin reviews Audit Dashboard.
  PASS criteria:
    - Both early attempt (rejected) and authorized attempt (approved) are listed with immutable block numbers and tx hashes.
```

---

## 6. ⏱️ 2-3 Hour Track Check-In Matrix

Use this tracker for every sync with Contract, Backend, and Frontend owners:

| Track | Current Output / Deliverable | Target Input Expected | Blocker / Mismatch Alert | Next Action |
| :--- | :--- | :--- | :--- | :--- |
| **Smart Contract** | `ExamVault.sol` draft, local testnet deployment | Compiler version (0.8.20+), ABI export format | Are events indexing `examId` and `centerAddress`? | Export ABI & deployed address to `contracts/abi/` |
| **Backend** | Upload & AES-256-GCM encryption script | Contract deployed address + RPC provider | Storage location: IPFS vs mock S3; key gating rule | Wire `/api/exams/create` to contract relayer |
| **Frontend** | UI Mockup / Dashboard views | REST endpoint URLs + Contract ABI | Ethers v6 vs Viem; Wallet connect library | Wire countdown timer and early attempt button |

---

## 7. 🏆 Pitch & Hackathon Judge Defense Cheat Sheet

### Judge Question 1: *"Why blockchain? Why not just an AWS SQL database with an audit log table?"*
> **Answer:** *"In high-stakes exams (like national entrance tests or bar exams), the threat model includes corrupt insiders or compromised infrastructure admins. In a centralized database, a DBA or cloud administrator can quietly modify the exam release timestamp, decrypt papers early, or delete audit logs after the fact with zero trace.  
ExamVault uses the blockchain as an **immutable, decentralized notary and timelock**: the scheduled release time cannot be altered once mined, early access attempts are permanently broadcast and audited, and access permissions are mathematically enforced across independent nodes."*

### Judge Question 2: *"What if an exam center's private key leaks before the exam?"*
> **Answer:** *"Even if a rogue attacker steals a center's private key 24 hours before the exam, the smart contract's `TimelockActive` check unconditionally prevents key release until `block.timestamp >= releaseTimestamp`. The leak gives them zero access advantage. Furthermore, if a compromise is detected early, the authority can invoke `authorizeCenter` or emergency revocation before the timelock expires."*

### Judge Question 3: *"Is the question paper itself stored on-chain?"*
> **Answer:** *"No. Storing large PDFs on-chain is gas-prohibitive and insecure. We store an **AES-256 encrypted payload on decentralized storage (IPFS/S3)** and anchor only the cryptographic **hash and timelock on-chain**. The blockchain acts as the trust, audit, and timelock coordination layer, while heavy media stays off-chain."*
