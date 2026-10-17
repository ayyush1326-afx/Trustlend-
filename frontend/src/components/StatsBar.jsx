import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Landmark, Coins, Percent, FileCheck } from "lucide-react";
import { formatEth } from "../utils/formatters";

export default function StatsBar({ poolStats }) {
  const liquidityEth = parseFloat(ethers.formatEther(poolStats.liquidity || 0n));
  const borrowedEth = parseFloat(ethers.formatEther(poolStats.totalBorrowed || 0n));
  const utilizationPercent = poolStats.poolValue > 0n
    ? (Number(poolStats.utilizationBps) / 100).toFixed(1)
    : "0.0";
  const loansCount = Number(poolStats.loanCount || 0n);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Total Liquidity */}
      <div className="glass-panel p-5 rounded-2xl relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Total Liquidity</span>
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <Landmark className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-white tracking-tight">
          {formatEth(liquidityEth, 3)} <span className="text-sm font-normal text-slate-400">ETH</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">Available for borrowing</p>
      </div>

      {/* Total Borrowed */}
      <div className="glass-panel p-5 rounded-2xl relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Total Borrowed</span>
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
            <Coins className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-cyan-400 tracking-tight">
          {formatEth(borrowedEth, 3)} <span className="text-sm font-normal text-slate-400">ETH</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">Active loan principal</p>
      </div>

      {/* Pool Utilization */}
      <div className="glass-panel p-5 rounded-2xl relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Utilization</span>
          <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-400">
            <Percent className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-white tracking-tight">
          {utilizationPercent}%
        </div>
        <div className="w-full bg-surface-subtle h-1.5 rounded-full mt-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.min(100, Math.max(0, Number(utilizationPercent)))}%` }}
          />
        </div>
      </div>

      {/* Loans Issued */}
      <div className="glass-panel p-5 rounded-2xl relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Loans Issued</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <FileCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-white tracking-tight">
          {loansCount}
        </div>
        <p className="text-[11px] text-slate-400 mt-1">Cumulative on-chain loans</p>
      </div>
    </div>
  );
}
