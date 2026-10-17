import React from "react";
import { TIERS } from "../utils/constants";
import { getTierForScore } from "../utils/formatters";
import { MapPin, ArrowDown } from "lucide-react";

export default function CollateralStaircaseChart({ userScore = 100 }) {
  const currentTier = getTierForScore(userScore);

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-2xl relative overflow-hidden flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Reputation Advantage</span>
          <h2 className="text-xl font-bold text-white mt-0.5">Collateral Staircase</h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-3 py-1 rounded-full font-medium">
          <ArrowDown className="w-3.5 h-3.5" />
          <span>Lower collateral as score rises</span>
        </div>
      </div>

      <p className="text-xs text-slate-400 mb-6">
        Every tier transition unlocks lower required collateral and higher borrow caps. Build your track record to step down the staircase.
      </p>

      {/* Staircase Steps */}
      <div className="space-y-3">
        {TIERS.map((tier) => {
          const isUserTier = currentTier.index === tier.index;
          return (
            <div
              key={tier.index}
              className={`p-3.5 rounded-xl border transition-all ${
                isUserTier
                  ? "bg-surface border-indigo-500/50 shadow-glow"
                  : "bg-surface-subtle/50 border-border-subtle opacity-75 hover:opacity-100"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: tier.color }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{tier.name}</span>
                      <span className="text-[11px] text-slate-400">({tier.minScore}-{tier.maxScore} pts)</span>
                      {isUserTier && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500 text-white uppercase tracking-wider animate-pulse">
                          <MapPin className="w-3 h-3" />
                          You Are Here
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div>
                    <span className="text-[11px] text-slate-400 block uppercase">Collateral</span>
                    <span
                      className="text-sm font-extrabold"
                      style={{ color: tier.color }}
                    >
                      {tier.collateralPercent}%
                    </span>
                  </div>
                  <div className="w-20">
                    <span className="text-[11px] text-slate-400 block uppercase">Max Borrow</span>
                    <span className="text-sm font-semibold text-slate-200">
                      {tier.maxBorrowEth} ETH
                    </span>
                  </div>
                </div>
              </div>

              {/* Step Bar Visualization */}
              <div className="w-full bg-slate-900 h-1.5 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(tier.collateralPercent / 150) * 100}%`,
                    backgroundColor: tier.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
