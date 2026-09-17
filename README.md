# ExamVault 🛡️📜

> **Secure, tamper-evident exam paper distribution using blockchain as a cryptographic anchor (not file storage).**

ExamVault solves the problem of pre-exam paper leaks, unauthorized early access, and tampering by combining **off-chain encryption** (stored on IPFS, Arweave, or secure cloud storage) with **on-chain cryptographic commitments**, **role-based access control**, **time-locked authorization**, and an **unfakeable on-chain audit trail**.

---

## 🏛️ Core Architecture

```
+---------------------------+                +---------------------------+
|   Off-Chain File Storage  |                |   ExamVault Smart Contract|
|  (Encrypted Exam Bundle)  |                |     (Sepolia Testnet)     |
+---------------------------+                +---------------------------+
              |                                            |
              | 1. SHA-256 Hash of encrypted file          |
              +------------------------------------------->| registerPaper() [Admin Only]
                                                           | - Time Lock (releaseTime)
                                                           | - Authorized Center Whitelist
                                                           |
  [Exam Center / Invigilator]                              |
              | 2. Requests Access at exam start           |
              +------------------------------------------->| logAccess(paperId)
                                                           | - Checks block.timestamp >= releaseTime
                                                           | - Checks CENTER_ROLE & whitelist
                                                           | - Emits AccessLogged() audit event
                                                           |
  [Independent Auditor / Judge]                            |
              | 3. Verifies off-chain package integrity    |
              +------------------------------------------->| verifyHash(paperId, fileHash)
```

---

## ⚙️ Key Smart Contract Features (`ExamVault.sol`)

1. **Role-Based Access Control (OpenZeppelin `AccessControl`)**:
   - `ADMIN_ROLE`: Registers exam papers, grants/revokes center and auditor roles.
   - `CENTER_ROLE`: Exam centers and invigilators allowed to request/log access to papers.
   - `AUDITOR_ROLE`: Independent regulatory bodies and audit observers.
2. **Paper Registration (`registerPaper`)**:
   - Stores `paperId`, `encryptedFileHash` (`bytes32`), `releaseTime` (epoch timestamp), and `authorizedCenters` (`address[]`).
   - Emits `PaperRegistered(paperId, encryptedFileHash, releaseTime)`.
3. **Time-Locked Access Guard (`isReleaseAllowed`)**:
   - Verifies whether `block.timestamp >= releaseTime` AND the requester is in the authorized center list.
4. **On-Chain Audit Trail (`logAccess`)**:
   - Only callable by accounts with `CENTER_ROLE`.
   - Reverts if called before the release timestamp or if the center is unauthorized.
   - Emits `AccessLogged(paperId, center, block.timestamp, true)` — providing an immutable, non-repudiable proof of paper access.
5. **Integrity Check (`verifyHash`)**:
   - Public view function allowing anyone (students, centers, auditors) to verify that an off-chain encrypted file matches the original registered hash.
6. **Detailed Getters**:
   - `getPaperDetails(paperId)`: Returns hash, release time, and authorized centers list.
   - `getTimeUntilRelease(paperId)`: Dynamic countdown helper.

---

## 🧪 Quick Test & Demo Guide in Remix IDE

