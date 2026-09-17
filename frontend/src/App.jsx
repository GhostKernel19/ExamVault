import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WalletProvider } from './context/WalletContext';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { BeginnersGuide } from './pages/BeginnersGuide';
import { AdminUpload } from './pages/AdminUpload';
import { CenterAccess } from './pages/CenterAccess';
import { AuditLog } from './pages/AuditLog';
import './App.css';

function AppLayout({ children }) {
  return (
    <div className="app-shell">
      <Navbar />
      
      <main className="main-content">
        {children}
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
      <BrowserRouter>
        <Routes>
          {/* Landing Page Route */}
          <Route path="/" element={<Home />} />
          <Route path="/guide" element={<BeginnersGuide />} />
          <Route path="/how-it-works" element={<Navigate to="/guide" replace />} />

          {/* Application Portal Routes */}
          <Route path="/upload" element={<AppLayout><AdminUpload /></AppLayout>} />
          <Route path="/center" element={<AppLayout><CenterAccess /></AppLayout>} />
          <Route path="/audit" element={<AppLayout><AuditLog /></AppLayout>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </WalletProvider>
  );
}
