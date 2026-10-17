require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";
const RAW_PRIVATE_KEY = (process.env.PRIVATE_KEY || "").trim();
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

// Safely format 32-byte hex private key if valid
const getAccounts = () => {
  const cleanKey = RAW_PRIVATE_KEY.startsWith("0x") ? RAW_PRIVATE_KEY.slice(2) : RAW_PRIVATE_KEY;
  if (cleanKey.length === 64 && /^[0-9a-fA-F]+$/.test(cleanKey) && cleanKey !== "0000000000000000000000000000000000000000000000000000000000000001") {
    return [`0x${cleanKey}`];
  }
  return [];
};

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: getAccounts(),
      chainId: 11155111,
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
};
