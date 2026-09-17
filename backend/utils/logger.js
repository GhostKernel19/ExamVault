/**
 * ExamVault - Logger Utility
 * 
 * Provides clean, readable, timestamped console logging for hackathon demos.
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function formatTime() {
  return new Date().toISOString();
}

const logger = {
  info: (msg, ...args) => {
    console.log(`${colors.cyan}[INFO] [${formatTime()}]${colors.reset} ${msg}`, ...args);
  },
  success: (msg, ...args) => {
    console.log(`${colors.green}[SUCCESS] [${formatTime()}]${colors.reset} ${msg}`, ...args);
  },
  warn: (msg, ...args) => {
    console.warn(`${colors.yellow}[WARN] [${formatTime()}]${colors.reset} ${msg}`, ...args);
  },
  error: (msg, ...args) => {
    console.error(`${colors.red}[ERROR] [${formatTime()}]${colors.reset} ${msg}`, ...args);
  },
  crypto: (msg, ...args) => {
    console.log(`${colors.magenta}[CRYPTO] [${formatTime()}]${colors.reset} ${msg}`, ...args);
  }
};

module.exports = logger;
