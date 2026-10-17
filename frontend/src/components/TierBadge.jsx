import React from "react";
import { ShieldCheck, Award, Zap, Crown, Sparkles } from "lucide-react";
import { TIERS } from "../utils/constants";

export default function TierBadge({ tierIndex = 0, size = "md", showIcon = true }) {
  const tier = TIERS[tierIndex] || TIERS[0];

  const getTierIcon = () => {
    switch (tier.index) {
      case 0:
        return <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />;
      case 1:
        return <Award className="w-3.5 h-3.5 text-amber-400" />;
      case 2:
        return <Zap className="w-3.5 h-3.5 text-zinc-300" />;
      case 3:
        return <Crown className="w-3.5 h-3.5 text-yellow-400" />;
      case 4:
        return <Sparkles className="w-3.5 h-3.5 text-cyan-400" />;
      default:
        return null;
    }
  };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3.5 py-1.5 text-sm font-semibold",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-sm font-medium transition-all ${
        tier.badgeClass
      } ${sizeClasses[size] || sizeClasses.md}`}
    >
      {showIcon && getTierIcon()}
      <span>{tier.name}</span>
    </span>
  );
}