Follow these steps to demonstrate the full workflow to hackathon judges in **[Remix IDE](https://remix.ethereum.org)**:

### 1. Compile the Contract in Remix
1. Create a file named `ExamVault.sol` under Remix `contracts/` directory and paste the contents of [`contracts/ExamVault.sol`](file:///c:/Antigravity/ExamVault/ExamVault/contracts/ExamVault.sol).
2. In the **Solidity Compiler** tab:
   - Compiler Version: `0.8.20`
   - Enable Optimization (optional, recommended 200 runs)
   - Click **Compile ExamVault.sol**. Remix automatically downloads OpenZeppelin dependencies.

---

### 2. Deploy the Contract (Remix VM or Sepolia)
1. Go to the **Deploy & Run Transactions** tab.
2. Under **Environment**, choose:
   - `Remix VM (Prague / Cancun / Shanghai)` for instant local testing, or
   - `Injected Provider - MetaMask` (select **Sepolia testnet**) for live blockchain deployment.
3. Select `Account 1` (this will be the **Admin**).
4. Click **Deploy**.

---

### 3. Step-by-Step Hackathon Demo Steps

#### Step A: Grant `CENTER_ROLE` to Exam Center
1. Copy the address of `Account 2` (this will act as **Exam Center 1**).
2. Copy `CENTER_ROLE` hash by clicking the `CENTER_ROLE` button under deployed contracts:
   ```
   0xb12933f78996b177d6ee2c85e2fc5a68735231c51086036814674061a9bf1ad0
   ```
3. With `Account 1` (Admin) selected:
   - Call `grantRole(role, account)`:
     - `role`: `0xb12933f78996b177d6ee2c85e2fc5a68735231c51086036814674061a9bf1ad0`
     - `account`: `[Address of Account 2]`
   - Click **transact**.

#### Step B: Register a Paper (Admin Only)
1. Get the current Unix timestamp (e.g., from [unixtimestamp.com](https://www.unixtimestamp.com) or run `Math.floor(Date.now()/1000)` in browser console).
2. Set `releaseTime` to **current time + 120 seconds** (e.g., if now is `1773700000`, set `1773700120`).
3. Prepare a sample 32-byte SHA-256 hash:
   ```
   0x3a7bd3e2360a3d29eea436fcfb7e44c735d117c42d1c1835420b6b9942dd4f1b
   ```
4. Expand `registerPaper` in Remix and fill:
   - `paperId`: `"CS101-FINALS-2026"`
   - `encryptedFileHash`: `0x3a7bd3e2360a3d29eea436fcfb7e44c735d117c42d1c1835420b6b9942dd4f1b`
   - `releaseTime`: `[Timestamp in Step 2]`
   - `authorizedCenters`: `["0xYourAccount2AddressHere"]`
5. Click **transact**. Notice the emitted `PaperRegistered` event in the Remix terminal logs!

#### Step C: Try Early Access (Should Revert ❌)
1. In Remix, switch the active **Account** dropdown to `Account 2` (Exam Center).
2. Call `isReleaseAllowed("CS101-FINALS-2026", Account2Address)`:
   - Returns: **`false`**.
3. Now call `logAccess("CS101-FINALS-2026")`:
   - 🔴 **Transaction Reverts!** Revert error `AccessNotAllowed`.
   - *Judge Takeaway*: Even authorized centers cannot decrypt or access the paper early.

#### Step D: Advance Time & Access Paper (Succeeds ✅)
- **If testing in Remix VM**:
  - In Remix's console, or simply wait for the 120 seconds to elapse (or if using Remix VM time jump feature / Hardhat network `evm_increaseTime`).
- **If testing on Sepolia Testnet**:
  - Wait the 2 minutes until block time passes `releaseTime`.
1. Call `isReleaseAllowed("CS101-FINALS-2026", Account2Address)`:
   - Returns: **`true`**.
2. Call `logAccess("CS101-FINALS-2026")` with `Account 2`:
   - 🟢 **Transaction Succeeds!**
   - Inspect transaction receipt in Remix console or Sepolia Etherscan:
     - Event **`AccessLogged`** is emitted with `paperId`, `center`, and exact `timestamp`.
   - *Judge Takeaway*: The audit trail is permanently anchored on Ethereum.

#### Step E: Verify Off-Chain File Integrity
1. Check with the correct hash:
   - `verifyHash("CS101-FINALS-2026", "0x3a7bd3e2360a3d29eea436fcfb7e44c735d117c42d1c1835420b6b9942dd4f1b")`
   - Returns: **`true`** ✅
2. Check with an altered/tampered hash:
   - `verifyHash("CS101-FINALS-2026", "0x0000000000000000000000000000000000000000000000000000000000000001")`
   - Returns: **`false`** ❌

---

## 💻 Local Hardhat Testing

ExamVault comes with a full automated test suite:

```bash
# Run the complete test suite
npx hardhat test
```

Result:
```
  ExamVault Smart Contract
    Access Control & Initialization
      ✔ Deployer should have ADMIN_ROLE and DEFAULT_ADMIN_ROLE
      ✔ Admin can grant and revoke CENTER_ROLE and AUDITOR_ROLE
      ✔ Non-admin cannot grant roles
    Paper Registration
      ✔ Admin can register a paper and emit PaperRegistered event
      ✔ Cannot register the same paper ID twice
      ✔ Cannot register with release time in the past or now
      ✔ Non-admin cannot register a paper
    Time-Locked Access Check & Logging
      ✔ Early access: isReleaseAllowed returns false before release time
      ✔ Early access: logAccess reverts when release time is in the future
      ✔ After time warp: isReleaseAllowed returns true for authorized center
      ✔ After time warp: logAccess succeeds and emits AccessLogged event
      ✔ Unauthorized center cannot access even after release time
      ✔ Non-CENTER_ROLE account cannot call logAccess even if authorized and unlocked
    Integrity Verification
      ✔ verifyHash returns true for matching hash
      ✔ verifyHash returns false for tampered hash
      ✔ verifyHash returns false for unregistered paper

  16 passing (2s)
```