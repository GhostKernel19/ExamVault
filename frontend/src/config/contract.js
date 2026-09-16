/**
 * ExamVault - Smart Contract Configuration (Sepolia Testnet)
 */

export const SEPOLIA_CONFIG = {
  chainId: 11155111,
  chainIdHex: '0xaa36a7',
  chainName: 'Sepolia Testnet',
  rpcUrl: import.meta.env?.VITE_RPC_URL || 'https://rpc.sepolia.org',
  contractAddress: import.meta.env?.VITE_CONTRACT_ADDRESS || '0x356A8F2A28751e18A8B61099e2893f41D09d936e',
  explorerUrl: 'https://sepolia.etherscan.io',
  nativeCurrency: {
    name: 'Sepolia Ether',
    symbol: 'SEP',
    decimals: 18
  }
};

export const EXAM_VAULT_ABI = [
  "function registerPaper(string memory paperId, bytes32 encryptedFileHash, uint256 releaseTime, address[] memory authorizedCenters) external",
  "function registerExam(bytes32 examId, bytes32 paperHash, uint256 releaseTimestamp, address[] memory centers) external",
  "function requestAccess(string memory paperId) external returns (bool)",
  "function checkIsReleaseAllowed(string memory paperId, address center) external view returns (bool allowed, bool isAuthorized, bool isTimePassed, uint256 releaseTime)",
  "function getPaper(string memory paperId) external view returns (bytes32 paperHash, uint256 releaseTime, address admin, bool exists)",
  "function isCenterAuthorized(string memory paperId, address center) external view returns (bool)",
  "function logEarlyAttempt(string memory paperId) external",
  "event PaperRegistered(string indexed paperId, bytes32 paperHash, uint256 releaseTime, address admin)",
  "event AccessLogged(string indexed paperId, address indexed center, uint256 timestamp, bool success, string reason)",
  "event PaperAccessed(string indexed paperId, address indexed center, uint256 timestamp)",
  "event EarlyAccessAttempt(string indexed paperId, address indexed center, uint256 timestamp)"
];
