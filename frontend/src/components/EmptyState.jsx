import React from "react";
import { FolderOpen } from "lucide-react";

export default function EmptyState({ icon: Icon = FolderOpen, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center glass-panel border border-dashed border-border-subtle rounded-2xl">
      <div className="w-14 h-14 rounded-2xl bg-surface-subtle border border-border-subtle flex items-center justify-center mb-4 text-slate-400">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-medium text-slate-200 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm mb-4">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
