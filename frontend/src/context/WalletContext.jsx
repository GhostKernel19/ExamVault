import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { SEPOLIA_CONFIG } from '../config/contract';

const WalletContext = createContext(null);

const DEMO_ACCOUNT = "0x71C80e4C92e3532C3A50058bDb63B9B972FE3e2C";

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState('');
  const [signer, setSigner] = useState(null);
  const [provider, setProvider] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isSepolia, setIsSepolia] = useState(false);
  const [demoMode, setDemoMode] = useState(true);

  // Initialize Web3 or Demo provider
  useEffect(() => {
    if (window.ethereum) {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(browserProvider);

      browserProvider.getNetwork().then(network => {
        const id = Number(network.chainId);
        setChainId(id);
        setIsSepolia(id === SEPOLIA_CONFIG.chainId);
      }).catch(() => {});

      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          browserProvider.getSigner().then(setSigner).catch(() => {});
        } else {
          setAccount('');
          setSigner(null);
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    } else {
      // Fallback fallback RPC provider
      const jsonRpc = new ethers.JsonRpcProvider(SEPOLIA_CONFIG.rpcUrl);
      setProvider(jsonRpc);
    }
  }, []);

  // Demo mode auto-fills demo account if no wallet is connected
  useEffect(() => {
    if (demoMode && !account) {
      setAccount(DEMO_ACCOUNT);
    }
  }, [demoMode, account]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('No Web3 wallet found. Running in Hackathon Demo Mode with pre-configured authority account.');
      setDemoMode(true);
      setAccount(DEMO_ACCOUNT);
      return;
    }

    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send('eth_requestAccounts', []);
      if (accounts.length > 0) {
        const userSigner = await browserProvider.getSigner();
        const network = await browserProvider.getNetwork();
        setAccount(accounts[0]);
        setSigner(userSigner);
        setProvider(browserProvider);
        const id = Number(network.chainId);
        setChainId(id);
        setIsSepolia(id === SEPOLIA_CONFIG.chainId);
        setDemoMode(false);
      }
    } catch (err) {
      console.warn('Wallet connection cancelled or failed, continuing with demo mode:', err.message);
      setDemoMode(true);
      setAccount(DEMO_ACCOUNT);
    }
  };

  const disconnectWallet = () => {
    setAccount('');
    setSigner(null);
    setDemoMode(true);
  };

  const switchToSepolia = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CONFIG.chainIdHex }]
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: SEPOLIA_CONFIG.chainIdHex,
            chainName: SEPOLIA_CONFIG.chainName,
            rpcUrls: [SEPOLIA_CONFIG.rpcUrl],
            nativeCurrency: SEPOLIA_CONFIG.nativeCurrency,
            blockExplorerUrls: [SEPOLIA_CONFIG.explorerUrl]
          }]
        });
      }
    }
  };

  const toggleDemoMode = () => {
    setDemoMode(prev => !prev);
    if (!demoMode && !account) {
      setAccount(DEMO_ACCOUNT);
    }
  };

  return (
    <WalletContext.Provider value={{
      account,
      signer,
      provider,
      chainId,
      isSepolia,
      demoMode,
      connectWallet,
      disconnectWallet,
      switchToSepolia,
      toggleDemoMode
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
