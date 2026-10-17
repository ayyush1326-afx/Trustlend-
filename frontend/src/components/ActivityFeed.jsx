import React from "react";
import { ExternalLink, ArrowUpRight, ArrowDownLeft, Flame, ShieldAlert, Award, Activity } from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import { shortenAddress, getExplorerUrl } from "../utils/formatters";
import EmptyState from "./EmptyState";

export default function ActivityFeed() {
  const { recentActivities, chainId } = useWeb3();

  const getEventIcon = (type) => {
    switch (type) {
      case "Borrowed":
        return <ArrowUpRight className="w-4 h-4 text-cyan-400" />;
      case "Repaid":
        return <ArrowDownLeft className="w-4 h-4 text-emerald-400" />;
      case "Liquidated":
        return <Flame className="w-4 h-4 text-rose-400" />;
      case "Deposited":
        return <ArrowDownLeft className="w-4 h-4 text-indigo-400" />;
      case "ScoreUpdated":
        return <Award className="w-4 h-4 text-yellow-400" />;
      default:
        return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            <span>On-Chain Activity</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Live verifiable transactions on Sepolia</p>
        </div>
      </div>

      {recentActivities.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No Recent Activity Yet"
          description="Contract events will appear here in real time as loans are issued, repaid, and liquidated."
        />
      ) : (
        <div className="divide-y divide-border-subtle">
          {recentActivities.map((act, index) => {
            const explorerUrl = getExplorerUrl(act.txHash, "tx", chainId || 11155111);
            return (
              <div
                key={`${act.txHash}-${index}`}
                className="py-3.5 flex items-center justify-between gap-4 text-xs hover:bg-surface-subtle/40 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-surface-subtle border border-border-subtle flex items-center justify-center shrink-0">
                    {getEventIcon(act.type)}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-200">{act.description}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      By {shortenAddress(act.user)} • Block #{act.blockNumber}
                    </div>
                  </div>
                </div>

                {explorerUrl && (
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] font-mono text-indigo-400 hover:text-cyan-300 transition-colors p-1"
                    title="View transaction on Etherscan"
                  >
                    <span>Etherscan</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
