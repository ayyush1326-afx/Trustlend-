import React, { useState, useMemo } from "react";
import { ethers } from "ethers";
import { Landmark, ArrowUpRight, ArrowDownLeft, AlertCircle, Coins, Sparkles, TrendingUp } from "lucide-react";
import { useWallet } from "../hooks/useWallet";
import { usePool } from "../hooks/usePool";
import { formatEth } from "../utils/formatters";
import UtilizationBar from "./UtilizationBar";
import ConfirmModal from "./ConfirmModal";

export default function LendPanel() {
  const { isConnected, connectWallet, ethBalance } = useWallet();
  const { poolStats, userShares, deposit, withdraw } = usePool();

  const [activeAction, setActiveAction] = useState("deposit"); // "deposit" | "withdraw"
  const [depositAmount, setDepositAmount] = useState("0.1");
  const [withdrawSharesInput, setWithdrawSharesInput] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const poolLiquidityEth = parseFloat(ethers.formatEther(poolStats.liquidity || 0n));
  const userShareValEth = parseFloat(ethers.formatEther(userShares.value || 0n));
  const userSharesFormatted = parseFloat(ethers.formatEther(userShares.shares || 0n));
  const walletBalEth = parseFloat(ethBalance || "0");

  // Calculate withdraw payout in ETH based on entered shares
  const withdrawCalculations = useMemo(() => {
    const inputShares = parseFloat(withdrawSharesInput) || 0;
    if (inputShares <= 0 || poolStats.totalShares === 0n) {
      return { payoutEth: "0.00", payoutWei: 0n, exceedsLiquidity: false };
    }
    try {
      const sharesWei = ethers.parseEther(inputShares.toString());
      const poolVal = poolStats.poolValue;
      const payoutWei = (sharesWei * poolVal) / poolStats.totalShares;
      const payoutEth = ethers.formatEther(payoutWei);
      const exceedsLiquidity = payoutWei > poolStats.liquidity;
      return { payoutEth, payoutWei, exceedsLiquidity };
    } catch (e) {
      return { payoutEth: "0.00", payoutWei: 0n, exceedsLiquidity: false };
    }
  }, [withdrawSharesInput, poolStats]);

  // Validation
  const depositNum = parseFloat(depositAmount) || 0;
  const withdrawNum = parseFloat(withdrawSharesInput) || 0;

  const depositValidation = useMemo(() => {
    if (!isConnected) return { valid: false, message: "Connect wallet" };
    if (depositNum <= 0) return { valid: false, message: "Enter deposit amount" };
    if (depositNum > walletBalEth) return { valid: false, message: "Insufficient ETH in wallet" };
    return { valid: true, message: "" };
  }, [isConnected, depositNum, walletBalEth]);

  const withdrawValidation = useMemo(() => {
    if (!isConnected) return { valid: false, message: "Connect wallet" };
    if (userShares.shares === 0n) return { valid: false, message: "No shares to withdraw" };
    if (withdrawNum <= 0) return { valid: false, message: "Enter shares to withdraw" };
    if (withdrawNum > userSharesFormatted) return { valid: false, message: "Exceeds owned shares" };
    if (withdrawCalculations.exceedsLiquidity) {
      return { valid: false, message: "Exceeds available pool liquidity (funds in active loans)" };
    }
    return { valid: true, message: "" };
  }, [isConnected, userShares, withdrawNum, userSharesFormatted, withdrawCalculations]);

  const handleDepositMax = () => {
    // Keep a buffer for gas
    const maxDep = Math.max(0, walletBalEth - 0.005);
    setDepositAmount(maxDep.toFixed(4));
  };

  const handleWithdrawMax = () => {
    setWithdrawSharesInput(userSharesFormatted.toFixed(6));
  };

  const handleConfirmAction = async () => {
    try {
      setIsSubmitting(true);
      if (activeAction === "deposit") {
        await deposit(depositNum);
      } else {
        await withdraw(withdrawCalculations.payoutWei);
      }
      setIsModalOpen(false);
      setDepositAmount("");
      setWithdrawSharesInput("");
    } catch (err) {
      // toast in context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Deposit / Withdraw Card */}
        <div className="lg:col-span-2 glass-panel p-6 sm:p-8 rounded-2xl">
          {/* Action toggle */}
          <div className="flex bg-surface-subtle p-1 rounded-xl border border-border-subtle mb-6">
            <button
              onClick={() => setActiveAction("deposit")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                activeAction === "deposit"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Deposit Liquidity</span>
            </button>
            <button
              onClick={() => setActiveAction("withdraw")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                activeAction === "withdraw"
                  ? "bg-cyan-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Withdraw Liquidity</span>
            </button>
          </div>

          {activeAction === "deposit" ? (
            /* Deposit Section */
            <div>
              <div className="mb-5">
                <div className="flex items-center justify-between text-xs mb-2">
                  <label className="text-slate-300 font-medium">Deposit Amount</label>
                  <div className="flex items-center gap-2 text-slate-400">
                    <span>Wallet Balance: <strong className="text-slate-200">{formatEth(walletBalEth, 3)} ETH</strong></span>
                    <button
                      type="button"
                      onClick={handleDepositMax}
                      className="text-xs px-2 py-0.5 rounded bg-surface border border-border-subtle text-cyan-400 hover:text-cyan-300 font-semibold"
                    >
                      MAX
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    step="0.05"
                    min="0.01"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.10"
                    className="w-full px-4 py-3.5 rounded-xl bg-surface-subtle border border-border-subtle focus:border-indigo-500 focus:outline-none text-white text-lg font-mono font-semibold pr-16"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-sm font-semibold text-slate-300 pointer-events-none">
                    <Coins className="w-4 h-4 text-cyan-400" />
                    <span>ETH</span>
                  </div>
                </div>
              </div>

              {/* Yield explanation */}
              <div className="p-4 rounded-xl bg-surface-subtle border border-border-subtle mb-6 text-xs text-slate-300 space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold">
                  <TrendingUp className="w-4 h-4" />
                  <span>Automated Fee Compounding</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Every borrower pays an upfront flat 5% fee upon repayment. 100% of collected fees automatically compound directly into the pool value, increasing the redemption price of your pool shares.
                </p>
              </div>

              {!isConnected ? (
                <button
                  type="button"
                  onClick={connectWallet}
                  className="w-full gradient-btn py-3.5 rounded-xl text-white font-semibold text-sm shadow-glow"
                >
                  Connect Wallet to Deposit
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!depositValidation.valid}
                  onClick={() => setIsModalOpen(true)}
                  className={`w-full py-3.5 rounded-xl text-white font-semibold text-sm shadow-glow transition-all ${
                    depositValidation.valid
                      ? "gradient-btn hover:scale-[1.01]"
                      : "bg-surface-subtle border border-border-subtle text-slate-500 cursor-not-allowed"
                  }`}
                >
                  {depositValidation.valid ? `Deposit ${depositNum} ETH` : depositValidation.message}
                </button>
              )}
            </div>
          ) : (
            /* Withdraw Section */
            <div>
              <div className="mb-5">
                <div className="flex items-center justify-between text-xs mb-2">
                  <label className="text-slate-300 font-medium">Burn Pool Shares</label>
                  <div className="flex items-center gap-2 text-slate-400">
                    <span>Your Shares: <strong className="text-slate-200">{formatEth(userSharesFormatted, 4)}</strong></span>
                    <button
                      type="button"
                      onClick={handleWithdrawMax}
                      className="text-xs px-2 py-0.5 rounded bg-surface border border-border-subtle text-cyan-400 hover:text-cyan-300 font-semibold"
                    >
                      MAX
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.0001"
                    value={withdrawSharesInput}
                    onChange={(e) => setWithdrawSharesInput(e.target.value)}
                    placeholder="Enter shares amount"
                    className="w-full px-4 py-3.5 rounded-xl bg-surface-subtle border border-border-subtle focus:border-cyan-500 focus:outline-none text-white text-lg font-mono font-semibold pr-20"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                    SHARES
                  </div>
                </div>
              </div>

              {/* Payout calculation */}
              <div className="p-4 rounded-xl bg-surface-subtle border border-border-subtle mb-6 text-xs text-slate-300 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Estimated ETH Payout:</span>
                  <span className="font-mono font-bold text-cyan-400 text-sm">{withdrawCalculations.payoutEth} ETH</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Pool Available Liquidity:</span>
                  <span className="font-mono text-slate-200">{formatEth(poolLiquidityEth, 3)} ETH</span>
                </div>

                {withdrawCalculations.exceedsLiquidity && (
                  <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 flex items-center gap-2 mt-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Payout exceeds available liquidity. Some funds are locked in active borrower loans.</span>
                  </div>
                )}
              </div>

              {!isConnected ? (
                <button
                  type="button"
                  onClick={connectWallet}
                  className="w-full gradient-btn py-3.5 rounded-xl text-white font-semibold text-sm shadow-glow"
                >
                  Connect Wallet to Withdraw
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!withdrawValidation.valid}
                  onClick={() => setIsModalOpen(true)}
                  className={`w-full py-3.5 rounded-xl text-white font-semibold text-sm shadow-glow transition-all ${
                    withdrawValidation.valid
                      ? "gradient-btn hover:scale-[1.01]"
                      : "bg-surface-subtle border border-border-subtle text-slate-500 cursor-not-allowed"
                  }`}
                >
                  {withdrawValidation.valid ? "Confirm Withdrawal" : withdrawValidation.message}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Pool Metrics & Position */}
        <div className="space-y-6">
          {/* User Position */}
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">
              Your Lending Position
            </h3>
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-surface-subtle/80 border border-border-subtle">
                <span className="text-xs text-slate-400 block mb-1">Position Value</span>
                <span className="text-2xl font-bold font-mono text-white">
                  {formatEth(userShareValEth, 4)} <span className="text-sm text-cyan-400">ETH</span>
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-surface-subtle/80 border border-border-subtle flex justify-between items-center text-xs">
                <span className="text-slate-400">Shares Balance:</span>
                <span className="font-mono text-slate-200 font-semibold">{formatEth(userSharesFormatted, 4)}</span>
              </div>
            </div>
          </div>

          {/* Pool Utilization Card */}
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Pool Health
            </h3>
            <UtilizationBar poolStats={poolStats} />
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmAction}
        isLoading={isSubmitting}
        title={activeAction === "deposit" ? "Confirm Liquidity Deposit" : "Confirm Liquidity Withdrawal"}
        subtitle="Sign the transaction in MetaMask to proceed"
        details={
          activeAction === "deposit"
            ? [
                { label: "Deposit Amount", value: `${depositNum} ETH`, highlight: true },
                { label: "Asset", value: "Ethereum (Sepolia)" },
                { label: "Yield Mechanism", value: "5% Flat Loan Fee Revenue" },
              ]
            : [
                { label: "Shares to Burn", value: `${withdrawNum}` },
                { label: "ETH to Receive", value: `${withdrawCalculations.payoutEth} ETH`, highlight: true },
              ]
        }
        confirmText={activeAction === "deposit" ? "Deposit ETH" : "Withdraw ETH"}
      />
    </>
  );
}
