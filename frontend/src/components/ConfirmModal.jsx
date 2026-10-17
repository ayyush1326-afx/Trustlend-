import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle } from "lucide-react";

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  subtitle,
  details = [],
  confirmText = "Confirm Transaction",
  confirmColor = "gradient-btn",
  isLoading = false,
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={!isLoading ? onClose : undefined}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md glass-panel p-6 rounded-2xl border border-border-glass shadow-2xl z-10"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-100">{title}</h3>
              {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
            {!isLoading && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-surface-subtle transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Details list */}
          {details.length > 0 && (
            <div className="space-y-2.5 py-3 border-y border-border-subtle my-4">
              {details.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-slate-400">{item.label}</span>
                  <span className={`font-medium ${item.highlight ? "text-indigo-300 font-semibold" : "text-slate-200"}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Warning / Notice */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-300 mb-5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Smart contract execution will prompt a transaction signature in your MetaMask wallet.</span>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-border-subtle hover:bg-surface-subtle text-slate-300 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={onConfirm}
              className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-lg transition-all ${confirmColor} ${
                isLoading ? "opacity-60 cursor-not-allowed" : "hover:scale-[1.02]"
              }`}
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
