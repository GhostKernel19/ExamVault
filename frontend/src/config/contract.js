/**
 * ExamVault - Smart Contract Configuration (Sepolia Testnet)
 */
import ExamVaultABI from "./ExamVaultABI.json";

export const SEPOLIA_CONFIG = {
  chainId: 11155111,
  chainIdHex: '0xaa36a7',
  chainName: 'Sepolia Testnet',
  rpcUrl: import.meta.env?.VITE_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com',
  contractAddress: import.meta.env?.VITE_CONTRACT_ADDRESS || '0xBf5dBf0480F43f96f64F5B3dBC9335EA48c30326',
  explorerUrl: 'https://sepolia.etherscan.io',
  blockExplorerUrls: ['https://sepolia.etherscan.io'],
  nativeCurrency: {
    name: 'Sepolia Ether',
    symbol: 'SEP',
    decimals: 18
  }
};

export const EXAM_VAULT_ABI = ExamVaultABI;
