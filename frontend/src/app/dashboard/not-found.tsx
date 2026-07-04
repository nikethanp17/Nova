"use client";

import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function DashboardNotFound() {
  return (
    <div className="w-full min-h-[400px] flex items-center justify-center">
      <div className="glass p-8 rounded-2xl border border-white/10 max-w-sm text-center flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-white font-bold text-base">Resource Not Found</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            The task, plan execution, or route parameter you requested does not
            exist or has been deleted.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-xs shadow transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
