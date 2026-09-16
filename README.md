# 🛡️ ExamVault

> **Blockchain-Powered Secure Exam Paper Distribution & Tamper-Proof Audit System**

ExamVault eliminates pre-exam question paper leaks and unauthorized early access by combining **military-grade off-chain encryption** with **smart contract cryptographic timelocks and immutable on-chain audit trails**.

---

## 🚀 Quick Links & Specifications

- 📘 **[System Architecture & Contract Interface Specification (INTEGRATION_SPEC.md)](./INTEGRATION_SPEC.md)** — **Mandatory read for Contract, Backend, and Frontend tracks!** Contains:
  - Smart Contract ABI, structs, functions, and events (`ExamVault.sol`)
  - Backend REST API endpoints, schemas, and payload specifications
  - Frontend state machines, data shapes, and Web Crypto decryption pipeline
  - "The Glue" Data Compatibility Dictionary (avoiding timestamp & hex bugs)
  - 5-Step End-to-End Test & Simulation Procedure
  - Hackathon Judge Defense & Pitch Guide

---

## 👥 Hackathon Tracks & Team Roles

| Track | Owner / Focus | Core Deliverables |
| :--- | :--- | :--- |
| **Smart Contract** | Solidity Developer | `ExamVault.sol`, timelock logic, access control, audit events, test suite |
| **Backend** | API / Cloud Developer | Paper upload, AES-256-GCM encryption, IPFS/storage integration, key gating API |
| **Frontend** | UI / React Developer | Authority Admin Dashboard, Center Proctor Portal, countdown timers, in-browser PDF viewer |
| **Integration & Pitch** | Pranav / Lead Integrator | Interface alignment, end-to-end testing, bug triage, pitch script & demo rehearsal |

---

## 🔄 Git Workflow

1. All development happens on feature/track branches branched off `dev`:
   - `contract/<feature>`
   - `backend/<feature>`
   - `frontend/<feature>`
   - `Pranav/integration`
2. Never commit directly to `main`. Pull requests target `dev`.
3. Check the check-in matrix in [`INTEGRATION_SPEC.md`](./INTEGRATION_SPEC.md#6-️-2-3-hour-track-check-in-matrix) every 2-3 hours to prevent schema drift!