import React from "react";
import { ethers } from "ethers";
import { formatEth } from "../utils/formatters";

export default function UtilizationBar({ poolStats }) {
  const liquidity = parseFloat(ethers.formatEther(poolStats.liquidity || 0n));
  const borrowed = parseFloat(ethers.formatEther(poolStats.totalBorrowed || 0n));
  const totalValue = liquidity + borrowed;
  const utilizationBps = Number(poolStats.utilizationBps || 0n);
  const utilizationPercent = (utilizationBps / 100).toFixed(1);

  return (
    <div className="p-4 rounded-xl bg-surface-subtle/80 border border-border-subtle">
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="text-slate-300 font-medium">Pool Utilization</span>
        <span className="font-mono font-bold text-white">{utilizationPercent}%</span>
      </div>

      {/* Progress Track */}
      <div className="w-full bg-surface h-3 rounded-full overflow-hidden flex">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-700"
          style={{ width: `${Math.min(100, Math.max(0, Number(utilizationPercent)))}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
        <span>Borrowed: <strong className="text-slate-200">{formatEth(borrowed, 3)} ETH</strong></span>
        <span>Available: <strong className="text-cyan-400">{formatEth(liquidity, 3)} ETH</strong></span>
      </div>
    </div>
  );
}
