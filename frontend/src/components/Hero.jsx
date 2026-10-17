import React from "react";
import { ArrowRight, ShieldCheck, TrendingUp, Sparkles, CheckCircle2 } from "lucide-react";

export default function Hero({ onGetStarted, onExploreLend }) {
  return (
    <section className="relative pt-6 pb-12 overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-indigo-600/15 via-cyan-500/15 to-transparent blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-5xl mx-auto text-center px-4">
        {/* Fintech announcement pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-subtle border border-border-glass text-xs font-medium text-slate-300 mb-6 shadow-sm hover:border-indigo-500/30 transition-colors">
          <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>Under-collateralized lending is now live on Sepolia</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6">
          Credit scores for <span className="gradient-text">DeFi.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed mb-8">
          Traditional DeFi forces you to lock 150% collateral. TrustLend introduces an immutable on-chain credit score:
          repay loans on time to lower collateral down to <span className="text-cyan-400 font-semibold">50%</span> and
          expand your borrowing limits up to <span className="text-white font-semibold">1.0 ETH</span>.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-14">
          <button
            onClick={onGetStarted}
            className="gradient-btn px-6 py-3.5 rounded-xl text-white font-semibold text-sm sm:text-base flex items-center gap-2.5 shadow-glow"
          >
            <span>Borrow Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onExploreLend}
            className="px-6 py-3.5 rounded-xl bg-surface-subtle hover:bg-surface border border-border-glass text-slate-200 font-semibold text-sm sm:text-base transition-colors"
          >
            Supply Liquidity (5% Yield)
          </button>
        </div>

        {/* 3-Step How It Works Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left max-w-4xl mx-auto">
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold mb-4">
              1
            </div>
            <h3 className="text-base font-semibold text-white mb-1.5 flex items-center gap-2">
              Borrow Small
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              New wallets begin at score 100 in the Newcomer tier (150% collateral, 0.05 ETH cap) with no KYC required.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold mb-4">
              2
            </div>
            <h3 className="text-base font-semibold text-white mb-1.5 flex items-center gap-2">
              Repay On Time
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Each on-time repayment awards <span className="text-emerald-400 font-medium">+50 score points</span> directly
              on-chain. Defaulting drops -300 points.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-yellow-500/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 font-bold mb-4">
              3
            </div>
            <h3 className="text-base font-semibold text-white mb-1.5 flex items-center gap-2">
              Unlock Under-Collateral
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Reach Platinum (800+): lock only 50% collateral (lock 0.5 ETH to borrow 1.0 ETH). True credit in Web3.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
