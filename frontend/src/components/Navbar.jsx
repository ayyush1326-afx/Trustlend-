import React from "react";
import { ShieldCheck, Wallet, AlertOctagon, LogOut, RefreshCw, ChevronDown } from "lucide-react";
import { useWallet } from "../hooks/useWallet";
import { shortenAddress, formatEth } from "../utils/formatters";
import { SEPOLIA_CHAIN_ID, SUPPORTED_CHAINS } from "../utils/constants";
import AddressChip from "./AddressChip";

export default function Navbar({ activeTab, setActiveTab, onRefresh, isRefreshing }) {
  const {
    account,
    chainId,
    ethBalance,
    isConnected,
    isWrongNetwork,
    connectWallet,
    disconnectWallet,
    switchToSepolia,
    isConnecting,
  } = useWallet();

  const networkName = SUPPORTED_CHAINS[chainId]?.name || (chainId ? `Chain ${chainId}` : "Disconnected");

  return (
    <>
      {/* Wrong Network Banner */}
      {isConnected && isWrongNetwork && (
        <div className="bg-gradient-to-r from-rose-600/90 via-amber-600/90 to-rose-600/90 text-white px-4 py-2 text-xs md:text-sm font-medium flex items-center justify-between shadow-lg sticky top-0 z-50">
          <div className="flex items-center gap-2 max-w-4xl mx-auto w-full justify-between">
            <span className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 shrink-0 text-white animate-bounce" />
              <span>You are connected to an unsupported network. Please switch to Ethereum Sepolia.</span>
            </span>
            <button
              onClick={switchToSepolia}
              className="px-3 py-1 bg-white text-slate-900 rounded-lg font-semibold hover:bg-slate-100 transition-colors shrink-0 shadow"
            >
              Switch to Sepolia
            </button>
          </div>
        </div>
      )}

      {/* Main Sticky Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-border-subtle bg-[#0B0F1A]/80 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("dashboard")}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 p-0.5 shadow-glow flex items-center justify-center">
                <div className="w-full h-full bg-[#111827] rounded-[10px] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg tracking-tight text-white font-sans">
                    Trust<span className="text-cyan-400">Lend</span>
                  </span>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Sepolia Devcon
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">Credit scores for DeFi</p>
              </div>
            </div>

            {/* Navigation Tabs (Desktop) */}
            <nav className="hidden md:flex items-center gap-1 bg-surface-subtle/60 p-1 rounded-xl border border-border-subtle">
              {[
                { id: "dashboard", label: "Dashboard" },
                { id: "borrow", label: "Borrow" },
                { id: "loans", label: "My Loans" },
                { id: "lend", label: "Lend" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all relative ${
                    activeTab === tab.id
                      ? "text-white bg-surface shadow-sm font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-surface/40"
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full" />
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Right Wallet & Actions */}
          <div className="flex items-center gap-3">
            {/* Live refresh button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-surface-subtle border border-border-subtle text-slate-400 hover:text-slate-200 transition-colors"
              title="Refresh protocol data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`} />
            </button>

            {/* Network pill */}
            {isConnected && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-subtle border border-border-subtle text-xs font-medium text-slate-300">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isWrongNetwork ? "bg-rose-500 animate-pulse" : "bg-emerald-400"
                  }`}
                />
                <span>{networkName}</span>
              </div>
            )}

            {/* Wallet Connect / User Menu */}
            {!isConnected ? (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="gradient-btn px-4 py-2 rounded-xl text-white text-sm font-semibold flex items-center gap-2 shadow-glow"
              >
                <Wallet className="w-4 h-4" />
                <span>{isConnecting ? "Connecting..." : "Connect Wallet"}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-surface-subtle/90 border border-border-subtle rounded-xl p-1 pl-3">
                <div className="text-right hidden sm:block pr-1">
                  <div className="text-xs font-semibold text-slate-200">
                    {formatEth(ethBalance, 3)} <span className="text-slate-400">ETH</span>
                  </div>
                </div>
                <AddressChip address={account} chainId={chainId} showExplorer={false} />
                <button
                  onClick={disconnectWallet}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-surface transition-colors"
                  title="Disconnect wallet"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden border-t border-border-subtle bg-surface-subtle/50 px-4 py-2 flex items-center justify-around">
          {[
            { id: "dashboard", label: "Dashboard" },
            { id: "borrow", label: "Borrow" },
            { id: "loans", label: "My Loans" },
            { id: "lend", label: "Lend" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>
    </>
  );
}
