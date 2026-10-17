import React, { useState, useMemo } from "react";
import { ethers } from "ethers";
import { ArrowRight, AlertCircle, ShieldAlert, Sparkles, Clock, Coins, Info } from "lucide-react";
import { useWallet } from "../hooks/useWallet";
import { usePool } from "../hooks/usePool";
import { useLoans } from "../hooks/useLoans";
import { useRegistry } from "../hooks/useRegistry";
import { DURATION_PRESETS, TIERS } from "../utils/constants";
import { formatEth, formatDateTime, getNextTierInfo } from "../utils/formatters";
import ConfirmModal from "./ConfirmModal";
import TierBadge from "./TierBadge";

export default function BorrowCard({ onLoanSuccess }) {
  const { isConnected, connectWallet } = useWallet();
  const { userScore, userTier } = useRegistry();
  const { poolStats, borrow } = usePool();
  const { hasActiveLoan, activeLoan } = useLoans();

  const [amountInput, setAmountInput] = useState("0.05");
  const [selectedDuration, setSelectedDuration] = useState(DURATION_PRESETS[0]); // default to 1 min demo
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available liquidity in pool (ETH)
  const poolLiquidityEth = parseFloat(ethers.formatEther(poolStats.liquidity || 0n));
  const maxBorrowLimitEth = parseFloat(userTier.maxBorrowEth);

  // Parse amount number
  const amountNum = parseFloat(amountInput) || 0;

  // Next tier comparison
  const { nextTier } = getNextTierInfo(userScore);

  // Calculations
  const calculations = useMemo(() => {
    if (amountNum <= 0) {
      return {
        collateralEth: "0.00",
        feeEth: "0.00",
        totalRepayEth: "0.00",
        nextTierCollateralEth: "0.00",
        collateralWei: 0n,
      };
    }

    try {
      const principalWei = ethers.parseEther(amountNum.toString());
      const collBps = BigInt(userTier.collateralBps);
      const collateralWei = (principalWei * collBps) / 10000n;
      const feeWei = (principalWei * 5n) / 100n;
      const totalRepayWei = principalWei + feeWei;

      let nextTierCollateralEth = "0.00";
      if (nextTier) {
        const nextCollBps = BigInt(nextTier.collateralBps);
        const nextCollWei = (principalWei * nextCollBps) / 10000n;
        nextTierCollateralEth = ethers.formatEther(nextCollWei);
      }

      return {
        collateralEth: ethers.formatEther(collateralWei),
        feeEth: ethers.formatEther(feeWei),
        totalRepayEth: ethers.formatEther(totalRepayWei),
        nextTierCollateralEth,
        collateralWei,
      };
    } catch (e) {
      return {
        collateralEth: "0.00",
        feeEth: "0.00",
        totalRepayEth: "0.00",
        nextTierCollateralEth: "0.00",
        collateralWei: 0n,
      };
    }
  }, [amountNum, userTier, nextTier]);

  // Due date projection
  const projectedDueDate = useMemo(() => {
    const targetTimestamp = Math.floor(Date.now() / 1000) + selectedDuration.seconds;
    return formatDateTime(targetTimestamp);
  }, [selectedDuration]);

  // Validation rules
  const validation = useMemo(() => {
    if (!isConnected) return { valid: false, message: "Connect wallet to borrow" };
    if (hasActiveLoan) return { valid: false, message: `Active loan #${activeLoan?.id} must be repaid first` };
    if (amountNum <= 0) return { valid: false, message: "Enter an amount to borrow" };
    if (amountNum > maxBorrowLimitEth) {
      return { valid: false, message: `Exceeds your ${userTier.name} tier limit (${userTier.maxBorrowEth} ETH)` };
    }
    if (amountNum > poolLiquidityEth) {
      return { valid: false, message: `Exceeds pool available liquidity (${formatEth(poolLiquidityEth, 3)} ETH)` };
    }
    return { valid: true, message: "" };
  }, [isConnected, hasActiveLoan, activeLoan, amountNum, maxBorrowLimitEth, poolLiquidityEth, userTier]);

  const handleMaxClick = () => {
    // Choose smaller of tier limit or pool liquidity
    const maxPossible = Math.min(maxBorrowLimitEth, poolLiquidityEth);
    setAmountInput(maxPossible > 0 ? maxPossible.toFixed(4) : userTier.maxBorrowEth);
  };

  const handleConfirmBorrow = async () => {
    try {
      setIsSubmitting(true);
      await borrow(amountNum, selectedDuration.seconds, calculations.collateralWei);
      setIsModalOpen(false);
      if (onLoanSuccess) onLoanSuccess();
    } catch (err) {
      // toast handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="glass-panel p-6 sm:p-8 rounded-2xl relative">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Instant DeFi Loan</h2>
            <p className="text-xs text-slate-400 mt-0.5">Borrow ETH against on-chain credit score</p>
          </div>
          <TierBadge tierIndex={userTier.index} size="md" />
        </div>

        {/* Active Loan Warning banner */}
        {hasActiveLoan && (
          <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 mb-6 flex items-start gap-3">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">One active loan limit reached</p>
              <p className="text-amber-300/80 mt-0.5">
                You currently have active Loan #{activeLoan.id}. Protocol design limits one active loan per wallet to prevent over-extension. Repay to raise your score!
              </p>
            </div>
          </div>
        )}

        {/* Borrow Amount Input */}
        <div className="mb-5">
          <div className="flex items-center justify-between text-xs mb-2">
            <label className="text-slate-300 font-medium">Borrow Amount</label>
            <div className="flex items-center gap-2 text-slate-400">
              <span>Tier Max: <strong className="text-slate-200">{userTier.maxBorrowEth} ETH</strong></span>
              <button
                type="button"
                onClick={handleMaxClick}
                className="text-xs px-2 py-0.5 rounded bg-surface border border-border-subtle text-cyan-400 hover:text-cyan-300 transition-colors font-semibold"
              >
                MAX
              </button>
            </div>
          </div>

          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0.001"
              max={userTier.maxBorrowEth}
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              disabled={hasActiveLoan}
              placeholder="0.05"
              className="w-full px-4 py-3.5 rounded-xl bg-surface-subtle border border-border-subtle focus:border-indigo-500 focus:outline-none text-white text-lg font-mono tracking-tight font-semibold pr-16 disabled:opacity-50"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-sm font-semibold text-slate-300 pointer-events-none">
              <Coins className="w-4 h-4 text-cyan-400" />
              <span>ETH</span>
            </div>
          </div>
        </div>

        {/* Duration Selection Chips */}
        <div className="mb-6">
          <label className="text-xs text-slate-300 font-medium block mb-2">Loan Duration</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {DURATION_PRESETS.map((preset) => (
              <button
                key={preset.seconds}
                type="button"
                disabled={hasActiveLoan}
                onClick={() => setSelectedDuration(preset)}
                className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all flex flex-col items-center justify-center gap-1 ${
                  selectedDuration.seconds === preset.seconds
                    ? "bg-indigo-600/30 border-indigo-500 text-white shadow-glow"
                    : "bg-surface-subtle/80 border-border-subtle text-slate-400 hover:text-slate-200 hover:bg-surface"
                } disabled:opacity-50`}
              >
                <span>{preset.label}</span>
                {preset.tag === "demo" && (
                  <span className="text-[10px] text-cyan-400 font-mono tracking-wide">Devcon Hackathon</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Live Calculation Breakdown */}
        <div className="p-4 rounded-xl bg-surface-subtle/90 border border-border-subtle mb-6 space-y-2.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 flex items-center gap-1.5">
              <span>Required Collateral</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border-subtle font-mono text-cyan-400">
                {userTier.collateralPercent}%
              </span>
            </span>
            <span className="font-mono text-white font-semibold">{calculations.collateralEth} ETH</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400">Flat Borrow Fee (5%)</span>
            <span className="font-mono text-slate-300">{calculations.feeEth} ETH</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400">Projected Due Date</span>
            <span className="font-mono text-slate-300">{projectedDueDate}</span>
          </div>

          <div className="pt-2.5 border-t border-border-subtle flex justify-between items-center text-sm font-semibold">
            <span className="text-slate-200">Total to Repay</span>
            <span className="font-mono text-cyan-400">{calculations.totalRepayEth} ETH</span>
          </div>
        </div>

        {/* Side-by-Side Next Tier Incentive */}
        {nextTier && amountNum > 0 && (
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/40 to-cyan-950/40 border border-indigo-500/20 mb-6 text-xs text-slate-300">
            <div className="flex items-center gap-2 text-indigo-300 font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tier Comparison</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
              <span>At your tier ({userTier.name}): <strong className="text-white">{calculations.collateralEth} ETH</strong></span>
              <span>At {nextTier.name}: <strong className="text-cyan-400">{calculations.nextTierCollateralEth} ETH</strong></span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        {!isConnected ? (
          <button
            type="button"
            onClick={connectWallet}
            className="w-full gradient-btn py-3.5 rounded-xl text-white font-semibold text-sm shadow-glow flex items-center justify-center gap-2"
          >
            <span>Connect Wallet to Borrow</span>
          </button>
        ) : (
          <button
            type="button"
            disabled={!validation.valid}
            onClick={() => setIsModalOpen(true)}
            className={`w-full py-3.5 rounded-xl text-white font-semibold text-sm shadow-glow flex items-center justify-center gap-2 transition-all ${
              validation.valid
                ? "gradient-btn hover:scale-[1.01]"
                : "bg-surface-subtle border border-border-subtle text-slate-500 cursor-not-allowed"
            }`}
          >
            <span>{validation.valid ? "Review & Borrow ETH" : validation.message}</span>
            {validation.valid && <ArrowRight className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmBorrow}
        isLoading={isSubmitting}
        title="Confirm Borrow Transaction"
        subtitle="Review loan parameters before confirming with MetaMask"
        details={[
          { label: "Principal to Receive", value: `${amountNum} ETH`, highlight: true },
          { label: "Collateral to Deposit", value: `${calculations.collateralEth} ETH (${userTier.collateralPercent}%)` },
          { label: "Flat Fee (5%)", value: `${calculations.feeEth} ETH` },
          { label: "Total Due at Repayment", value: `${calculations.totalRepayEth} ETH` },
          { label: "Loan Duration", value: selectedDuration.label },
          { label: "Due Date", value: projectedDueDate },
        ]}
        confirmText="Confirm & Receive ETH"
      />
    </>
  );
}
