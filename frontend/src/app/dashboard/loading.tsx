"use client";

export default function DashboardLoading() {
  return (
    <div className="w-full min-h-[400px] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-500 font-medium">
          Synchronizing agent telemetry...
        </span>
      </div>
    </div>
  );
}
