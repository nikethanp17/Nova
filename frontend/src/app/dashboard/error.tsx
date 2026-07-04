"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard boundary caught error:", error);
  }, [error]);

  return (
    <div className="w-full min-h-[400px] flex items-center justify-center">
      <div className="glass p-8 rounded-2xl border border-red-500/20 bg-red-500/5 max-w-md text-center flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-white font-bold text-base">
            Execution Boundary Failed
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            {error.message ||
              "An unexpected error occurred while communicating with agent processes."}
          </p>
        </div>
        <button
          onClick={() => reset()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold text-xs transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reconnect Session
        </button>
      </div>
    </div>
  );
}
