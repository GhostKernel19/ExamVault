import React, { useState } from 'react';
import { WalletProvider } from './context/WalletContext';
import { Navbar } from './components/Navbar';
import { AdminUpload } from './pages/AdminUpload';
import { CenterAccess } from './pages/CenterAccess';
import { AuditLog } from './pages/AuditLog';
import './App.css';

function AppContent() {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'center' | 'audit'

  return (
    <div className="app-shell">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="main-content">
        {activeTab === 'upload' && <AdminUpload />}
        {activeTab === 'center' && <CenterAccess />}
        {activeTab === 'audit' && <AuditLog />}
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <strong>ExamVault</strong> — Immutable Examination Security Protocol
          </div>
          <div className="footer-links">
            <span>Target: Sepolia Testnet (Chain ID 11155111)</span>
            <span>•</span>
            <span>Ethers.js v6</span>
            <span>•</span>
            <span>Zero-Knowledge & Tamper-Evident Access</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <AppContent />
    </WalletProvider>
  );
}
