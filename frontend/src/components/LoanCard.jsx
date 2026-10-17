import React, { useState } from "react";
import { ethers } from "ethers";
import { Clock, Shield, Coins, AlertCircle, CheckCircle2, Flame, ArrowUpRight } from "lucide-react";
import { useCountdown } from "../hooks/useCountdown";
import { usePool } from "../hooks/usePool";
import { useWallet } from "../hooks/useWallet";
import { formatEth, formatDateTime, shortenAddress } from "../utils/formatters";
import StatusPill from "./StatusPill";
import ConfirmModal from "./ConfirmModal";
import AddressChip from "./AddressChip";

export default function LoanCard({ loan, isBorrowerView = true }) {
  const { account, chainId } = useWallet();
  const { repay, liquidate } = usePool();
  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
  const [isLiquidateModalOpen, setIsLiquidateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const countdown = useCountdown(loan.dueTime);

  const principalEth = ethers.formatEther(loan.principal);
  const collateralEth = ethers.formatEther(loan.collateral);
  const feeEth = ethers.formatEther(loan.fee);
  const totalRepayWei = loan.principal + loan.fee;
  const totalRepayEth = ethers.formatEther(totalRepayWei);

  const isBorrower = account && loan.borrower.toLowerCase() === account.toLowerCase();
  const isActive = loan.status === 0;
  const isOverdue = countdown.isExpired && isActive;

  const handleRepay = async () => {
    try {
      setIsSubmitting(true);
      await repay(loan.id, totalRepayWei);
      setIsRepayModalOpen(false);
    } catch (err) {
      // toast in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLiquidate = async () => {
    try {
      setIsSubmitting(true);
      await liquidate(loan.id);
      setIsLiquidateModalOpen(false);
    } catch (err) {
      // toast in context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className={`p-5 rounded-2xl glass-panel relative overflow-hidden transition-all ${
        isActive ? "border-indigo-500/30 hover:border-indigo-500/50" : "opacity-85"
      }`}>
        {/* Top Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">Loan #{loan.id}</span>
            {!isBorrowerView && <AddressChip address={loan.borrower} chainId={chainId} showExplorer={false} />}
          </div>
          <StatusPill status={loan.status} repaidLate={loan.repaidLate} />
        </div>

        {/* Loan Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-border-subtle my-3 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Principal</span>
            <span className="text-sm font-bold font-mono text-white">{principalEth} ETH</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Collateral</span>
            <span className="text-sm font-bold font-mono text-cyan-400">{collateralEth} ETH</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Fee (5%)</span>
            <span className="text-sm font-mono text-slate-300">{feeEth} ETH</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Total Repay</span>
            <span className="text-sm font-bold font-mono text-indigo-300">{totalRepayEth} ETH</span>
          </div>
        </div>

        {/* Time / Countdown Status */}
        <div className="flex items-center justify-between text-xs pt-1 mb-4">
          <div className="text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Due: {formatDateTime(loan.dueTime)}</span>
          </div>

          {isActive && (
            <div className={`font-mono font-semibold px-2.5 py-0.5 rounded-full ${
              isOverdue
                ? "bg-rose-950/60 text-rose-400 border border-rose-500/30 animate-pulse"
                : "bg-indigo-950/40 text-indigo-300 border border-indigo-500/20"
            }`}>
              {isOverdue ? "OVERDUE" : `Time left: ${countdown.formatted}`}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {isActive && (
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {isBorrower && (
              <button
                type="button"
                onClick={() => setIsRepayModalOpen(true)}
                className="flex-1 gradient-btn py-2.5 px-4 rounded-xl text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:scale-[1.01] transition-transform"
              >
                <span>{isOverdue ? "Repay Late (No Score Boost)" : "Repay Loan & Release Collateral"}</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Liquidation Button: Enabled once loan is overdue */}
            {isOverdue && (
              <button
                type="button"
                onClick={() => setIsLiquidateModalOpen(true)}
                className="py-2.5 px-4 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-rose-900/30"
              >
                <Flame className="w-3.5 h-3.5 text-white" />
                <span>Liquidate Loan</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Repay Modal */}
      <ConfirmModal
        isOpen={isRepayModalOpen}
        onClose={() => setIsRepayModalOpen(false)}
        onConfirm={handleRepay}
        isLoading={isSubmitting}
        title={`Repay Loan #${loan.id}`}
        subtitle="Repaying settles debt and releases locked collateral to your wallet"
        details={[
          { label: "Principal", value: `${principalEth} ETH` },
          { label: "Flat 5% Fee", value: `${feeEth} ETH` },
          { label: "Total Payment Required", value: `${totalRepayEth} ETH`, highlight: true },
          { label: "Collateral Returned", value: `${collateralEth} ETH` },
          { label: "Reputation Impact", value: isOverdue ? "None (+0 pts for late repayment)" : "+50 Points Score Boost!", highlight: !isOverdue },
        ]}
        confirmText="Confirm Repayment"
        confirmColor="gradient-btn"
      />

      {/* Liquidate Modal */}
      <ConfirmModal
        isOpen={isLiquidateModalOpen}
        onClose={() => setIsLiquidateModalOpen(false)}
        onConfirm={handleLiquidate}
        isLoading={isSubmitting}
        title={`Liquidate Loan #${loan.id}`}
        subtitle="Loan is overdue. Collateral will be seized into pool liquidity and borrower penalized."
        details={[
          { label: "Borrower Address", value: shortenAddress(loan.borrower) },
          { label: "Defaulted Principal", value: `${principalEth} ETH` },
          { label: "Seized Collateral", value: `${collateralEth} ETH`, highlight: true },
          { label: "Borrower Penalty", value: "-300 Credit Score Points" },
        ]}
        confirmText="Execute Liquidation"
        confirmColor="bg-rose-600 hover:bg-rose-500"
      />
    </>
  );
}
