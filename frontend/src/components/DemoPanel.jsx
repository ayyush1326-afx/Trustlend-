import React, { useState } from "react";
import { Sparkles, Terminal, ShieldAlert, Award } from "lucide-react";
import { useWallet } from "../hooks/useWallet";
import { useRegistry } from "../hooks/useRegistry";
import toast from "react-hot-toast";

export default function DemoPanel({ onQuickLoanMode, isQuickLoanMode }) {
  const { account, isConnected } = useWallet();
  const { seedScore, demoMode, userScore } = useRegistry();
  const [customScore, setCustomScore] = useState("");
  const [isSeeding, setIsSeeding] = useState(false);

  if (!demoMode) return null;

  const handleSeed = async (scoreVal) => {
    if (!isConnected || !account) {
      toast.error("Connect deployer wallet to seed score");
      return;
    }
    const scoreNum = Number(scoreVal);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 1000) {
      toast.error("Score must be between 0 and 1000");
      return;
    }

    try {
      setIsSeeding(true);
      await seedScore(account, scoreNum);
      setCustomScore("");
    } catch (err) {
      // toast in context
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/20 via-surface-card to-cyan-950/20 relative overflow-hidden mb-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Devcon Hackathon Demo Controller</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                demoMode = true
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Guarded by contract immutable flag. Allows instant score adjustments for demo judging.
            </p>
          </div>
        </div>

        {/* 1-Minute Fast Loan Mode Toggle */}
        <button
          onClick={onQuickLoanMode}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 ${
            isQuickLoanMode
              ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-glow"
              : "bg-surface border-border-subtle text-slate-300 hover:text-white"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Demo 1-Min Loan Mode: {isQuickLoanMode ? "ACTIVE" : "OFF"}</span>
        </button>
      </div>

      {/* Preset Score Buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <span className="text-xs text-slate-400 font-medium">Quick Seed Presets:</span>
        <button
          disabled={isSeeding || !isConnected}
          onClick={() => handleSeed(100)}
          className="px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-subtle border border-border-subtle text-xs font-medium text-slate-300 transition-colors disabled:opacity-50"
        >
          100 (Newcomer 150%)
        </button>
        <button
          disabled={isSeeding || !isConnected}
          onClick={() => handleSeed(400)}
          className="px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-subtle border border-border-subtle text-xs font-medium text-zinc-300 transition-colors disabled:opacity-50"
        >
          400 (Silver 100%)
        </button>
        <button
          disabled={isSeeding || !isConnected}
          onClick={() => handleSeed(800)}
          className="px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-subtle border border-cyan-500/30 text-xs font-medium text-cyan-300 transition-colors disabled:opacity-50"
        >
          800 (Platinum 50%)
        </button>

        {/* Custom Input */}
        <div className="flex items-center gap-2 ml-auto">
          <input
            type="number"
            min="0"
            max="1000"
            value={customScore}
            onChange={(e) => setCustomScore(e.target.value)}
            placeholder="Score 0-1000"
            disabled={isSeeding || !isConnected}
            className="w-28 px-3 py-1.5 text-xs rounded-lg bg-surface border border-border-subtle text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50 font-mono"
          />
          <button
            disabled={isSeeding || !customScore || !isConnected}
            onClick={() => handleSeed(customScore)}
            className="px-3 py-1.5 text-xs rounded-lg gradient-btn text-white font-semibold disabled:opacity-50"
          >
            {isSeeding ? "Seeding..." : "Seed"}
          </button>
        </div>
      </div>
    </div>
  );
}
