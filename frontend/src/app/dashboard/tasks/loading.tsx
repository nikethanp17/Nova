"use client";

export default function TasksLoading() {
  return (
    <div className="w-full min-h-[300px] flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-500">Loading task repositories...</span>
      </div>
    </div>
  );
}
