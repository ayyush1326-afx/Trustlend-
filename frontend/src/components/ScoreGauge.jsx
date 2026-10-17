import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, TrendingUp, ArrowUpRight, Award } from "lucide-react";
import TierBadge from "./TierBadge";
import { getTierForScore, getNextTierInfo } from "../utils/formatters";

export default function ScoreGauge({ score = 100 }) {
  const currentTier = getTierForScore(score);
  const { nextTier, pointsNeeded, progressPercent } = getNextTierInfo(score);

  // SVG Gauge calculations (circle radius 80, circumference = 2 * PI * 80 ~= 502.65)
  const radius = 75;
  const circumference = 2 * Math.PI * radius;
  // Score range is 0 to 1000
  const normalizedScore = Math.min(1000, Math.max(0, score));
  const strokeDashoffset = circumference - (normalizedScore / 1000) * circumference;

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-2xl relative overflow-hidden flex flex-col justify-between">
      {/* Background radial accent */}
      <div
        className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: currentTier.color }}
      />

      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">On-Chain Reputation</span>
          <h2 className="text-xl font-bold text-white mt-0.5">TrustScore</h2>
        </div>
        <TierBadge tierIndex={currentTier.index} size="md" />
      </div>

      {/* Radial Gauge Centerpiece */}
      <div className="relative flex flex-col items-center justify-center my-4">
        <svg className="w-52 h-52 transform -rotate-90" viewBox="0 0 200 200">
          {/* Background Track */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="12"
            fill="transparent"
          />
          {/* Animated Progress Stroke */}
          <motion.circle
            cx="100"
            cy="100"
            r={radius}
            stroke={currentTier.color}
            strokeWidth="12"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            strokeLinecap="round"
            fill="transparent"
            style={{
              filter: `drop-shadow(0 0 8px ${currentTier.color}88)`,
            }}
          />
        </svg>

        {/* Inner Score Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-5xl font-black tracking-tight text-white font-sans"
          >
            {score}
          </motion.span>
          <span className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">
            / 1000 PTS
          </span>
        </div>
      </div>

      {/* Tier Perks Summary */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border-subtle mt-2">
        <div className="bg-surface-subtle/80 p-3 rounded-xl border border-border-subtle">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Required Collateral</span>
          <span className="text-lg font-bold text-white mt-0.5 block">{currentTier.collateralPercent}%</span>
        </div>
        <div className="bg-surface-subtle/80 p-3 rounded-xl border border-border-subtle">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Max Borrow Limit</span>
          <span className="text-lg font-bold text-cyan-400 mt-0.5 block">{currentTier.maxBorrowEth} ETH</span>
        </div>
      </div>

      {/* Progression to Next Tier */}
      {nextTier ? (
        <div className="mt-4 pt-3 border-t border-border-subtle">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400">
              Next Tier: <span className="font-semibold text-slate-200">{nextTier.name}</span>
            </span>
            <span className="text-indigo-400 font-medium">+{pointsNeeded} pts needed</span>
          </div>
          <div className="w-full bg-surface-subtle h-2 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Repaying on time awards +50 pts. You are {Math.ceil(pointsNeeded / 50)} loans away.</span>
          </p>
        </div>
      ) : (
        <div className="mt-4 pt-3 border-t border-border-subtle text-xs text-cyan-300 flex items-center gap-2">
          <Award className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>Maximum Reputation Tier reached! Enjoy 50% under-collateralized borrowing.</span>
        </div>
      )}
    </div>
  );
}
