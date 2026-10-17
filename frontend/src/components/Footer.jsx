import React from "react";
import { ShieldCheck, ExternalLink, Github, Heart } from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import AddressChip from "./AddressChip";
import { getExplorerUrl } from "../utils/formatters";

export default function Footer() {
  const { registryAddress, poolAddress, chainId } = useWeb3();

  return (
    <footer className="border-t border-border-subtle bg-[#080B14] mt-20 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 p-0.5 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-base text-white">TrustLend</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              Credit scores for DeFi. Transforming collateralized lending through decentralized on-chain reputation. Built for Ethereum Sepolia testnet.
            </p>
          </div>

          {/* Smart Contracts */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Verified Smart Contracts
            </h4>
            <div className="space-y-2">
              <div>
                <span className="text-[11px] text-slate-400 block mb-0.5">ReputationRegistry:</span>
                <AddressChip address={registryAddress} chainId={chainId} />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block mb-0.5">LendingPool:</span>
                <AddressChip address={poolAddress} chainId={chainId} />
              </div>
            </div>
          </div>

          {/* Hackathon Details */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">
              Architecture & Transparency
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li>• Single asset (ETH) avoids oracle dependencies</li>
              <li>• Checks-Effects-Interactions & OpenZeppelin ReentrancyGuard</li>
              <li>• Zero admin backdoors on user liquidity</li>
              <li>• Flat 5% borrow fee directly accrues to share value</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border-subtle/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <div>
            © {new Date().getFullYear()} TrustLend Protocol. Built for Devcon Hackathon.
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">Ethereum Sepolia Testnet</span>
            <span>•</span>
            <span className="text-cyan-400">Under-collateralized DeFi</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
