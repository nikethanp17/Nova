"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useTasks } from "@/hooks/useTasks";
import { useExecution, useExecuteTask } from "@/hooks/useExecution";
import { usePlanner } from "@/hooks/usePlanner";
import { TaskStatus } from "@/types/task";
import { BrowserStepResult } from "@/types/execution";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import { STEP_STATUS_STYLES, EXEC_STATUS_STYLES, getActionIcon } from "@/lib/designTokens";
import {
  Play,
  ArrowLeft,
  Loader2,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Monitor,
  ChevronRight,
  Maximize2,
  X,
  AlertCircle,
  RefreshCw,
  Zap,
  Globe,
  MousePointerClick,
  Type,
  Send,
  Eye,
  Timer,
  TrendingUp,
  Radio,
} from "lucide-react";
import { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { toast } from "sonner";
import Image from "next/image";

// ─── Animation Variants ───────────────────────────────────────────────────────
const stepVariants: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: "easeOut" as const },
  },
};

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.22, ease: "easeOut" as const },
  },
  exit: { opacity: 0, scale: 0.94, transition: { duration: 0.16 } },
};

// ─── Color Maps ───────────────────────────────────────────────────────────────


// ─── Duration Formatter ───────────────────────────────────────────────────────
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

function formatDurationFromDates(start: string, end: string | null): string {
  if (!end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return formatDuration(ms);
}

const getScreenshotUrl = (path: string | null) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
  const origin = apiUrl.replace(/\/api\/v1\/?$/, ""); // strip /api/v1
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${cleanPath}`;
};

// ─── Screenshot Modal ─────────────────────────────────────────────────────────
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
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
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
          {/* Modal Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-slate-950/40">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Monitor className="w-3.5 h-3.5 text-indigo-400" />
              Step {stepNumber} — Screenshot
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Image */}
          <div className="relative w-full bg-slate-950/60" style={{ aspectRatio: "16/9" }}>
            <Image
              src={getScreenshotUrl(src)}
              alt={`Step ${stepNumber} screenshot`}
              fill
              className="object-contain"
              loading="lazy"
              unoptimized
            />
          </div>

          <p className="text-[10px] text-slate-600 text-center py-2 font-mono">Press ESC to close</p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Step Thumbnail ───────────────────────────────────────────────────────────
function StepThumbnail({
  step,
  onClick,
}: {
  step: BrowserStepResult;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative w-full aspect-video rounded-lg overflow-hidden border border-white/5 hover:border-indigo-500/30 group transition-all bg-slate-950"
      title={`View Step ${step.step_number} screenshot`}
    >
      <Image
        src={getScreenshotUrl(step.screenshot_path)}
        alt={`Step ${step.step_number}`}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-300"
        loading="lazy"
        unoptimized
      />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <Maximize2 className="w-5 h-5 text-white" />
      </div>
    </button>
  );
}

// ─── Skeleton Loaders ─────────────────────────────────────────────────────────
function ExecutionSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="glass p-6 rounded-2xl border border-white/10">
        <div className="h-3 w-24 bg-white/5 rounded mb-4" />
        <div className="h-6 w-72 bg-white/5 rounded mb-2" />
        <div className="h-3 w-40 bg-white/5 rounded" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass p-5 rounded-2xl border border-white/10 h-28" />
        ))}
      </div>
      <div className="glass p-6 rounded-2xl border border-white/10 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-white/5">
            <div className="w-8 h-8 rounded-full bg-white/5" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 bg-white/5 rounded" />
              <div className="h-2.5 w-48 bg-white/5 rounded" />
            </div>
            <div className="h-5 w-16 bg-white/5 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Overview Stats Card ──────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  sub,
  accent = "violet",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  const accentMap: Record<string, string> = {
    violet: "bg-violet-500/10 border-violet-500/20",
    blue:   "bg-blue-500/10 border-blue-500/20",
    emerald:"bg-emerald-500/10 border-emerald-500/20",
    rose:   "bg-rose-500/10 border-rose-500/20",
  };
  return (
    <div className="glass p-5 rounded-2xl border border-white/10 flex items-center gap-4 hover:border-white/15 transition-colors">
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${accentMap[accent] ?? accentMap.violet}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{label}</p>
        <p className="text-lg font-extrabold text-white leading-tight">{value}</p>
        {sub && <p className="text-[10px] text-slate-500 font-mono mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyExecution({
  onExecute,
  isExecuting,
  canExecute,
}: {
  onExecute: () => void;
  isExecuting: boolean;
  canExecute: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-12 rounded-2xl border border-white/10 flex flex-col items-center justify-center gap-6 text-center"
    >
      {/* Illustration */}
      <div className="relative">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-blue-600/20 border border-indigo-500/20 flex items-center justify-center">
          <Monitor className="w-10 h-10 text-indigo-400" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-slate-950 border border-white/10 flex items-center justify-center">
          <Radio className="w-3.5 h-3.5 text-slate-600" />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-base font-bold text-white">No Execution Yet</h3>
        <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
          The browser agent has not been launched for this task.
          {canExecute
            ? " Click the button below to start execution."
            : " Generate an execution plan first, then come back to execute."}
        </p>
      </div>

      {canExecute && (
        <button
          onClick={onExecute}
          disabled={isExecuting}
          id="execute-task-empty-btn"
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all"
        >
          {isExecuting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Starting…</>
          ) : (
            <><Play className="w-4 h-4" /> Execute Task</>
          )}
        </button>
      )}
    </motion.div>
  );
}

// ─── Main Execution Content ───────────────────────────────────────────────────
function ExecutionContent() {
  const searchParams = useSearchParams();
  const taskId = searchParams?.get("taskId") || "";
  const router = useRouter();

  const { tasks, isLoading: tasksLoading } = useTasks(1, 50);
  const { plan } = usePlanner(taskId);
  const activeTask = tasks.find((t) => t.id === taskId);

  // Determine if we should poll (task is RUNNING)
  const isRunning = activeTask?.status === TaskStatus.RUNNING;
  const {
    data: execution,
    isLoading: execLoading,
    isError: execError,
    refetch,
  } = useExecution(taskId || undefined, isRunning);

  const { mutateAsync: executeTask, isPending: isExecuting } = useExecuteTask();

  // Screenshot modal state
  const [screenshotModal, setScreenshotModal] = useState<{ src: string; step: number } | null>(null);

  // Stop polling when execution reaches terminal state
  const terminalStatuses = ["COMPLETED", "FAILED", "CANCELLED"];
  const shouldStopPolling = execution && terminalStatuses.includes(execution.status);

  // Ref to track last toast to avoid duplicates
  const notifiedRef = useRef(false);

  useEffect(() => {
    if (!shouldStopPolling || notifiedRef.current) return;
    notifiedRef.current = true;
    if (execution?.status === "COMPLETED") {
      toast.success("Execution completed successfully!");
    } else if (execution?.status === "FAILED") {
      toast.error(`Execution failed: ${execution.error ?? "Unknown error"}`);
    }
  }, [shouldStopPolling, execution?.status, execution?.error]);

  // Derive step results from execution metadata
  const stepResults: BrowserStepResult[] = execution?.metadata?.step_results ?? [];

  // Cast and extract metadata variables for type safety
  const reasoning = execution?.metadata?.reasoning as string | undefined;
  const currentAction = execution?.metadata?.current_action as string | undefined;
  const currentUrl = execution?.metadata?.current_url as string | undefined;
  const confidence = execution?.metadata?.confidence as number | undefined;
  const retryCount = execution?.metadata?.retry_count as number | undefined;
  const memory = execution?.metadata?.memory as Record<string, any> | undefined;

  // Stats
  const totalSteps = stepResults.length;
  const successCount = stepResults.filter((s) => s.status === "SUCCESS").length;
  const failedCount = stepResults.filter((s) => s.status === "FAILED").length;
  const successRate = totalSteps > 0 ? Math.round((successCount / totalSteps) * 100) : 0;
  const totalDurationMs = stepResults.reduce((acc, s) => acc + (s.duration_ms ?? 0), 0);

  // Current running step index
  const runningStepIdx = stepResults.findIndex((s) => s.status === "RUNNING");
  const lastCompletedIdx = stepResults.reduce((last, s, i) =>
    s.status === "SUCCESS" || s.status === "COMPLETED" ? i : last, -1);

  const handleExecute = useCallback(async () => {
    if (!taskId) return;
    notifiedRef.current = false;
    try {
      toast.info("Dispatching browser agent...");
      await executeTask(taskId);
    } catch (err: any) {
      toast.error(err.message || "Failed to start execution");
    }
  }, [taskId, executeTask]);

  // ─── No Task Selected ─────────────────────────────────────────────────────
  if (!taskId) {
    const runableTasks = tasks.filter(
      (t) => t.status === TaskStatus.READY || t.status === TaskStatus.RUNNING || t.status === TaskStatus.COMPLETED
    );

    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-6 rounded-2xl border border-white/10"
        >
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            Execution Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor browser agents and inspect execution outcomes in real-time.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl border border-white/10 p-6 space-y-4"
        >
          <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
            Select a Task to Execute
          </span>

          {tasksLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass p-5 rounded-xl border border-white/5 animate-pulse h-24" />
              ))}
            </div>
          ) : runableTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <Monitor className="w-10 h-10 text-slate-600" />
              <div className="space-y-1">
                <p className="text-sm text-slate-400 font-semibold">No executable tasks</p>
                <p className="text-xs text-slate-600">
                  Generate an execution plan first, then return here to run it.
                </p>
              </div>
              <button
                onClick={() => router.push("/dashboard/planner")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600/10 border border-violet-500/20 text-violet-400 font-semibold text-xs hover:bg-violet-500/15 transition-colors"
              >
                Open Planner <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {runableTasks.map((t, i) => (
                <motion.div
                  key={t.id}
                  custom={i}
                  variants={stepVariants}
                  className="glass p-5 rounded-xl border border-white/5 hover:border-indigo-500/20 hover:bg-white/1 transition-all duration-200 flex flex-col justify-between gap-4 group"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors">
                        {t.title}
                      </h3>
                      <span className={`px-2 py-0.5 text-[9px] font-bold border rounded-full ${EXEC_STATUS_STYLES[t.status] ?? EXEC_STATUS_STYLES.CANCELLED}`}>
                        {t.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{t.goal}</p>
                  </div>
                  <button
                    id={`select-execution-${t.id}`}
                    onClick={() => router.push(`/dashboard/execution?taskId=${t.id}`)}
                    className="self-end flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 font-semibold text-xs hover:bg-indigo-500/15 transition-colors"
                  >
                    Open Monitor <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    );
  }

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (tasksLoading || execLoading) {
    return <ExecutionSkeleton />;
  }

  // ─── Task Not Found ────────────────────────────────────────────────────────
  if (!activeTask) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <AlertCircle className="w-12 h-12 text-rose-400" />
        <div className="text-center space-y-1">
          <h3 className="text-sm font-bold text-white">Task Not Found</h3>
          <p className="text-xs text-slate-400">This task may have been deleted.</p>
        </div>
        <button
          onClick={() => router.push("/dashboard/tasks")}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/8 text-white font-semibold text-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Tasks
        </button>
      </div>
    );
  }

  const canExecute = activeTask.status === TaskStatus.READY && !!plan;

  return (
    <div className="space-y-6">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-56 h-56 bg-radial-blue opacity-30 pointer-events-none -mr-12 -mt-12" />

        <div className="space-y-1">
          <button
            onClick={() => router.push("/dashboard/tasks")}
            className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-white transition-colors uppercase font-bold tracking-wider mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Tasks
          </button>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className={`w-5 h-5 text-indigo-400 ${isRunning ? "animate-pulse" : ""}`} />
            {activeTask.title}
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2.5 py-0.5 text-[9px] font-bold border rounded-full ${EXEC_STATUS_STYLES[activeTask.status] ?? "text-slate-400 bg-slate-500/10 border-slate-500/20"}`}>
              {activeTask.status}
            </span>
            {isRunning && (
              <span className="flex items-center gap-1.5 text-[10px] text-blue-400 font-semibold">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                Polling every 2s
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => { notifiedRef.current = false; refetch(); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 bg-white/3 hover:bg-white/6 text-slate-300 text-xs font-semibold transition-colors"
            title="Refresh execution data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>

          {canExecute && !execution && (
            <button
              id="execute-btn"
              onClick={handleExecute}
              disabled={isExecuting}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all"
            >
              {isExecuting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Dispatching…</>
              ) : (
                <><Play className="w-4 h-4" /> Execute Task</>
              )}
            </button>
          )}
        </div>
      </motion.div>

      {/* ─── No Execution Yet ─────────────────────────────────────────────── */}
      {!execution && !execError && (
        <EmptyExecution
          onExecute={handleExecute}
          isExecuting={isExecuting}
          canExecute={canExecute}
        />
      )}

      {/* ─── Error Fetching Execution (not 404) ───────────────────────────── */}
      {execError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass p-8 rounded-2xl border border-rose-500/20 bg-rose-500/3 flex flex-col items-center gap-4 text-center"
        >
          <XCircle className="w-10 h-10 text-rose-400" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">Failed to Load Execution Data</h3>
            <p className="text-xs text-slate-400">There was a problem retrieving the execution records.</p>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600/10 border border-rose-500/20 text-rose-400 text-xs font-semibold hover:bg-rose-500/15 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Retry
          </button>
        </motion.div>
      )}

      {/* ─── Execution Dashboard ──────────────────────────────────────────── */}
      {execution && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Overview Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<Activity className="w-5 h-5 text-blue-400" />}
              label="Status"
              value={execution.status}
              accent="blue"
            />
            <StatCard
              icon={<Timer className="w-5 h-5 text-violet-400" />}
              label="Duration"
              value={formatDurationFromDates(execution.started_at, execution.completed_at)}
              sub={execution.started_at ? new Date(execution.started_at).toLocaleTimeString() : undefined}
              accent="violet"
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
              label="Success Rate"
              value={totalSteps > 0 ? `${successRate}%` : "—"}
              sub={`${successCount}/${totalSteps} steps`}
              accent="emerald"
            />
            <StatCard
              icon={<Zap className="w-5 h-5 text-amber-400" />}
              label="Total Duration"
              value={totalDurationMs > 0 ? formatDuration(totalDurationMs) : "—"}
              sub={`${failedCount} failed step${failedCount !== 1 ? "s" : ""}`}
              accent={failedCount > 0 ? "rose" : "emerald"}
            />
          </div>

          {/* Execution Overview Card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass p-6 rounded-2xl border border-white/10 space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                Execution Overview
              </span>
              <span className={`px-2.5 py-0.5 text-[9px] font-bold border rounded-full ${EXEC_STATUS_STYLES[execution.status] ?? "text-slate-400 bg-slate-500/10 border-slate-500/20"}`}>
                {execution.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-0.5">
                <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Task</p>
                <p className="text-white font-semibold">{activeTask.title}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Started</p>
                <p className="text-slate-300 font-mono">{new Date(execution.started_at).toLocaleString()}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Completed</p>
                <p className="text-slate-300 font-mono">
                  {execution.completed_at ? new Date(execution.completed_at).toLocaleString() : "In progress…"}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            {totalSteps > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>Overall Progress</span>
                  <span className="font-mono">{successCount}/{totalSteps} steps completed</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${successRate}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}

            {/* Current Step Indicator */}
            {isRunning && runningStepIdx >= 0 && (
              <div className="flex items-center gap-2 p-3 rounded-lg border border-blue-500/20 bg-blue-500/5">
                <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />
                <span className="text-xs text-blue-300 font-semibold">
                  Running Step {stepResults[runningStepIdx]?.step_number} — {stepResults[runningStepIdx]?.action}
                </span>
              </div>
            )}

            {/* Error display */}
            {execution.error && (
              <div className="flex items-start gap-2 p-3 rounded-lg border border-rose-500/20 bg-rose-500/5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                <span className="text-xs text-rose-300 font-mono leading-relaxed">{execution.error}</span>
              </div>
            )}
          </motion.div>

          {/* Live Agent Reasoning Status */}
          {(reasoning || currentAction) && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="glass p-6 rounded-2xl border border-indigo-500/20 bg-indigo-950/5 space-y-4 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-radial-glow opacity-25 pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-extrabold text-indigo-400 tracking-wider flex items-center gap-1.5 animate-pulse">
                  <Activity className="w-3.5 h-3.5" />
                  Live Agent Reasoning Loop
                </span>
                {confidence !== undefined && (
                  <span className="text-[10px] font-semibold text-slate-400">
                    Confidence: <span className="text-emerald-400 font-mono">{(confidence * 100).toFixed(0)}%</span>
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {currentAction && (
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Current Action</span>
                    <div className="mt-1 flex items-center gap-2">
                      <code className="px-2.5 py-1 rounded bg-slate-900 border border-white/5 text-xs text-sky-400 font-mono font-bold">
                        {currentAction}
                      </code>
                      {currentUrl && (
                        <span className="text-[10px] text-slate-400 truncate max-w-sm flex items-center gap-1">
                          <Globe className="w-3 h-3 text-slate-500" />
                          {currentUrl}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {reasoning && (
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Agent Thinking</span>
                    <p className="mt-1 text-slate-200 text-xs leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-white/5 font-medium">
                      {reasoning}
                    </p>
                  </div>
                )}

                {retryCount !== undefined && retryCount > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
                    <RotateCcw className="w-3.5 h-3.5 animate-spin-slow" />
                    Recovery Retries: {retryCount}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Main Grid: Timeline + Screenshots */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* ─── Execution Timeline (left) ────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="lg:col-span-8 glass p-6 rounded-2xl border border-white/10"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                  Execution Timeline
                </span>
                <span className="text-[10px] font-mono text-slate-600">
                  {totalSteps} step{totalSteps !== 1 ? "s" : ""}
                </span>
              </div>

              {stepResults.length === 0 ? (
                // No step results yet (still running first step or no mock data)
                isRunning ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                    <span className="text-xs text-slate-500">Agent is executing — waiting for step results…</span>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500 text-xs">No step results recorded yet.</div>
                )
              ) : (
                <div className="relative border-l border-white/5 pl-6 ml-3 space-y-6">
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {stepResults.map((step, idx) => {
                      const styles = STEP_STATUS_STYLES[step.status] ?? STEP_STATUS_STYLES.PENDING;
                      return (
                        <motion.div key={idx} variants={stepVariants} className="relative group">
                          {/* Timeline dot */}
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: idx * 0.06 + 0.1, type: "spring", stiffness: 400, damping: 20 }}
                            className={`absolute -left-[35px] top-3 w-4 h-4 rounded-full border-2 border-slate-950 ${styles.dot} ${step.status === "RUNNING" ? "animate-pulse" : ""}`}
                          />

                          {/* Step Card */}
                          <div className={`p-4 rounded-xl border transition-all duration-200 hover:bg-white/1 ${styles.card}`}>
                            <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-[9px] font-bold text-slate-600 font-mono shrink-0">#{step.step_number}</span>
                                {getActionIcon(step.action)}
                                <span className="text-sm font-bold text-white truncate">{step.action}</span>
                                {step.target && (
                                  <code className="text-[10px] text-sky-300 font-mono truncate max-w-[200px]">{step.target}</code>
                                )}
                              </div>
                              <span className={`px-2.5 py-0.5 text-[9px] font-bold border rounded-full uppercase shrink-0 ${styles.badge}`}>
                                {step.status}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/5">
                              <div>
                                <p className="text-[9px] text-slate-600 uppercase font-bold tracking-wider mb-0.5">Duration</p>
                                <p className="text-[10px] text-slate-300 font-mono">{formatDuration(step.duration_ms)}</p>
                              </div>
                              <div>
                                <p className="text-[9px] text-slate-600 uppercase font-bold tracking-wider mb-0.5">Confidence</p>
                                <p className="text-[10px] text-slate-300 font-mono">{(step.confidence * 100).toFixed(0)}%</p>
                              </div>
                              <div>
                                <p className="text-[9px] text-slate-600 uppercase font-bold tracking-wider mb-0.5">Started</p>
                                <p className="text-[10px] text-slate-400 font-mono">
                                  {new Date(step.started_at).toLocaleTimeString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-[9px] text-slate-600 uppercase font-bold tracking-wider mb-0.5">URL</p>
                                <p className="text-[10px] text-slate-400 font-mono truncate">{step.url ?? "—"}</p>
                              </div>
                            </div>

                            {step.error && (
                              <div className="mt-2 flex items-start gap-1.5 p-2 rounded border border-rose-500/15 bg-rose-500/5">
                                <AlertCircle className="w-3 h-3 text-rose-400 shrink-0 mt-0.5" />
                                <span className="text-[10px] text-rose-300 font-mono leading-relaxed">{step.error}</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>

                  {/* Terminal Indicator */}
                  {!isRunning && execution.status !== "RUNNING" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="flex items-center gap-2 mt-4"
                    >
                      {execution.status === "COMPLETED" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400" />
                      )}
                      <span className={`text-xs font-semibold ${execution.status === "COMPLETED" ? "text-emerald-400" : "text-rose-400"}`}>
                        Execution {execution.status.toLowerCase()}
                      </span>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>

            {/* ─── Right Column: Screenshots + Meta ─────────────────────── */}
            <div className="lg:col-span-4 space-y-4">
              {/* Planner Strategy & Checkpoints */}
              {(plan?.strategy || plan?.checkpoints) && (
                <motion.div
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  className="glass p-5 rounded-2xl border border-white/10 space-y-4"
                >
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
                    <Zap className="w-3.5 h-3.5 text-violet-400" />
                    <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                      Execution Strategy
                    </span>
                  </div>

                  {plan.strategy && (
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Strategy</span>
                      <p className="text-xs text-slate-300 leading-relaxed font-medium">{plan.strategy}</p>
                    </div>
                  )}

                  {plan.checkpoints && plan.checkpoints.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Checkpoints</span>
                      <ul className="space-y-1.5 text-xs text-slate-400">
                        {plan.checkpoints.map((cp: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-3.5 h-3.5 rounded bg-violet-600/10 border border-violet-500/20 text-violet-400 font-mono text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="font-medium">{cp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {plan.success_criteria && (
                    <div className="space-y-1 pt-2 border-t border-white/5">
                      <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Success Criteria</span>
                      <p className="text-xs text-emerald-400 font-medium">{plan.success_criteria}</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Agent Memory Inspector */}
              {memory && (
                <motion.div
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.18 }}
                  className="glass p-5 rounded-2xl border border-white/10 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-sky-400" />
                      <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                        Agent Memory
                      </span>
                    </div>
                  </div>

                  <div className="text-xs space-y-2">
                    {/* Visited pages */}
                    {memory.visited_pages && (memory.visited_pages as string[]).length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Visited Pages</span>
                        <div className="max-h-20 overflow-y-auto space-y-1 pr-1 font-mono text-[10px] text-slate-400">
                          {(memory.visited_pages as string[]).map((url: string, i: number) => (
                            <div key={i} className="truncate hover:text-white transition-colors" title={url}>
                              {url}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Extracted information */}
                    {memory.extracted_data && Object.keys(memory.extracted_data as Record<string, unknown>).length > 0 && (
                      <div className="space-y-1 pt-2 border-t border-white/5">
                        <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Extracted Data</span>
                        <pre className="p-2 rounded bg-slate-950/60 border border-white/5 font-mono text-[10px] text-emerald-400 overflow-x-auto">
                          {JSON.stringify(memory.extracted_data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Screenshot Viewer */}
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="glass p-5 rounded-2xl border border-white/10 space-y-4"
              >
                <div className="flex items-center gap-2">
                  <Monitor className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                    Screenshots
                  </span>
                  <span className="ml-auto text-[10px] text-slate-600 font-mono">
                    {stepResults.filter((s) => s.screenshot_path).length} captured
                  </span>
                </div>

                {stepResults.filter((s) => s.screenshot_path).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2 text-center border border-dashed border-white/5 rounded-xl">
                    <Monitor className="w-8 h-8 text-slate-700" />
                    <p className="text-[10px] text-slate-600">
                      {isRunning ? "Screenshots will appear as steps complete" : "No screenshots captured"}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {stepResults
                      .filter((s) => s.screenshot_path)
                      .map((s) => (
                        <div key={s.step_number} className="space-y-1">
                          <StepThumbnail
                            step={s}
                            onClick={() => setScreenshotModal({ src: s.screenshot_path!, step: s.step_number })}
                          />
                          <p className="text-[9px] text-slate-600 text-center font-mono">Step {s.step_number}</p>
                        </div>
                      ))}
                  </div>
                )}
              </motion.div>

              {/* Execution Meta */}
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
                className="glass p-5 rounded-2xl border border-white/10 space-y-3"
              >
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Meta</span>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-400">Steps Succeeded</span>
                    <span className="text-emerald-400 font-semibold">{successCount}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-400">Steps Failed</span>
                    <span className={`font-semibold ${failedCount > 0 ? "text-rose-400" : "text-slate-400"}`}>{failedCount}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-400">Total Time</span>
                    <span className="text-white font-mono font-semibold">{formatDuration(totalDurationMs)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Execution ID</span>
                    <span className="text-slate-500 font-mono text-[9px] max-w-[100px] truncate">{execution.id}</span>
                  </div>
                </div>
              </motion.div>

              {/* Re-Execute Button (when completed or failed) */}
              {(execution.status === "COMPLETED" || execution.status === "FAILED") &&
                canExecute && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <button
                      onClick={handleExecute}
                      disabled={isExecuting}
                      id="re-execute-btn"
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-white/10 bg-white/3 hover:bg-indigo-500/10 hover:border-indigo-500/20 text-slate-300 hover:text-indigo-300 font-semibold text-xs transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Re-Execute
                    </button>
                  </motion.div>
                )}
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── Screenshot Modal ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {screenshotModal && (
          <ScreenshotModal
            src={screenshotModal.src}
            stepNumber={screenshotModal.step}
            onClose={() => setScreenshotModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ExecutionPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-[400px] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="text-xs text-slate-500">Loading execution dashboard…</span>
        </div>
      }
    >
      <ExecutionContent />
    </Suspense>
  );
}
