import React from "react";
import { CheckCircle2, Clock, AlertTriangle, XCircle } from "lucide-react";

export default function StatusPill({ status, repaidLate = false }) {
  // Status: 0=Active, 1=Repaid, 2=Defaulted
  if (status === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-950/60 text-amber-300 border border-amber-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        <Clock className="w-3.5 h-3.5" />
        Active
      </span>
    );
  }

  if (status === 1) {
    if (repaidLate) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-950/60 text-purple-300 border border-purple-500/30">
          <AlertTriangle className="w-3.5 h-3.5" />
          Repaid Late
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Repaid On-Time
      </span>
    );
  }

  if (status === 2) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-950/60 text-rose-300 border border-rose-500/30">
        <XCircle className="w-3.5 h-3.5" />
        Defaulted
      </span>
    );
  }

  return null;
}
