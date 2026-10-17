import React, { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { shortenAddress, getExplorerUrl } from "../utils/formatters";

export default function AddressChip({ address, chainId = 11155111, showExplorer = true, className = "" }) {
  const [copied, setCopied] = useState(false);

  if (!address) return null;

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const explorerUrl = getExplorerUrl(address, "address", chainId);

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-subtle/80 border border-border-subtle text-xs font-mono text-slate-300 ${className}`}>
      <span>{shortenAddress(address)}</span>
      <button
        onClick={handleCopy}
        className="text-slate-400 hover:text-slate-100 transition-colors p-0.5"
        title="Copy address"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
      {showExplorer && explorerUrl && (
        <a
          href={explorerUrl}
          target="_blank"
          rel="noreferrer"
          className="text-slate-400 hover:text-indigo-400 transition-colors p-0.5"
          title="View on Etherscan"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
}
