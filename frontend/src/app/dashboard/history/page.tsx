"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import { fetchExecutionHistory, HistoryRecord } from "@/lib/historyAdapter";
import Image from "next/image";
import {
  History,
  Search,
  Filter,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  RotateCcw,
  Maximize2,
  Monitor,
  Zap,
  Globe,
  MousePointerClick,
  Type,
  Send,
  Eye,
  CalendarDays,
  BarChart3,
  Timer,
  TrendingUp,
} from "lucide-react";

// ─── Animation Variants ────────────────────────────────────────────────────────
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" as const },
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.055 } },
};

const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.22, ease: "easeOut" as const },
  },
  exit: { opacity: 0, scale: 0.96, y: 6, transition: { duration: 0.16 } },
};

const stepRowVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.25, ease: "easeOut" as const },
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_BADGE: Record<string, string> = {
  COMPLETED: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  RUNNING:   "bg-blue-500/10 border-blue-500/20 text-blue-400",
  FAILED:    "bg-rose-500/10 border-rose-500/20 text-rose-400",
  CANCELLED: "bg-slate-500/10 border-slate-500/20 text-slate-400",
};

const STEP_BADGE: Record<string, string> = {
  SUCCESS:   "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  COMPLETED: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  FAILED:    "bg-rose-500/10 border-rose-500/20 text-rose-400",
  RUNNING:   "bg-blue-500/10 border-blue-500/20 text-blue-400",
  PENDING:   "bg-slate-500/10 border-slate-500/20 text-slate-400",
};

const STEP_DOT: Record<string, string> = {
  SUCCESS:   "bg-emerald-400",
  COMPLETED: "bg-emerald-400",
  FAILED:    "bg-rose-400",
  RUNNING:   "bg-blue-400 animate-pulse",
  PENDING:   "bg-slate-600",
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
  navigate: <Globe className="w-3 h-3 text-sky-400" />,
  click:    <MousePointerClick className="w-3 h-3 text-violet-400" />,
  type:     <Type className="w-3 h-3 text-emerald-400" />,
  fill:     <Type className="w-3 h-3 text-emerald-400" />,
  submit:   <Send className="w-3 h-3 text-indigo-400" />,
  extract:  <Eye className="w-3 h-3 text-sky-400" />,
  verify:   <CheckCircle2 className="w-3 h-3 text-emerald-400" />,
  wait:     <Clock className="w-3 h-3 text-amber-400" />,
};

function getActionIcon(action: string): React.ReactNode {
  return ACTION_ICONS[action?.toLowerCase()] ?? <Zap className="w-3 h-3 text-slate-400" />;
}

function fmtDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

