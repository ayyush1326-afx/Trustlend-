export const SEPOLIA_CHAIN_ID = 11155111;
export const LOCAL_CHAIN_ID = 31337;

export const SUPPORTED_CHAINS = {
  [SEPOLIA_CHAIN_ID]: {
    name: "Sepolia Testnet",
    chainIdHex: "0xaa36a7",
    rpcUrls: ["https://rpc.sepolia.org", "https://ethereum-sepolia-rpc.publicnode.com"],
    blockExplorer: "https://sepolia.etherscan.io",
    nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
  },
  [LOCAL_CHAIN_ID]: {
    name: "Hardhat Localhost",
    chainIdHex: "0x7a69",
    rpcUrls: ["http://127.0.0.1:8545"],
    blockExplorer: "",
    nativeCurrency: { name: "Local ETH", symbol: "ETH", decimals: 18 },
  },
};

export const TIERS = [
  {
    index: 0,
    name: "Newcomer",
    minScore: 0,
    maxScore: 199,
    collateralBps: 15000,
    collateralPercent: 150,
    maxBorrowEth: "0.05",
    color: "#94A3B8",
    badgeClass: "bg-slate-800 text-slate-300 border-slate-600",
    glowClass: "shadow-slate-500/20",
    description: "Introductory tier. Builds foundational on-chain credit.",
  },
  {
    index: 1,
    name: "Bronze",
    minScore: 200,
    maxScore: 399,
    collateralBps: 12500,
    collateralPercent: 125,
    maxBorrowEth: "0.10",
    color: "#F59E0B",
    badgeClass: "bg-amber-950/60 text-amber-300 border-amber-600/50",
    glowClass: "shadow-amber-500/20",
    description: "Lower collateral requirements with doubled borrowing capacity.",
  },
  {
    index: 2,
    name: "Silver",
    minScore: 400,
    maxScore: 599,
    collateralBps: 10000,
    collateralPercent: 100,
    maxBorrowEth: "0.25",
    color: "#CBD5E1",
    badgeClass: "bg-slate-800/80 text-zinc-200 border-zinc-400/50",
    glowClass: "shadow-zinc-400/20",
    description: "1:1 parity collateral. Borrow up to 0.25 ETH safely.",
  },
  {
    index: 3,
    name: "Gold",
    minScore: 600,
    maxScore: 799,
    collateralBps: 7500,
    collateralPercent: 75,
    maxBorrowEth: "0.50",
    color: "#FACC15",
    badgeClass: "bg-yellow-950/60 text-yellow-300 border-yellow-500/50",
    glowClass: "shadow-yellow-500/20",
    description: "Under-collateralized! Only 75% collateral needed.",
  },
  {
    index: 4,
    name: "Platinum",
    minScore: 800,
    maxScore: 1000,
    collateralBps: 5000,
    collateralPercent: 50,
    maxBorrowEth: "1.00",
    color: "#22D3EE",
    badgeClass: "bg-cyan-950/60 text-cyan-300 border-cyan-500/50",
    glowClass: "shadow-cyan-500/30",
    description: "Premier tier. 50% collateral with 1.00 ETH maximum borrow cap.",
  },
];

export const DURATION_PRESETS = [
  { label: "1 min (Demo)", seconds: 60, tag: "demo" },
  { label: "1 Day", seconds: 86400, tag: "standard" },
  { label: "7 Days", seconds: 604800, tag: "standard" },
  { label: "30 Days", seconds: 2592000, tag: "standard" },
];

export const LOAN_STATUS_LABELS = {
  0: { label: "Active", color: "text-amber-400 bg-amber-950/40 border-amber-500/30" },
  1: { label: "Repaid", color: "text-emerald-400 bg-emerald-950/40 border-emerald-500/30" },
  2: { label: "Defaulted", color: "text-rose-400 bg-rose-950/40 border-rose-500/30" },
};
