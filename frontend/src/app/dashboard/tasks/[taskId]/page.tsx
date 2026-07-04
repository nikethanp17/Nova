"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { TASK_STATUS_COLORS, TASK_PRIORITY_COLORS, TASK_STATUS_ICONS } from "@/lib/designTokens";
import { motion } from "framer-motion";
import { useTask } from "@/hooks/useTask";
import { usePlanner } from "@/hooks/usePlanner";
import { TaskStatus } from "@/types/task";
import { PlanStatus } from "@/types/planner";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  GitBranch,
  Play,
  Calendar,
  Tag,
  Target,
  FileText,
  AlertCircle,
  Database,
  Cpu,
  CheckSquare,
  ChevronRight,
} from "lucide-react";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const STATUS_COLORS = TASK_STATUS_COLORS;
const PRIORITY_COLORS = TASK_PRIORITY_COLORS;
const STATUS_ICON = TASK_STATUS_ICONS;

// ─── Info Row ─────────────────────────────────────────────────────────────────
function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
      <div className="w-7 h-7 rounded-lg bg-white/3 border border-white/5 flex items-center justify-center shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-0.5">{label}</p>
        <div className="text-xs text-slate-200 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
function DetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="glass p-6 rounded-2xl border border-white/10">
        <div className="h-4 w-24 bg-white/5 rounded mb-4" />
        <div className="h-7 w-64 bg-white/5 rounded mb-2" />
        <div className="h-4 w-48 bg-white/5 rounded" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass p-6 rounded-2xl border border-white/10 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3 py-3 border-b border-white/5">
              <div className="w-7 h-7 bg-white/5 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-20 bg-white/5 rounded" />
                <div className="h-3.5 w-40 bg-white/5 rounded" />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="glass p-5 rounded-2xl border border-white/10 h-32" />
          <div className="glass p-5 rounded-2xl border border-white/10 h-32" />
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function TaskDetailPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = use(params);
  const router = useRouter();
  const { task, isLoading, isError } = useTask(taskId);
  const { plan, isLoading: planLoading } = usePlanner(taskId);

  if (isLoading) return <DetailSkeleton />;

  if (isError || !task) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-rose-400" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-sm font-bold text-white">Task Not Found</h3>
          <p className="text-xs text-slate-400">This task may have been deleted or doesn&apos;t exist.</p>
        </div>
        <button
          onClick={() => router.push("/dashboard/tasks")}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/8 text-white font-semibold text-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Tasks
        </button>
      </div>
    );
  }

  const hasPlan = !!plan;
  const planReady = hasPlan && plan.status === PlanStatus.READY;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass p-6 rounded-2xl border border-white/10 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-radial-glow opacity-20 pointer-events-none -mr-16 -mt-16" />

        <button
          onClick={() => router.push("/dashboard/tasks")}
          className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-white transition-colors uppercase font-bold tracking-wider mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Tasks
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-extrabold text-white">{task.title}</h1>
              <span className={`px-3 py-1 text-[10px] font-bold border rounded-full uppercase tracking-wider flex items-center gap-1.5 ${STATUS_COLORS[task.status]}`}>
                {STATUS_ICON[task.status]}
                {task.status}
              </span>
              <span className={`px-2.5 py-0.5 text-[9px] font-bold border rounded-full ${PRIORITY_COLORS[task.priority]}`}>
                {task.priority}
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">{task.goal}</p>
          </div>

          {/* CTA buttons based on status */}
          <div className="flex gap-2 shrink-0">
            {task.status === TaskStatus.PENDING && (
              <button
                onClick={() => router.push(`/dashboard/planner?taskId=${task.id}`)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-violet-500/20 transition-all"
              >
                <GitBranch className="w-3.5 h-3.5" /> Generate Plan
              </button>
            )}
            {task.status === TaskStatus.READY && (
              <button
                onClick={() => router.push(`/dashboard/execution?taskId=${task.id}`)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-xs shadow-md transition-all"
              >
                <Play className="w-3.5 h-3.5" /> Execute Plan
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Task Details */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="lg:col-span-2 glass p-6 rounded-2xl border border-white/10 space-y-1"
        >
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-3">
            Task Information
          </p>

          <InfoRow icon={<Target className="w-3.5 h-3.5 text-violet-400" />} label="Goal">
            {task.goal}
          </InfoRow>

          {task.description && (
            <InfoRow icon={<FileText className="w-3.5 h-3.5 text-sky-400" />} label="Description">
              {task.description}
            </InfoRow>
          )}

          <InfoRow icon={<Tag className="w-3.5 h-3.5 text-amber-400" />} label="Priority">
            <span className={`inline-flex px-2.5 py-0.5 text-[9px] font-bold border rounded-full ${PRIORITY_COLORS[task.priority]}`}>
              {task.priority}
            </span>
          </InfoRow>

          <InfoRow icon={<CheckSquare className="w-3.5 h-3.5 text-emerald-400" />} label="Status">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[9px] font-bold border rounded-full ${STATUS_COLORS[task.status]}`}>
              {STATUS_ICON[task.status]}
              {task.status}
            </span>
          </InfoRow>

          <InfoRow icon={<Calendar className="w-3.5 h-3.5 text-slate-400" />} label="Created At">
            <span className="font-mono">{new Date(task.created_at).toLocaleString()}</span>
          </InfoRow>

          <InfoRow icon={<Calendar className="w-3.5 h-3.5 text-slate-400" />} label="Updated At">
            <span className="font-mono">{new Date(task.updated_at).toLocaleString()}</span>
          </InfoRow>

          {task.started_at && (
            <InfoRow icon={<Play className="w-3.5 h-3.5 text-blue-400" />} label="Started At">
              <span className="font-mono">{new Date(task.started_at).toLocaleString()}</span>
            </InfoRow>
          )}

          {task.completed_at && (
            <InfoRow icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />} label="Completed At">
              <span className="font-mono">{new Date(task.completed_at).toLocaleString()}</span>
            </InfoRow>
          )}

          {/* Metadata Section */}
          {task.metadata && Object.keys(task.metadata).length > 0 && (
            <div className="pt-4 mt-4 border-t border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-3.5 h-3.5 text-slate-500" />
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Metadata</p>
              </div>
              <div className="bg-slate-950/40 border border-white/5 rounded-xl p-4 font-mono text-[11px] text-slate-400 overflow-auto max-h-48">
                <pre>{JSON.stringify(task.metadata, null, 2)}</pre>
              </div>
            </div>
          )}
        </motion.div>

        {/* Right Column: Planner & Execution Status */}
        <div className="space-y-4">
          {/* Planner Status Card */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="glass p-5 rounded-2xl border border-white/10 space-y-4"
          >
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-violet-400" />
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Planner</span>
            </div>

            {planLoading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-3 w-full bg-white/5 rounded" />
                <div className="h-3 w-2/3 bg-white/5 rounded" />
              </div>
            ) : hasPlan ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Status</span>
                  <span className={`px-2.5 py-0.5 text-[9px] font-bold border rounded-full ${
                    plan.status === PlanStatus.READY
                      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                      : plan.status === PlanStatus.FAILED
                      ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
                      : "text-sky-400 bg-sky-500/10 border-sky-500/20"
                  }`}>
                    {plan.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs border-t border-white/5 pt-2">
                  <span className="text-slate-400">Steps</span>
                  <span className="text-white font-semibold">{plan.estimated_steps}</span>
                </div>
                <div className="flex items-center justify-between text-xs border-t border-white/5 pt-2">
                  <span className="text-slate-400">Duration</span>
                  <span className="text-white font-semibold">{plan.estimated_duration}</span>
                </div>
                <button
                  onClick={() => router.push(`/dashboard/planner?taskId=${task.id}`)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-violet-600/10 border border-violet-500/20 text-violet-400 font-semibold text-xs hover:bg-violet-500/15 transition-colors"
                >
                  View Plan <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : task.status === TaskStatus.PENDING ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 leading-relaxed">
                  No execution plan generated yet.
                </p>
                <button
                  onClick={() => router.push(`/dashboard/planner?taskId=${task.id}`)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all"
                >
                  <Cpu className="w-3.5 h-3.5" /> Generate with AI
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No plan associated.</p>
            )}
          </motion.div>

          {/* Execution Status Card */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="glass p-5 rounded-2xl border border-white/10 space-y-4"
          >
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-indigo-400" />
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Execution</span>
            </div>

            {task.status === TaskStatus.RUNNING ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                  <span className="text-xs text-blue-400 font-semibold">Agent Running</span>
                </div>
                <p className="text-xs text-slate-500">Browser agent is executing steps...</p>
              </div>
            ) : task.status === TaskStatus.COMPLETED ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-emerald-400 font-semibold">Completed</span>
                </div>
                {task.completed_at && (
                  <p className="text-[10px] text-slate-500 font-mono">
                    {new Date(task.completed_at).toLocaleString()}
                  </p>
                )}
              </div>
            ) : task.status === TaskStatus.FAILED ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <span className="text-xs text-rose-400 font-semibold">Failed</span>
                </div>
                <p className="text-xs text-slate-500">Execution encountered an error.</p>
              </div>
            ) : planReady ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Plan is ready. Launch the browser agent to execute.
                </p>
                <button
                  onClick={() => router.push(`/dashboard/execution?taskId=${task.id}`)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-xs transition-all"
                >
                  <Play className="w-3.5 h-3.5" /> Launch Agent
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Generate a plan first before executing.
              </p>
            )}
          </motion.div>

          {/* Task ID Card */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            className="glass p-4 rounded-2xl border border-white/5"
          >
            <p className="text-[9px] uppercase font-bold text-slate-600 tracking-wider mb-1.5">Task ID</p>
            <p className="text-[10px] font-mono text-slate-500 break-all">{task.id}</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
