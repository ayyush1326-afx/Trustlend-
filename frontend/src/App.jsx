import React, { useState } from "react";
import { Toaster } from "react-hot-toast";
import { useWeb3 } from "./context/Web3Context";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import StatsBar from "./components/StatsBar";
import ScoreGauge from "./components/ScoreGauge";
import CollateralStaircaseChart from "./components/CollateralStaircaseChart";
import BorrowCard from "./components/BorrowCard";
import LoanCard from "./components/LoanCard";
import LendPanel from "./components/LendPanel";
import ActivityFeed from "./components/ActivityFeed";
import DemoPanel from "./components/DemoPanel";
import EmptyState from "./components/EmptyState";
import Footer from "./components/Footer";
import { FileText, ShieldAlert, Sparkles, Flame, CheckCircle2 } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isQuickLoanMode, setIsQuickLoanMode] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    poolStats,
    userScore,
    userLoans,
    overdueLoans,
    refreshData,
    isConnected,
    demoMode,
    account,
  } = useWeb3();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setIsRefreshing(false);
  };

  const handleQuickLoanModeToggle = () => {
    setIsQuickLoanMode(!isQuickLoanMode);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#111827",
            color: "#F3F4F6",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(12px)",
            borderRadius: "1rem",
            fontSize: "0.875rem",
          },
          success: {
            iconTheme: { primary: "#22D3EE", secondary: "#111827" },
          },
          error: {
            iconTheme: { primary: "#F43F5E", secondary: "#111827" },
          },
        }}
      />

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Demo Controller Panel (Visible when demoMode is enabled) */}
        {demoMode && (
          <DemoPanel
            onQuickLoanMode={handleQuickLoanModeToggle}
            isQuickLoanMode={isQuickLoanMode}
          />
        )}

        {/* Global Live Stats Bar */}
        <StatsBar poolStats={poolStats} />

        {/* TAB 1: DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            <Hero
              onGetStarted={() => setActiveTab("borrow")}
              onExploreLend={() => setActiveTab("lend")}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ScoreGauge score={userScore} />
              <CollateralStaircaseChart userScore={userScore} />
            </div>

            <ActivityFeed />
          </div>
        )}

        {/* TAB 2: BORROW */}
        {activeTab === "borrow" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <BorrowCard onLoanSuccess={() => setActiveTab("loans")} />
            </div>

            {/* Side Info & Tips */}
            <div className="space-y-6">
              <ScoreGauge score={userScore} />

              <div className="glass-panel p-6 rounded-2xl">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Borrowing Rules</span>
                </h3>
                <ul className="text-xs text-slate-400 space-y-2.5">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span><strong>1 Active Loan:</strong> You may only maintain one open loan at any time to preserve pool safety.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span><strong>Flat 5% Fee:</strong> No variable interest rate spikes. Fixed flat 5% fee calculated on principal.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span><strong>Repay On-Time:</strong> Settle before deadline to receive <strong>+50 credit points</strong>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span><strong>Overdue Defaults:</strong> Past due loans can be liquidated by any wallet, deducting <strong>300 points</strong>.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MY LOANS */}
        {activeTab === "loans" && (
          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Your Loan History</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Track your active obligations and past repayments</p>
                </div>
                <button
                  onClick={() => setActiveTab("borrow")}
                  className="gradient-btn px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-glow"
                >
                  New Loan
                </button>
              </div>

              {!isConnected ? (
                <EmptyState
                  icon={FileText}
                  title="Connect Your Wallet"
                  description="Connect your MetaMask wallet to view your active and past DeFi loans."
                />
              ) : userLoans.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No Loans Found"
                  description="You have not initiated any loans yet. Borrow up to your tier limit to start building your on-chain credit score."
                  action={
                    <button
                      onClick={() => setActiveTab("borrow")}
                      className="gradient-btn px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-glow"
                    >
                      Borrow Now
                    </button>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userLoans.map((loan) => (
                    <LoanCard key={loan.id} loan={loan} isBorrowerView={true} />
                  ))}
                </div>
              )}
            </div>

            {/* Overdue Loans for Liquidators (Demo Feature) */}
            <div className="pt-6 border-t border-border-subtle">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-rose-500" />
                    <h2 className="text-lg font-bold text-white">Liquidate Overdue Loans</h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Permissionless liquidations. Anyone can liquidate defaulted loans to seize collateral into pool liquidity.
                  </p>
                </div>
              </div>

              {overdueLoans.length === 0 ? (
                <div className="p-5 rounded-2xl glass-panel text-center text-xs text-slate-400 border border-border-subtle">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                  <span>All active pool loans are currently in good standing! No overdue loans to liquidate.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {overdueLoans.map((loan) => (
                    <LoanCard key={loan.id} loan={loan} isBorrowerView={false} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: LEND */}
        {activeTab === "lend" && (
          <div className="space-y-8">
            <LendPanel />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
