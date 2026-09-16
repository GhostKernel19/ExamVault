import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { uploadPaperToBackend } from '../services/apiService';
import { registerPaperOnContract } from '../services/contractService';
import { SEPOLIA_CONFIG } from '../config/contract';
import { FileUpIcon, LockIcon, CheckCircleIcon, ClockIcon, UsersIcon, ExternalLinkIcon, AlertTriangleIcon, RefreshCwIcon } from '../components/Icons';

export const AdminUpload = () => {
  const { account, signer, isSepolia, demoMode, connectWallet, switchToSepolia } = useWallet();

  // Form states
  const [paperId, setPaperId] = useState('');
  const [subjectTitle, setSubjectTitle] = useState('');
  const [file, setFile] = useState(null);
  const [releaseDateTime, setReleaseDateTime] = useState('');
  const [authorizedCentersInput, setAuthorizedCentersInput] = useState('');

  // UI / Submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 1: backend upload, 2: metamask sign, 3: mined
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [txResult, setTxResult] = useState(null);

  // Quick fill helper for live hackathon demo
  const handleQuickFill = () => {
    const defaultCenter = account || "0x71C80e4C92e3532C3A50058bDb63B9B972FE3e2C";
    const demoCenter2 = "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199";
    
    // Set release date 10 minutes in the future for demo
    const futureDate = new Date(Date.now() + 10 * 60 * 1000);
    const localIso = new Date(futureDate.getTime() - futureDate.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    setPaperId(`EXAM-CS-${Math.floor(100 + Math.random() * 900)}`);
    setSubjectTitle('Advanced Cryptography & Distributed Systems');
    setReleaseDateTime(localIso);
    setAuthorizedCentersInput(`${defaultCenter}, ${demoCenter2}`);
    setErrorMessage('');
  };

  // Drag and drop handler
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setErrorMessage('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setTxResult(null);

    // Form validations
    if (!file) {
      setErrorMessage('Please select an exam paper file to encrypt and upload.');
      return;
    }
    if (!paperId.trim()) {
      setErrorMessage('Please provide a unique Paper ID.');
      return;
    }
    if (!releaseDateTime) {
      setErrorMessage('Please select an exam release date and time.');
      return;
    }

    // Parse and validate authorized centers
    const centers = authorizedCentersInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (centers.length === 0) {
      setErrorMessage('Please specify at least one authorized exam center address.');
      return;
    }

    const invalidAddress = centers.find(c => !/^0x[a-fA-F0-9]{40}$/.test(c));
    if (invalidAddress) {
      setErrorMessage(`Invalid Ethereum address detected: "${invalidAddress}". Must be a 42-character hex address.`);
      return;
    }

    // Ensure wallet is connected
    if (!account && !demoMode) {
      setErrorMessage('Please connect your MetaMask wallet before registering the paper on-chain.');
      return;
    }

    const releaseTimestampSeconds = Math.floor(new Date(releaseDateTime).getTime() / 1000);
    if (isNaN(releaseTimestampSeconds)) {
      setErrorMessage('Invalid date/time format.');
      return;
    }

    setIsSubmitting(true);

    try {
      // ------------------------------------------------------------------------
      // STEP 1: POST file to backend endpoint /api/paper/upload
      // ------------------------------------------------------------------------
      setCurrentStep(1);
      setStatusMessage('Encrypting and uploading paper file to backend repository...');
      
      const uploadResponse = await uploadPaperToBackend(file, paperId);
      const encryptedFileHash = uploadResponse.encryptedFileHash;

      // ------------------------------------------------------------------------
      // STEP 2 & 3: Register on Smart Contract
      // registerPaper(paperId, encryptedFileHash, releaseTime, authorizedCenters)
      // ------------------------------------------------------------------------
      setCurrentStep(2);
      setStatusMessage('Please confirm the registerPaper transaction in MetaMask...');

      const contractResponse = await registerPaperOnContract({
        signer,
        paperId,
        encryptedFileHash,
        releaseTime: releaseTimestampSeconds,
        authorizedCenters: centers,
        useSimulation: demoMode
      });

      setCurrentStep(3);
      setStatusMessage('Paper successfully registered on Sepolia testnet!');

      setTxResult({
        paperId,
        subjectTitle,
        encryptedFileHash,
        releaseTimestamp: releaseTimestampSeconds,
        releaseDateFormatted: new Date(releaseTimestampSeconds * 1000).toLocaleString(),
        authorizedCenters: centers,
        transactionHash: contractResponse.transactionHash,
        blockNumber: contractResponse.blockNumber,
        isSimulated: contractResponse.isSimulated,
        backendNotice: uploadResponse.fallbackNotice
      });

    } catch (err) {
      console.error('Registration failed:', err);
      setErrorMessage(err.message || 'An error occurred during paper registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-badge">ADMINISTRATION PORTAL</div>
        <h1 className="page-title">Register & Seal Exam Paper</h1>
        <p className="page-description">
          Encrypt and upload exam questions, lock distribution until exact exam start time,
          and register authorized center public keys onto the immutable blockchain ledger.
        </p>
      </div>

      <div className="grid-layout">
        {/* Left Column: Registration Form */}
        <div className="card-panel">
          <div className="card-header">
            <div className="card-title-group">
              <LockIcon className="accent-icon" size={20} />
              <h2>Paper Registration Form</h2>
            </div>
            <button
              type="button"
              className="btn-text-action"
              onClick={handleQuickFill}
            >
              Demo Auto-Fill
            </button>
          </div>

          <form onSubmit={handleSubmit} className="form-stack">
            {/* Paper ID & Subject */}
            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="paper-id-input">
                  Paper ID <span className="req">*</span>
                </label>
                <input
                  id="paper-id-input"
                  type="text"
                  placeholder="e.g. MATH-2026-FINAL"
                  value={paperId}
                  onChange={(e) => setPaperId(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="subject-input">Exam Subject / Title</label>
                <input
                  id="subject-input"
                  type="text"
                  placeholder="e.g. Cryptography & Security"
                  value={subjectTitle}
                  onChange={(e) => setSubjectTitle(e.target.value)}
                />
              </div>
            </div>

            {/* File Upload Box */}
            <div className="form-group">
              <label>
                Exam Paper Document (PDF, DOCX) <span className="req">*</span>
              </label>
              <div className={`file-drop-zone ${file ? 'has-file' : ''}`}>
                <input
                  id="file-upload-input"
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.doc,.txt"
                  className="file-input-hidden"
                />
                <label htmlFor="file-upload-input" className="file-drop-label">
                  <FileUpIcon className="file-icon" size={32} />
                  {file ? (
                    <div className="file-selected-info">
                      <span className="file-name">{file.name}</span>
                      <span className="file-meta">
                        {(file.size / 1024).toFixed(1)} KB • Ready for AES encryption
                      </span>
                    </div>
                  ) : (
                    <div>
                      <p className="file-prompt">Click or drag & drop exam paper here</p>
                      <p className="file-subtext">Backend encrypts via AES-256 before hashing</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Release Date/Time Picker */}
            <div className="form-group">
              <label htmlFor="release-time-input">
                <ClockIcon size={16} /> Exam Release Date & Time (Time-Lock Release) <span className="req">*</span>
              </label>
              <input
                id="release-time-input"
                type="datetime-local"
                value={releaseDateTime}
                onChange={(e) => setReleaseDateTime(e.target.value)}
                required
              />
              <span className="helper-text">
                Centers cannot unlock or decrypt the paper before this timestamp.
              </span>
            </div>

            {/* Authorized Centers Input */}
            <div className="form-group">
              <label htmlFor="centers-input">
                <UsersIcon size={16} /> Authorized Center Wallet Addresses (Comma-Separated) <span className="req">*</span>
              </label>
              <textarea
                id="centers-input"
                rows="3"
                placeholder="0x71C80e4C92e3532C3A50058bDb63B9B972FE3e2C, 0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199"
                value={authorizedCentersInput}
                onChange={(e) => setAuthorizedCentersInput(e.target.value)}
                required
              />
              <span className="helper-text">
                RBAC Access Control: Only wallets listed here can trigger decryption key release.
              </span>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="alert-box error">
                <AlertTriangleIcon size={18} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Stepper / Progress when submitting */}
            {isSubmitting && (
              <div className="submission-progress-card">
                <div className="spinner-row">
                  <RefreshCwIcon className="spin-animation" size={18} />
                  <span className="progress-status-text">{statusMessage}</span>
                </div>
                <div className="stepper-dots">
                  <span className={`step-dot ${currentStep >= 1 ? 'active' : ''}`}>1. Backend Encrypt</span>
                  <span className={`step-dot ${currentStep >= 2 ? 'active' : ''}`}>2. Sign Contract</span>
                  <span className={`step-dot ${currentStep >= 3 ? 'active' : ''}`}>3. Mined On-Chain</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="form-actions">
              {!account && !demoMode ? (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={connectWallet}
                >
                  Connect MetaMask to Submit
                </button>
              ) : (
                <button
                  id="btn-register-paper"
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Registering On-Chain...' : 'Register Paper on Sepolia'}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Column: Information & Confirmation Card */}
        <div className="info-panel-stack">
          {/* Confirmation Receipt once mined */}
          {txResult ? (
            <div className="card-panel success-card">
              <div className="card-header">
                <div className="card-title-group">
                  <CheckCircleIcon className="success-icon" size={22} />
                  <h2>Paper Successfully Sealed!</h2>
                </div>
                {txResult.isSimulated && (
                  <span className="badge-pill warning">Simulated TX</span>
                )}
              </div>

              <div className="receipt-details">
                <div className="receipt-item">
                  <span className="receipt-label">Paper ID</span>
                  <span className="receipt-value mono highlight">{txResult.paperId}</span>
                </div>

                <div className="receipt-item">
                  <span className="receipt-label">Encrypted File Hash (SHA-256)</span>
                  <span className="receipt-value mono break-all">{txResult.encryptedFileHash}</span>
                </div>

                <div className="receipt-item">
                  <span className="receipt-label">Release Time</span>
                  <span className="receipt-value">{txResult.releaseDateFormatted}</span>
                </div>

                <div className="receipt-item">
                  <span className="receipt-label">Transaction Hash</span>
                  <div className="tx-link-row">
                    <span className="receipt-value mono">{txResult.transactionHash.substring(0, 16)}...</span>
                    {!txResult.isSimulated && (
                      <a
                        href={`${SEPOLIA_CONFIG.blockExplorerUrls[0]}/tx/${txResult.transactionHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="external-link"
                      >
                        Sepolia Etherscan <ExternalLinkIcon size={14} />
                      </a>
                    )}
                  </div>
                </div>

                <div className="receipt-item">
                  <span className="receipt-label">Block Height</span>
                  <span className="receipt-value mono">#{txResult.blockNumber}</span>
                </div>

                <div className="receipt-item">
                  <span className="receipt-label">Authorized Centers ({txResult.authorizedCenters.length})</span>
                  <div className="centers-pill-list">
                    {txResult.authorizedCenters.map((addr, idx) => (
                      <span key={idx} className="center-address-chip" title={addr}>
                        {addr.substring(0, 8)}...{addr.substring(36)}
                      </span>
                    ))}
                  </div>
                </div>

                {txResult.backendNotice && (
                  <div className="receipt-notice">
                    <small>{txResult.backendNotice}</small>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card-panel protocol-info-card">
              <h3>ExamVault Cryptographic Flow</h3>
              <p className="subtext">How your paper is protected end-to-end:</p>

              <ul className="security-features-list">
                <li>
                  <div className="feature-icon"><LockIcon size={18} /></div>
                  <div>
                    <strong>Zero-Knowledge Paper Ingestion</strong>
                    <p>Exam papers are encrypted client/backend side before cryptographic SHA-256 digest is posted to Sepolia.</p>
                  </div>
                </li>
                <li>
                  <div className="feature-icon"><ClockIcon size={18} /></div>
                  <div>
                    <strong>Smart Contract Time-Locking</strong>
                    <p>The contract rejects any early key retrieval requests before <code>releaseTime</code>, enforcing university exam schedules.</p>
                  </div>
                </li>
                <li>
                  <div className="feature-icon"><UsersIcon size={18} /></div>
                  <div>
                    <strong>Center Role-Based Access (RBAC)</strong>
                    <p>Only pre-whitelisted exam center wallet public keys can sign and log access.</p>
                  </div>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