function fmtElapsed(start: string, end: string | null): string {
  if (!end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return fmtDuration(ms);
}

const getScreenshotUrl = (path: string | null) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
  const origin = apiUrl.replace(/\/api\/v1\/?$/, ""); // strip /api/v1
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${cleanPath}`;
};

// ─── Screenshot Fullscreen Modal ──────────────────────────────────────────────
function ScreenshotModal({
  src,
  stepNumber,
  onClose,
}: {
  src: string;
  stepNumber: number;
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="relative max-w-5xl w-full glass rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-slate-950/50">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Monitor className="w-3.5 h-3.5 text-amber-400" />
            Step {stepNumber} — Screenshot
          </span>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="relative w-full bg-slate-950/60" style={{ aspectRatio: "16/9" }}>
          <Image src={getScreenshotUrl(src)} alt={`Step ${stepNumber} screenshot`} fill className="object-contain" loading="lazy" unoptimized />
        </div>
        <p className="text-[10px] text-slate-600 text-center py-2 font-mono">Press ESC to close</p>
      </motion.div>
    </motion.div>
  );
}

// ─── Execution Details Modal ──────────────────────────────────────────────────
function ExecutionDetailsModal({
  record,
  onClose,
}: {
  record: HistoryRecord;
  onClose: () => void;
}) {
  const [screenshotSrc, setScreenshotSrc] = useState<{ src: string; step: number } | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && !screenshotSrc) onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, screenshotSrc]);

  const totalSteps = record.stepResults.length;
  const successCount = record.stepResults.filter((s) => s.status === "SUCCESS" || s.status === "COMPLETED").length;
  const failedCount = record.stepResults.filter((s) => s.status === "FAILED").length;
  const totalDuration = record.stepResults.reduce((acc, s) => acc + (s.duration_ms ?? 0), 0);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-start justify-center p-4 sm:p-8 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="w-full max-w-3xl glass rounded-2xl border border-white/10 overflow-hidden shadow-2xl my-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-white/5 bg-slate-950/40 flex items-start justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <h2 className="text-sm font-bold text-white truncate">{record.taskTitle}</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-0.5 text-[9px] font-bold border rounded-full ${STATUS_BADGE[record.status] ?? STATUS_BADGE.CANCELLED}`}>
                  {record.status}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(record.startedAt).toLocaleString()}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/5">
            {[
              { label: "Total Steps", value: totalSteps, icon: <BarChart3 className="w-3.5 h-3.5 text-slate-400" /> },
              { label: "Succeeded", value: successCount, icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> },
              { label: "Failed", value: failedCount, icon: <XCircle className="w-3.5 h-3.5 text-rose-400" /> },
              { label: "Duration", value: fmtElapsed(record.startedAt, record.completedAt), icon: <Timer className="w-3.5 h-3.5 text-violet-400" /> },
            ].map((s) => (
              <div key={s.label} className="p-4 bg-slate-950/40 flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  {s.icon}
                  <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">{s.label}</span>
                </div>
                <span className="text-base font-extrabold text-white">{s.value}</span>
              </div>
            ))}
          </div>

          {/* Goal */}
          <div className="px-6 py-4 border-b border-white/5">
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-1">Goal</p>
            <p className="text-xs text-slate-300 leading-relaxed">{record.taskGoal}</p>
          </div>

          {/* Error (if any) */}
          {record.error && (
            <div className="px-6 py-4 border-b border-white/5">
              <div className="flex items-start gap-2 p-3 rounded-lg border border-rose-500/20 bg-rose-500/5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                <span className="text-xs text-rose-300 font-mono leading-relaxed">{record.error}</span>
              </div>
            </div>
          )}

          {/* Step Timeline */}
          <div className="px-6 py-4 space-y-3">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Step Timeline</p>
              <span className="text-[10px] text-slate-600 font-mono">{totalDuration > 0 ? fmtDuration(totalDuration) : "—"} total</span>
            </div>

            {totalSteps === 0 ? (
              <p className="text-xs text-slate-600 text-center py-6">No step results recorded.</p>
            ) : (
              <div className="relative border-l border-white/5 pl-5 ml-2 space-y-4">
                <motion.div variants={containerVariants} initial="hidden" animate="visible">
                  {record.stepResults.map((step, idx) => (
                    <motion.div key={idx} variants={stepRowVariants} className="relative group">
                      {/* Dot */}
                      <span className={`absolute -left-[25px] top-2.5 w-3 h-3 rounded-full border-2 border-slate-950 ${STEP_DOT[step.status] ?? "bg-slate-600"}`} />

                      <div className={`p-3.5 rounded-xl border transition-all group-hover:bg-white/1 ${
                        step.status === "SUCCESS" || step.status === "COMPLETED"
                          ? "border-emerald-500/10 bg-emerald-500/3"
                          : step.status === "FAILED"
                          ? "border-rose-500/10 bg-rose-500/3"
                          : "border-white/5 bg-slate-950/20"
                      }`}>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[9px] text-slate-600 font-mono shrink-0">#{step.step_number}</span>
                            {getActionIcon(step.action)}
                            <span className="text-xs font-semibold text-white truncate">{step.action}</span>
                            {step.target && (
                              <code className="text-[9px] text-sky-300 font-mono truncate max-w-[140px]">{step.target}</code>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`px-2 py-0.5 text-[8px] font-bold border rounded-full ${STEP_BADGE[step.status] ?? STEP_BADGE.PENDING}`}>
                              {step.status}
                            </span>
                            <span className="text-[9px] text-slate-500 font-mono">{fmtDuration(step.duration_ms)}</span>
                            <span className="text-[9px] text-slate-600 font-mono">{(step.confidence * 100).toFixed(0)}%</span>
                          </div>
                        </div>

                        {step.error && (
                          <div className="flex items-start gap-1.5 mt-1.5 p-2 rounded border border-rose-500/10 bg-rose-500/5">
                            <AlertCircle className="w-2.5 h-2.5 text-rose-400 shrink-0 mt-0.5" />
                            <span className="text-[9px] text-rose-300 font-mono leading-relaxed">{step.error}</span>
                          </div>
                        )}

                        {/* Screenshot Thumbnail */}
                        {step.screenshot_path && (
                          <button
                            onClick={() => setScreenshotSrc({ src: step.screenshot_path!, step: step.step_number })}
                            className="mt-2 relative w-24 h-14 rounded-lg overflow-hidden border border-white/5 hover:border-amber-500/30 group/ss transition-all bg-slate-950"
                          >
                            <Image src={getScreenshotUrl(step.screenshot_path)} alt={`Step ${step.step_number}`} fill className="object-cover group-hover/ss:scale-105 transition-transform" loading="lazy" unoptimized />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/ss:opacity-100 transition-opacity flex items-center justify-center">
                              <Maximize2 className="w-3 h-3 text-white" />
                            </div>
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            )}
          </div>

          {/* Screenshots Gallery */}
          {record.stepResults.filter((s) => s.screenshot_path).length > 0 && (
            <div className="px-6 pb-6 space-y-3">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                All Screenshots ({record.stepResults.filter((s) => s.screenshot_path).length})
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {record.stepResults
                  .filter((s) => s.screenshot_path)
                  .map((s) => (
                    <button
                      key={s.step_number}
                      onClick={() => setScreenshotSrc({ src: s.screenshot_path!, step: s.step_number })}
                      className="relative aspect-video rounded-lg overflow-hidden border border-white/5 hover:border-amber-500/30 group transition-all bg-slate-950"
                    >
                      <Image src={getScreenshotUrl(s.screenshot_path!)} alt={`Step ${s.step_number}`} fill className="object-cover group-hover:scale-105 transition-transform" loading="lazy" unoptimized />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 className="w-4 h-4 text-white" />
                      </div>
                      <span className="absolute bottom-1 left-1 text-[8px] text-white/70 font-mono bg-black/50 px-1 rounded">
                        #{s.step_number}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Screenshot fullscreen overlay */}
      <AnimatePresence>
        {screenshotSrc && (
          <ScreenshotModal
            src={screenshotSrc.src}
            stepNumber={screenshotSrc.step}
            onClose={() => setScreenshotSrc(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── History Card ─────────────────────────────────────────────────────────────
function HistoryCard({
  record,
  onViewDetails,
}: {
  record: HistoryRecord;
  onViewDetails: (r: HistoryRecord) => void;
}) {
  const total = record.stepResults.length;
  const success = record.stepResults.filter(
    (s) => s.status === "SUCCESS" || s.status === "COMPLETED"
  ).length;
  const successRate = total > 0 ? Math.round((success / total) * 100) : 0;

  return (
    <motion.div
      variants={cardVariants}
      layout
      className="glass p-5 rounded-2xl border border-white/10 hover:border-white/15 hover:bg-white/1 transition-all duration-200 flex flex-col gap-4 group"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h3 className="font-bold text-sm text-white truncate group-hover:text-amber-300 transition-colors">
            {record.taskTitle}
          </h3>
          <p className="text-xs text-slate-400 line-clamp-1 leading-relaxed">{record.taskGoal}</p>
        </div>
        <span className={`px-2.5 py-0.5 text-[9px] font-bold border rounded-full shrink-0 ${STATUS_BADGE[record.status] ?? STATUS_BADGE.CANCELLED}`}>
          {record.status}
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="space-y-0.5">
          <p className="text-[9px] text-slate-600 uppercase font-bold tracking-wider flex items-center gap-1">
            <CalendarDays className="w-2.5 h-2.5" /> Started
          </p>
          <p className="text-[10px] text-slate-400 font-mono">{new Date(record.startedAt).toLocaleString()}</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-[9px] text-slate-600 uppercase font-bold tracking-wider flex items-center gap-1">
            <Timer className="w-2.5 h-2.5" /> Duration
          </p>
          <p className="text-[10px] text-slate-300 font-mono font-semibold">{fmtElapsed(record.startedAt, record.completedAt)}</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-[9px] text-slate-600 uppercase font-bold tracking-wider flex items-center gap-1">
            <BarChart3 className="w-2.5 h-2.5" /> Steps
          </p>
          <p className="text-[10px] text-slate-300 font-mono font-semibold">{total > 0 ? `${success}/${total}` : "—"}</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-[9px] text-slate-600 uppercase font-bold tracking-wider flex items-center gap-1">
            <TrendingUp className="w-2.5 h-2.5" /> Success %
          </p>
          <p className={`text-[10px] font-mono font-semibold ${successRate >= 75 ? "text-emerald-400" : successRate >= 50 ? "text-amber-400" : "text-rose-400"}`}>
            {total > 0 ? `${successRate}%` : "—"}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
          <motion.div
            className={`h-full rounded-full ${
              record.status === "COMPLETED"
                ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                : record.status === "FAILED"
                ? "bg-gradient-to-r from-rose-500 to-red-500"
                : "bg-gradient-to-r from-slate-600 to-slate-500"
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${successRate}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        {record.error && (
          <p className="text-[10px] text-rose-400 font-mono truncate max-w-[60%]" title={record.error}>
            ⚠ {record.error}
          </p>
        )}
        <button
          id={`view-details-${record.executionId}`}
          onClick={() => onViewDetails(record)}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600/10 border border-amber-500/20 text-amber-400 font-semibold text-xs hover:bg-amber-500/15 transition-colors"
        >
          View Details <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function HistorySkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass p-5 rounded-2xl border border-white/10 space-y-4 animate-pulse">
          <div className="flex justify-between">
            <div className="space-y-2 flex-1 pr-4">
              <div className="h-4 w-48 bg-white/5 rounded" />
              <div className="h-3 w-64 bg-white/5 rounded" />
            </div>
            <div className="h-5 w-20 bg-white/5 rounded-full" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="space-y-1.5">
                <div className="h-2.5 w-12 bg-white/5 rounded" />
                <div className="h-3 w-16 bg-white/5 rounded" />
              </div>
            ))}
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ─── Page Constants ────────────────────────────────────────────────────────────
const PAGE_SIZE = 8;
const ALL_STATUSES = ["COMPLETED", "FAILED", "RUNNING", "CANCELLED"];

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HistoryPage() {
  const {
    data: history = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["history"],
    queryFn: fetchExecutionHistory,
    staleTime: 30_000,
    retry: 0,
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [page, setPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, statusFilter, dateFilter]);

  const filtered = history.filter((r) => {
    const matchSearch =
      !search ||
      r.taskTitle.toLowerCase().includes(search.toLowerCase()) ||
      r.taskGoal.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === "ALL" || r.status === statusFilter;

    const now = new Date();
    const start = new Date(r.startedAt);
    let matchDate = true;
    if (dateFilter === "today") {
      matchDate = start.toDateString() === now.toDateString();
    } else if (dateFilter === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchDate = start >= weekAgo;
    } else if (dateFilter === "month") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      matchDate = start >= monthAgo;
    }

    return matchSearch && matchStatus && matchDate;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Summary stats
  const totalRuns = history.length;
  const completedRuns = history.filter((r) => r.status === "COMPLETED").length;
  const failedRuns = history.filter((r) => r.status === "FAILED").length;
  const avgSuccess =
    history.length > 0
      ? Math.round(
          history.reduce((acc, r) => {
            const total = r.stepResults.length;
            const ok = r.stepResults.filter(
              (s) => s.status === "SUCCESS" || s.status === "COMPLETED"
            ).length;
            return acc + (total > 0 ? ok / total : 0);
          }, 0) / history.length * 100
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* ─── Page Header ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" />
            Execution History
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Archived logs, step results, and screenshots from all browser agent runs.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 bg-white/3 hover:bg-white/6 text-slate-300 text-xs font-semibold transition-colors shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Refresh
        </button>
      </motion.div>

      {/* ─── Summary Stats ───────────────────────────────────────────────── */}
      {!isLoading && !isError && history.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            { label: "Total Runs", value: totalRuns, icon: <History className="w-4.5 h-4.5 text-amber-400" />, accent: "amber" },
            { label: "Completed", value: completedRuns, icon: <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />, accent: "emerald" },
            { label: "Failed", value: failedRuns, icon: <XCircle className="w-4.5 h-4.5 text-rose-400" />, accent: "rose" },
            { label: "Avg Success", value: `${avgSuccess}%`, icon: <TrendingUp className="w-4.5 h-4.5 text-violet-400" />, accent: "violet" },
          ].map((s) => (
            <div key={s.label} className="glass p-4 rounded-2xl border border-white/10 flex items-center gap-3 hover:border-white/15 transition-colors">
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 bg-${s.accent}-500/10 border-${s.accent}-500/20`}>
                {s.icon}
              </div>
              <div>
                <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">{s.label}</p>
                <p className="text-lg font-extrabold text-white">{s.value}</p>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* ─── Filters ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            id="history-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by task name or goal…"
            className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-white/5 bg-slate-950/40 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/40 transition-colors"
          />
          <AnimatePresence>
            {search && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Status filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          <select
            id="history-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-9 pr-3 py-2.5 rounded-xl border border-white/5 bg-slate-950/40 text-xs text-slate-300 focus:outline-none focus:border-amber-500/40 min-w-[140px]"
          >
            <option value="ALL">All Statuses</option>
            {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Date filter */}
        <div className="relative">
          <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          <select
            id="history-date-filter"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as typeof dateFilter)}
            className="pl-9 pr-3 py-2.5 rounded-xl border border-white/5 bg-slate-950/40 text-xs text-slate-300 focus:outline-none focus:border-amber-500/40 min-w-[130px]"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>
      </motion.div>

      {/* ─── Content ─────────────────────────────────────────────────────── */}
      {isLoading ? (
        <HistorySkeleton />
      ) : isError ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass p-10 rounded-2xl border border-rose-500/20 bg-rose-500/3 flex flex-col items-center gap-4 text-center"
        >
          <AlertCircle className="w-10 h-10 text-rose-400" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">Failed to Load History</h3>
            <p className="text-xs text-slate-400">Could not retrieve execution records from the server.</p>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600/10 border border-rose-500/20 text-rose-400 text-xs font-semibold hover:bg-rose-500/15 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Retry
          </button>
        </motion.div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass p-12 rounded-2xl border border-white/10 flex flex-col items-center gap-4 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <History className="w-8 h-8 text-amber-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-300">
              {history.length === 0 ? "No execution history yet" : "No matching records"}
            </h3>
            <p className="text-xs text-slate-500">
              {history.length === 0
                ? "Execute a task to start building your history."
                : "Try adjusting your search or filters."}
            </p>
          </div>
          {(search || statusFilter !== "ALL" || dateFilter !== "all") && (
            <button
              onClick={() => { setSearch(""); setStatusFilter("ALL"); setDateFilter("all"); }}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2 transition-colors"
            >
              Clear filters
            </button>
          )}
        </motion.div>
      ) : (
        <>
          <motion.div
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence mode="popLayout">
              {paginated.map((record) => (
                <HistoryCard
                  key={record.executionId}
                  record={record}
                  onViewDetails={setSelectedRecord}
                />
              ))}
            </AnimatePresence>
          </motion.div>

          {/* ─── Pagination ─────────────────────────────────────────── */}
          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between"
            >
              <p className="text-[10px] text-slate-600 font-mono">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-white/5 bg-white/3 hover:bg-white/6 text-slate-400 hover:text-white disabled:opacity-30 transition-all"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={`w-7 h-7 rounded-lg text-[10px] font-bold transition-all ${
                        page === i + 1
                          ? "bg-amber-600/20 border border-amber-500/30 text-amber-400"
                          : "bg-white/3 border border-white/5 text-slate-500 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-white/5 bg-white/3 hover:bg-white/6 text-slate-400 hover:text-white disabled:opacity-30 transition-all"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* ─── Details Modal ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedRecord && (
          <ExecutionDetailsModal
            record={selectedRecord}
            onClose={() => setSelectedRecord(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
