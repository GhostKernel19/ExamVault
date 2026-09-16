import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { checkIsReleaseAllowed, logAccessOnContract } from '../services/contractService';
import { fetchReleaseKey } from '../services/apiService';
import { SEPOLIA_CONFIG } from '../config/contract';
import { 
  KeyIcon, 
  LockIcon, 
  UnlockIcon, 
  CheckCircleIcon, 
  AlertTriangleIcon, 
  ClockIcon, 
  CopyIcon, 
  ExternalLinkIcon, 
  RefreshCwIcon,
  SearchIcon,
  WalletIcon
} from '../components/Icons';

export const CenterAccess = () => {
  const { account, signer, provider, demoMode, connectWallet } = useWallet();

  // Inputs & Verification State
  const [paperId, setPaperId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null); // { allowed, isAuthorized, isTimePassed, releaseTime }
  const [verificationError, setVerificationError] = useState('');

  // Access Logging & Key Release State
  const [isLoggingAccess, setIsLoggingAccess] = useState(false);
  const [accessTxResult, setAccessTxResult] = useState(null);
  const [releaseKeyResult, setReleaseKeyResult] = useState(null);
  const [keyCopied, setKeyCopied] = useState(false);

  // Quick select paper IDs for demo
  const samplePaperIds = ["CS-401-MIDTERM", "MATH-2026-FINAL", "BIO-302-EXAM"];

  // 1. Verify if Release is Allowed
  const handleVerifyRelease = async (e) => {
    e?.preventDefault();
    if (!paperId.trim()) {
      setVerificationError('Please enter a valid Paper ID to verify release status.');
      return;
    }

    const activeAddress = account || (demoMode ? "0x71C80e4C92e3532C3A50058bDb63B9B972FE3e2C" : null);
    if (!activeAddress) {
      setVerificationError('Please connect your MetaMask center wallet first.');
      return;
    }

    setIsVerifying(true);
    setVerificationError('');
    setVerificationResult(null);
    setAccessTxResult(null);
    setReleaseKeyResult(null);

    try {
      // Call contract's isReleaseAllowed(paperId, connectedAddress)
      const result = await checkIsReleaseAllowed({
        providerOrSigner: signer || provider,
        paperId: paperId.trim(),
        connectedAddress: activeAddress,
        useSimulation: demoMode
      });

      setVerificationResult(result);
    } catch (err) {
      console.error('Verification failed:', err);
      setVerificationError(err.message || 'Failed to check contract release permissions.');
    } finally {
      setIsVerifying(false);
    }
  };

  // 2. Call logAccess on-chain, then fetch release key from backend
  const handleLogAccessAndUnlock = async () => {
    if (!paperId.trim()) return;

    setIsLoggingAccess(true);
    setVerificationError('');

    try {
      // A) Call contract logAccess(paperId) on Sepolia
      const txResult = await logAccessOnContract({
        signer,
        paperId: paperId.trim(),
        useSimulation: demoMode
      });
      setAccessTxResult(txResult);

      // B) Fetch decryption key from backend /api/paper/:paperId/release-key
      const keyData = await fetchReleaseKey(paperId.trim(), account);
      setReleaseKeyResult(keyData);

    } catch (err) {
      console.error('Access logging / Key release failed:', err);
      setVerificationError(err.message || 'Failed to log access on blockchain or retrieve key.');
    } finally {
      setIsLoggingAccess(false);
    }
  };

  // Copy key helper
  const handleCopyKey = () => {
    if (releaseKeyResult?.key) {
      navigator.clipboard.writeText(releaseKeyResult.key);
      setKeyCopied(true);
      setTimeout(() => setKeyCopied(false), 2500);
    }
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-badge center">CENTER PORTAL</div>
        <h1 className="page-title">Authorized Center Paper Decryption</h1>
        <p className="page-description">
          Exam centers connect their authenticated hardware wallet, verify cryptographic release permission,
          commit an immutable access log on-chain, and obtain the session decryption key.
        </p>
      </div>

      {/* Wallet requirement warning */}
      {!account && !demoMode && (
        <div className="alert-box warning mb-6">
          <WalletIcon size={20} />
          <div className="alert-content">
            <strong>MetaMask Wallet Not Connected</strong>
            <p>You must connect the authorized center's Ethereum wallet to check release permissions and sign access logs.</p>
          </div>
          <button className="btn-secondary" onClick={connectWallet}>
            Connect Wallet
          </button>
        </div>
      )}

      {/* Main Search Panel */}
      <div className="card-panel mb-6">
        <div className="card-header">
          <div className="card-title-group">
            <SearchIcon className="accent-icon" size={20} />
            <h2>Check Paper Release Authorization</h2>
          </div>
          {account && (
            <span className="badge-pill info" title={account}>
              Connected Center: {account.substring(0, 6)}...{account.substring(account.length - 4)}
            </span>
          )}
        </div>

        <form onSubmit={handleVerifyRelease} className="paper-search-form">
          <div className="search-input-group">
            <input
              id="center-paper-id-input"
              type="text"
              placeholder="Enter Paper ID (e.g. CS-401-MIDTERM)"
              value={paperId}
              onChange={(e) => setPaperId(e.target.value)}
              className="search-input"
            />
            <button
              id="btn-verify-release"
              type="submit"
              className="btn-primary search-btn"
              disabled={isVerifying || (!account && !demoMode)}
            >
              {isVerifying ? (
                <>
                  <RefreshCwIcon className="spin-animation" size={16} /> Checking...
                </>
              ) : (
                'Check Release Status'
              )}
            </button>
          </div>

          {/* Quick selection chips */}
          <div className="quick-select-row">
            <span className="quick-label">Try sample papers:</span>
            {samplePaperIds.map((id) => (
              <button
                key={id}
                type="button"
                className="chip-btn"
                onClick={() => {
                  setPaperId(id);
                }}
              >
                {id}
              </button>
            ))}
          </div>
        </form>

        {verificationError && (
          <div className="alert-box error mt-4">
            <AlertTriangleIcon size={18} />
            <span>{verificationError}</span>
          </div>
        )}
      </div>

      {/* Verification Result Display */}
      {verificationResult && (
        <div className="verification-result-section">
          {verificationResult.allowed ? (
            /* ALLOWED / SUCCESS STATE */
            <div className="status-card allowed">
              <div className="status-header">
                <div className="status-badge allowed">
                  <UnlockIcon size={24} />
                  <span>RELEASE ALLOWED</span>
                </div>
                <span className="badge-pill success">Identity & Time-Lock Validated</span>
              </div>

              <div className="status-body">
                <h3>Exam Release Window Is Active</h3>
                <p>
                  Your wallet address has verified RBAC authorization for paper <strong>{paperId}</strong> and
                  the scheduled release timestamp has been reached. You may now commit the immutable
                  tamper-evident access log to Sepolia and retrieve the decryption key.
                </p>

                <div className="status-meta-grid">
                  <div className="meta-box">
                    <span className="meta-title">Center Address</span>
                    <span className="meta-val mono">{account || "0x71C80e4C92e3532C3A50058bDb63B9B972FE3e2C"}</span>
                  </div>
                  <div className="meta-box">
                    <span className="meta-title">Paper ID</span>
                    <span className="meta-val mono highlight">{paperId}</span>
                  </div>
                  <div className="meta-box">
                    <span className="meta-title">Contract Verification</span>
                    <span className="meta-val text-green">isReleaseAllowed() = TRUE</span>
                  </div>
                </div>

                {/* Unlock Action Button */}
                {!releaseKeyResult && (
                  <div className="action-row">
                    <button
                      id="btn-log-access"
                      className="btn-success-large"
                      onClick={handleLogAccessAndUnlock}
                      disabled={isLoggingAccess}
                    >
                      {isLoggingAccess ? (
                        <>
                          <RefreshCwIcon className="spin-animation" size={20} />
                          <span>Signing Access Log On-Chain...</span>
                        </>
                      ) : (
                        <>
                          <KeyIcon size={20} />
                          <span>Sign On-Chain Access Log & Decrypt Key</span>
                        </>
                      )}
                    </button>
                    <small className="action-hint">
                      Invokes <code>contract.logAccess("{paperId}")</code> on Sepolia and issues backend release key.
                    </small>
                  </div>
                )}
              </div>
            </div>
          ) : !verificationResult.isAuthorized ? (
            /* NOT AUTHORIZED (RBAC FAILURE) */
            <div className="status-card forbidden">
              <div className="status-header">
                <div className="status-badge forbidden">
                  <AlertTriangleIcon size={24} />
                  <span>ACCESS FORBIDDEN (RBAC)</span>
                </div>
                <span className="badge-pill error">Not Whitelisted</span>
              </div>

              <div className="status-body">
                <h3>Center Wallet Is Not Authorized</h3>
                <p>
                  The connected address is not listed in the <code>authorizedCenters</code> whitelist for paper <strong>{paperId}</strong>.
                  Smart contract RBAC has rejected this release request.
                </p>
                <div className="status-meta-grid">
                  <div className="meta-box">
                    <span className="meta-title">Attempted Wallet</span>
                    <span className="meta-val mono text-red">{account || "Unknown"}</span>
                  </div>
                  <div className="meta-box">
                    <span className="meta-title">Contract Verification</span>
                    <span className="meta-val text-red">isReleaseAllowed() = FALSE</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* TOO EARLY (TIME-LOCK ACTIVE) */
            <div className="status-card locked">
              <div className="status-header">
                <div className="status-badge locked">
                  <ClockIcon size={24} />
                  <span>TIME-LOCKED (TOO EARLY)</span>
                </div>
                <span className="badge-pill warning">Scheduled In Future</span>
              </div>

              <div className="status-body">
                <h3>Exam Paper Is Time-Locked</h3>
                <p>
                  Your center wallet is authorized, but the official exam start time has not yet arrived.
                  The blockchain prevents decryption key release until the exact scheduled timestamp.
                </p>
                <div className="status-meta-grid">
                  <div className="meta-box">
                    <span className="meta-title">Scheduled Release</span>
                    <span className="meta-val">
                      {verificationResult.releaseTime
                        ? new Date(verificationResult.releaseTime * 1000).toLocaleString()
                        : 'Scheduled Future Time'}
                    </span>
                  </div>
                  <div className="meta-box">
                    <span className="meta-title">Status</span>
                    <span className="meta-val text-amber">Time constraint pending</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Decryption Key Result Card */}
      {releaseKeyResult && (
        <div className="card-panel key-released-panel mt-6">
          <div className="card-header">
            <div className="card-title-group">
              <CheckCircleIcon className="success-icon" size={24} />
              <h2>Decryption Key Successfully Released!</h2>
            </div>
            {accessTxResult?.isSimulated && (
              <span className="badge-pill warning">Simulated Access Event</span>
            )}
          </div>

          <div className="key-display-box">
            <div className="key-header">
              <span className="key-type-label">AES-256-GCM SESSION KEY</span>
              <span className="key-expiry">Valid for 4 hours</span>
            </div>

            <div className="key-value-row">
              <code className="key-code">{releaseKeyResult.key}</code>
              <button
                className={`copy-btn ${keyCopied ? 'copied' : ''}`}
                onClick={handleCopyKey}
              >
                <CopyIcon size={16} />
                <span>{keyCopied ? 'Copied!' : 'Copy Key'}</span>
              </button>
            </div>
          </div>

          {/* On-Chain Access Log Receipt */}
          {accessTxResult && (
            <div className="access-log-receipt">
              <h4>Tamper-Evident Access Recorded On-Chain:</h4>
              <div className="receipt-grid">
                <div className="receipt-col">
                  <span className="label">On-Chain Event</span>
                  <span className="val mono text-green">AccessLogged({paperId}, Success)</span>
                </div>
                <div className="receipt-col">
                  <span className="label">Tx Hash</span>
                  <span className="val mono">
                    {accessTxResult.transactionHash.substring(0, 18)}...
                  </span>
                </div>
                <div className="receipt-col">
                  <span className="label">Block</span>
                  <span className="val mono">#{accessTxResult.blockNumber}</span>
                </div>
              </div>

              {!accessTxResult.isSimulated && (
                <a
                  href={`${SEPOLIA_CONFIG.blockExplorerUrls[0]}/tx/${accessTxResult.transactionHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="tx-external-link mt-3"
                >
                  View AccessLogged Event on Sepolia Etherscan <ExternalLinkIcon size={14} />
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
