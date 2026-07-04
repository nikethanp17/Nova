"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function PlannerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Planner boundary caught error:", error);
  }, [error]);

  return (
    <div className="w-full min-h-[300px] flex items-center justify-center">
      <div className="glass p-6 rounded-2xl border border-red-500/20 bg-red-500/5 max-w-sm text-center flex flex-col items-center gap-3">
        <AlertTriangle className="w-8 h-8 text-red-400" />
        <div className="space-y-1">
          <h3 className="text-white font-bold text-sm">Planner Agent Failure</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            {error.message || "Failed to decompose task parameters."}
          </p>
        </div>
        <button
          onClick={() => reset()}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold text-xs transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Re-engage Agent
        </button>
      </div>
    </div>
  );
}
