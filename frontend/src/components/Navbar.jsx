import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { ShieldIcon, FileUpIcon, KeyIcon, TerminalIcon, WalletIcon } from './Icons';

export const Navbar = () => {
  const { account, isSepolia, demoMode, connectWallet, disconnectWallet, toggleDemoMode } = useWallet();
  const location = useLocation();
  const navigate = useNavigate();

  const shortenAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <header className="navbar-container">
      <div className="navbar-content">
        {/* Brand */}
        <div className="navbar-brand" onClick={() => navigate('/')}>
          <div className="brand-icon-wrapper">
            <ShieldIcon size={24} />
          </div>
          <div>
            <div className="brand-title">
              Exam<span className="brand-highlight">Vault</span>
            </div>
            <div className="brand-subtitle">Blockchain Timelock & Security</div>
          </div>
        </div>

        {/* Center Nav Tabs */}
        <nav className="navbar-tabs">
          <Link
            to="/"
            className={`nav-tab-btn ${location.pathname === '/' ? 'active' : ''}`}
          >
            <ShieldIcon size={16} />
            <span>Home</span>
          </Link>
          <Link
            to="/upload"
            className={`nav-tab-btn ${location.pathname === '/upload' ? 'active' : ''}`}
          >
            <FileUpIcon size={16} />
            <span>Authority Upload</span>
          </Link>
          <Link
            to="/center"
            className={`nav-tab-btn ${location.pathname === '/center' ? 'active' : ''}`}
          >
            <KeyIcon size={16} />
            <span>Center Portal</span>
          </Link>
          <Link
            to="/audit"
            className={`nav-tab-btn ${location.pathname === '/audit' ? 'active' : ''}`}
          >
            <TerminalIcon size={16} />
            <span>Audit Trail</span>
          </Link>
        </nav>

        {/* Right Controls: Network, Demo Mode & Wallet */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Demo Mode Toggle */}
          <button
            onClick={toggleDemoMode}
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: demoMode ? '1px solid #10b981' : '1px solid var(--border-subtle)',
              background: demoMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(15, 23, 42, 0.6)',
              color: demoMode ? '#34d399' : 'var(--text-muted)'
            }}
            title="Toggle Demo Mode for fast hackathon presentation"
          >
            {demoMode ? '● Demo Mode ON' : '○ Real Web3'}
          </button>

          {/* Network Indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.75rem',
              color: isSepolia ? '#60a5fa' : '#94a3b8',
              background: 'rgba(15, 23, 42, 0.6)',
              padding: '0.4rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: isSepolia || demoMode ? '#3b82f6' : '#f59e0b'
              }}
            />
            <span>Sepolia</span>
          </div>

          {/* Wallet Button */}
          {account ? (
            <button
              onClick={disconnectWallet}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                color: '#93c5fd',
                fontSize: '0.8rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Click to disconnect"
            >
              <WalletIcon size={15} />
              <span>{shortenAddress(account)}</span>
            </button>
          ) : (
            <button
              onClick={connectWallet}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.45rem 0.95rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--primary)',
                border: 'none',
                color: '#fff',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <WalletIcon size={15} />
              <span>Connect Wallet</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
