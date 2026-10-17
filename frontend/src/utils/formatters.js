import { ethers } from "ethers";
import { TIERS, SUPPORTED_CHAINS } from "./constants";

/**
 * Shorten an Ethereum address for UI display.
 */
export function shortenAddress(address, chars = 4) {
  if (!address) return "";
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

/**
 * Format wei or ETH string into human readable number.
 */
export function formatEth(val, decimals = 4) {
  if (val === undefined || val === null) return "0.00";
  try {
    let strVal;
    if (typeof val === "bigint") {
      strVal = ethers.formatEther(val);
    } else if (typeof val === "number") {
      strVal = val.toString();
    } else {
      strVal = val;
    }
    const num = parseFloat(strVal);
    if (isNaN(num)) return "0.00";
    if (num === 0) return "0.00";
    if (num < 0.0001) return "< 0.0001";
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: decimals,
    });
  } catch (err) {
    return "0.00";
  }
}

/**
 * Convert basis points to percentage string (e.g., 15000 -> "150%").
 */
export function formatBps(bps) {
  if (bps === undefined || bps === null) return "0%";
  const num = typeof bps === "bigint" ? Number(bps) : Number(bps);
  return `${(num / 100).toFixed(0)}%`;
}

/**
 * Format duration in seconds to human readable string.
 */
export function formatDuration(seconds) {
  const s = Number(seconds);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)} min`;
  if (s < 86400) return `${(s / 3600).toFixed(1)} hrs`;
  return `${(s / 86400).toFixed(0)} days`;
}

/**
 * Format timestamp into readable localized string.
 */
export function formatDateTime(timestampSeconds) {
  if (!timestampSeconds) return "";
  const date = new Date(Number(timestampSeconds) * 1000);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Get Tier config object by score.
 */
export function getTierForScore(score) {
  const s = Number(score || 0);
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (s >= TIERS[i].minScore) {
      return TIERS[i];
    }
  }
  return TIERS[0];
}

/**
 * Get next tier object and points needed.
 */
export function getNextTierInfo(score) {
  const currentTier = getTierForScore(score);
  if (currentTier.index >= TIERS.length - 1) {
    return { nextTier: null, pointsNeeded: 0, progressPercent: 100 };
  }
  const nextTier = TIERS[currentTier.index + 1];
  const pointsNeeded = nextTier.minScore - score;
  const tierRange = nextTier.minScore - currentTier.minScore;
  const currentPointsInRange = score - currentTier.minScore;
  const progressPercent = Math.min(100, Math.max(0, (currentPointsInRange / tierRange) * 100));
  return { nextTier, pointsNeeded, progressPercent };
}

/**
 * Generate Etherscan or block explorer link for tx or address.
 */
export function getExplorerUrl(hashOrAddress, type = "tx", chainId = 11155111) {
  const chain = SUPPORTED_CHAINS[chainId];
  if (!chain || !chain.blockExplorer) return "";
  return `${chain.blockExplorer}/${type}/${hashOrAddress}`;
}
