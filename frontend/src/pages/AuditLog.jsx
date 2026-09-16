import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../context/WalletContext';
import { queryAccessLogs } from '../services/contractService';
import { fetchBackendAuditLogs } from '../services/apiService';
import { SEPOLIA_CONFIG } from '../config/contract';
import {
  ShieldIcon,
  SearchIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ExternalLinkIcon,
  TerminalIcon,
  ClockIcon
} from '../components/Icons';

export const AuditLog = () => {
  const { provider, signer, demoMode } = useWallet();

  const [paperFilter, setPaperFilter] = useState('');
  const [activeTab, setActiveTab] = useState('sideBySide'); // 'sideBySide', 'onChain', 'backend'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Data states
  const [onChainLogs, setOnChainLogs] = useState([]);
  const [backendLogs, setBackendLogs] = useState([]);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  // Fetch both on-chain AccessLogged events and backend audit logs
  const loadAuditData = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      // 1. Query Smart Contract AccessLogged events via ethers.js queryFilter
      const contractEvents = await queryAccessLogs({
        providerOrSigner: signer || provider,
        paperIdFilter: paperFilter.trim() || null,
        useSimulation: demoMode
      });

      // 2. Fetch Backend Audit Logs from /api/paper/:paperId/audit-log
      const backendResponse = await fetchBackendAuditLogs(paperFilter.trim() || null);

      setOnChainLogs(contractEvents);
      setBackendLogs(backendResponse.logs || []);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setError(err.message || 'Error querying on-chain events or backend audit logs.');
    } finally {
      setIsLoading(false);
    }
  }, [provider, signer, demoMode, paperFilter]);

  useEffect(() => {
    loadAuditData();
  }, [loadAuditData]);

  // Format timestamp helper
  const formatTime = (ts) => {
    if (!ts) return 'N/A';
    const date = new Date(ts * 1000);
    return date.toLocaleString();
  };

  const formatAddr = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 8)}...${addr.substring(addr.length - 6)}`;
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-badge audit">AUDIT & VERIFICATION</div>
        <h1 className="page-title">Tamper-Evident Dual-Ledger Audit</h1>
        <p className="page-description">
          Cross-examine on-chain immutable smart contract <code>AccessLogged</code> events against off-chain server
          logs to detect unauthorized access, time tampering, or database alterations.
        </p>
      </div>

      {/* Control Bar */}
      <div className="card-panel audit-controls mb-6">
        <div className="filter-row">
          <div className="search-filter-box">
            <SearchIcon size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Filter by Paper ID (e.g. CS-401-MIDTERM)..."
              value={paperFilter}
              onChange={(e) => setPaperFilter(e.target.value)}
              className="filter-input"
            />
            {paperFilter && (
              <button
                className="clear-btn"
                onClick={() => setPaperFilter('')}
                title="Clear filter"
              >
                ✕
              </button>
            )}
          </div>

          <button
            className="btn-secondary"
            onClick={loadAuditData}
            disabled={isLoading}
          >
            <RefreshCwIcon className={isLoading ? 'spin-animation' : ''} size={16} />
            <span>{isLoading ? 'Querying...' : 'Refresh Logs'}</span>
          </button>
        </div>

        <div className="audit-meta-bar">
          <div className="tab-pill-group">
            <button
              className={`pill-btn ${activeTab === 'sideBySide' ? 'active' : ''}`}
              onClick={() => setActiveTab('sideBySide')}
            >
              Dual Comparison View
            </button>
            <button
              className={`pill-btn ${activeTab === 'onChain' ? 'active' : ''}`}
              onClick={() => setActiveTab('onChain')}
            >
              On-Chain Only ({onChainLogs.length})
            </button>
            <button
              className={`pill-btn ${activeTab === 'backend' ? 'active' : ''}`}
              onClick={() => setActiveTab('backend')}
            >
              Server Logs ({backendLogs.length})
            </button>
          </div>

          {lastRefreshed && (
            <span className="last-refreshed">
              <ClockIcon size={14} /> Last refreshed: {lastRefreshed}
            </span>
          )}
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="alert-box error mb-6">
          <AlertTriangleIcon size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Dual Comparison Summary Bar */}
      <div className="verification-summary-banner">
        <div className="summary-col">
          <div className="summary-icon green">
            <ShieldIcon size={20} />
          </div>
          <div>
            <div className="summary-title">Blockchain Ledger</div>
            <div className="summary-desc">{onChainLogs.length} Immutable Sepolia Events Found</div>
          </div>
        </div>

        <div className="summary-divider">VS</div>

        <div className="summary-col">
          <div className="summary-icon blue">
            <TerminalIcon size={20} />
          </div>
          <div>
            <div className="summary-title">Server Database</div>
            <div className="summary-desc">{backendLogs.length} Off-Chain Access Records Logged</div>
          </div>
        </div>

        <div className="integrity-status-badge verified">
          <CheckCircleIcon size={16} />
          <span>Dual-Ledger Auditing Active</span>
        </div>
      </div>

      {/* Tables Grid */}
      <div className={`audit-tables-grid ${activeTab}`}>
        {/* On-Chain Table */}
        {(activeTab === 'sideBySide' || activeTab === 'onChain') && (
          <div className="card-panel table-panel">
            <div className="table-header-row">
              <div className="table-title">
                <span className="indicator-dot green"></span>
                <h3>On-Chain Smart Contract Events</h3>
                <code className="event-name">AccessLogged()</code>
              </div>
              <span className="badge-pill success">Immutable</span>
            </div>

            <div className="table-responsive">
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Paper ID</th>
                    <th>Center Address</th>
                    <th>Timestamp</th>
                    <th>Status</th>
                    <th>Tx Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {onChainLogs.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="empty-state">
                        No on-chain access events found {paperFilter ? `for "${paperFilter}"` : ''}.
                      </td>
                    </tr>
                  ) : (
                    onChainLogs.map((log, index) => (
                      <tr key={index}>
                        <td className="mono highlight">{log.paperId}</td>
                        <td className="mono" title={log.center}>
                          {formatAddr(log.center)}
                        </td>
                        <td className="time-col">{formatTime(log.timestamp)}</td>
                        <td>
                          {log.success ? (
                            <span className="status-pill success">SUCCESS</span>
                          ) : (
                            <span className="status-pill fail">FAILED</span>
                          )}
                        </td>
                        <td>
                          {log.isSimulated ? (
                            <span className="mono text-muted" title={log.transactionHash}>
                              {log.transactionHash.substring(0, 10)}... (Demo)
                            </span>
                          ) : (
                            <a
                              href={`${SEPOLIA_CONFIG.blockExplorerUrls[0]}/tx/${log.transactionHash}`}
                              target="_blank"
                              rel="noreferrer"
                              className="tx-hash-link"
                              title={log.transactionHash}
                            >
                              {log.transactionHash.substring(0, 10)}...
                              <ExternalLinkIcon size={12} />
                            </a>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Backend Table */}
        {(activeTab === 'sideBySide' || activeTab === 'backend') && (
          <div className="card-panel table-panel">
            <div className="table-header-row">
              <div className="table-title">
                <span className="indicator-dot blue"></span>
                <h3>Backend Server Database Logs</h3>
                <code className="event-name">/api/paper/:id/audit-log</code>
              </div>
              <span className="badge-pill info">Off-Chain</span>
            </div>

            <div className="table-responsive">
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Paper ID</th>
                    <th>Center</th>
                    <th>IP / Action</th>
                    <th>Timestamp</th>
                    <th>Server Status</th>
                  </tr>
                </thead>
                <tbody>
                  {backendLogs.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="empty-state">
                        No server audit entries found {paperFilter ? `for "${paperFilter}"` : ''}.
                      </td>
                    </tr>
                  ) : (
                    backendLogs.map((log, index) => (
                      <tr key={index}>
                        <td className="mono highlight">{log.paperId}</td>
                        <td className="mono" title={log.center}>
                          {formatAddr(log.center)}
                        </td>
                        <td>
                          <span className="ip-badge">{log.ipAddress || '127.0.0.1'}</span>
                          <small className="action-tag">{log.action || 'ACCESS_ATTEMPT'}</small>
                        </td>
                        <td className="time-col">{formatTime(log.timestamp)}</td>
                        <td>
                          <span className={`status-pill ${log.status === 'APPROVED' ? 'success' : 'fail'}`}>
                            {log.status || 'LOGGED'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
