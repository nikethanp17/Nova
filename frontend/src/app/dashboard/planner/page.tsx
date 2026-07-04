"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useTasks } from "@/hooks/useTasks";
import { usePlanner } from "@/hooks/usePlanner";
import { TaskStatus } from "@/types/task";
import { PlanStatus, StepStatus } from "@/types/planner";
import { motion, AnimatePresence } from "framer-motion";
import { getActionIcon } from "@/lib/designTokens";
import {
  GitBranch,
  Calendar,
  ChevronRight,
  Loader2,
  Play,
  ArrowLeft,
  CheckCircle,
  HelpCircle,
  Cpu,
  RotateCcw,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { useState, Suspense } from "react";
import { toast } from "sonner";

import type { Variants } from "framer-motion";

// ─── Animation Variants ───────────────────────────────────────────────────────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, delay: i * 0.065, ease: "easeOut" as const },
  }),
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const stepVariants: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.28, ease: "easeOut" as const } },
};



const STEP_STATUS_STYLES: Record<StepStatus, string> = {
  [StepStatus.COMPLETED]: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
  [StepStatus.RUNNING]:   "text-blue-400 border-blue-500/20 bg-blue-500/10",
  [StepStatus.FAILED]:    "text-rose-400 border-rose-500/20 bg-rose-500/10",
  [StepStatus.PENDING]:   "text-slate-400 border-white/5 bg-white/3",
};

const PLAN_STATUS_STYLES: Record<PlanStatus, string> = {
  [PlanStatus.READY]:    "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  [PlanStatus.PLANNING]: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  [PlanStatus.FAILED]:   "text-rose-400 bg-rose-500/10 border-rose-500/20",
};

// ─── Planner Content ─────────────────────────────────────────────────────────
function PlannerContent() {
  const searchParams = useSearchParams();
  const taskId = searchParams?.get("taskId") || "";
  const router = useRouter();

  const { tasks, isLoading: tasksLoading } = useTasks(1, 50);
  const { plan, generatePlan, isGenerating, isLoading: planLoading } = usePlanner(taskId);

  const activeTask = tasks.find((t) => t.id === taskId);
  const [regenConfirm, setRegenConfirm] = useState(false);

  const handleGenerate = async () => {
    if (!taskId) return;
    try {
      toast.info("Triggering AI Planner Agent...");
      await generatePlan(taskId);
      toast.success("Execution plan generated successfully!");
      setRegenConfirm(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate plan");
    }
  };

  // ─── No Task Selected ────────────────────────────────────────────────────
  if (!taskId) {
    const pendableTasks = tasks.filter(
      (t) => t.status === TaskStatus.PENDING || t.status === TaskStatus.READY
    );

    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-6 rounded-2xl border border-white/10"
        >
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-violet-400" />
            Plan Decomposition Engine
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Select a task playbook to generate or review its browser sequence.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl border border-white/10 p-6 space-y-4"
        >
          <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
            Available Playbooks
          </span>

          {tasksLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass p-5 rounded-xl border border-white/5 animate-pulse space-y-3">
                  <div className="h-4 w-40 bg-white/5 rounded" />
                  <div className="h-3 w-56 bg-white/5 rounded" />
                  <div className="h-8 w-24 bg-white/5 rounded-lg self-end" />
                </div>
              ))}
            </div>
          ) : pendableTasks.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No plannable tasks available. Create a pending task first.
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {pendableTasks.map((t, i) => (
                <motion.div
                  key={t.id}
                  custom={i}
                  variants={fadeUp}
                  className="glass p-5 rounded-xl border border-white/5 hover:border-violet-500/20 hover:bg-white/1 transition-all duration-200 flex flex-col justify-between gap-4 group"
                >
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-sm text-white group-hover:text-violet-300 transition-colors">
                      {t.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{t.goal}</p>
                  </div>
                  <button
                    onClick={() => router.push(`/dashboard/planner?taskId=${t.id}`)}
                    className="self-end flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-600/10 border border-violet-500/20 text-violet-400 font-semibold text-xs hover:bg-violet-500/15 transition-colors"
                  >
                    Select Task <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    );
  }

  // ─── Loading ─────────────────────────────────────────────────────────────
  if (tasksLoading || planLoading) {
    return (
      <div className="w-full min-h-[400px] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        <span className="text-xs text-slate-500">Loading plan data...</span>
      </div>
    );
  }

  // ─── Task Not Found ───────────────────────────────────────────────────────
  if (!activeTask) {
    return (
      <div className="space-y-6">
        <div className="glass p-8 rounded-2xl border border-white/10 text-center flex flex-col items-center gap-4 max-w-md mx-auto mt-12">
          <HelpCircle className="w-12 h-12 text-slate-500" />
          <h3 className="text-white font-bold text-base">Playbook Not Found</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            The task reference you requested could not be resolved or was deleted.
          </p>
          <button
            onClick={() => router.push("/dashboard/planner")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/8 text-white font-semibold text-xs"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  // ─── Main Plan View ───────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6 rounded-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-radial-glow opacity-20 pointer-events-none -mr-8 -mt-8" />
        <div className="space-y-1">
          <button
            onClick={() => router.push("/dashboard/planner")}
            className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-white transition-colors uppercase font-bold tracking-wider mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Planner list
          </button>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-violet-400" />
            {activeTask.title}
          </h1>
          <p className="text-xs text-slate-400">
            Goal: <span className="text-slate-200">{activeTask.goal}</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Generate button — shown when no plan or task is PENDING */}
          {!plan && activeTask.status === TaskStatus.PENDING && (
            <motion.button
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleGenerate}
              disabled={isGenerating}
              id="generate-plan-btn"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-violet-500/20 disabled:opacity-50 transition-all"
            >
              {isGenerating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Formulating Steps...</>
              ) : (
                <><Cpu className="w-4 h-4" /> Decompose with AI Agent</>
              )}
            </motion.button>
          )}

          {/* Re-generate button — when plan already exists and task is PENDING */}
          {plan && activeTask.status === TaskStatus.PENDING && !regenConfirm && (
            <motion.button
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setRegenConfirm(true)}
              id="regenerate-plan-btn"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-white/10 bg-white/3 hover:bg-white/6 text-slate-300 font-semibold text-xs transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Regenerate Plan
            </motion.button>
          )}

          {/* Confirmation for regeneration */}
          <AnimatePresence>
            {regenConfirm && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-500/20 bg-amber-500/5"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs text-amber-300 font-semibold">Regenerate?</span>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="px-2.5 py-1 rounded bg-amber-600/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : "Yes"}
                </button>
                <button
                  onClick={() => setRegenConfirm(false)}
                  className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-slate-400 text-[10px] font-bold hover:bg-white/8 transition-colors"
                >
                  Cancel
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Execute button — when plan is READY */}
          {plan && plan.status === PlanStatus.READY && (
            <motion.button
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => router.push(`/dashboard/execution?taskId=${activeTask.id}`)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-xs shadow-md transition-all"
            >
              <Play className="w-4 h-4" /> Launch Browser Agent
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* AI Generating Skeleton */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="glass p-6 rounded-2xl border border-violet-500/20 bg-violet-500/3 space-y-6"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-violet-400 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="h-3.5 w-32 bg-white/5 rounded animate-pulse" />
                <div className="h-3 w-48 bg-white/5 rounded animate-pulse" />
              </div>
            </div>
            <hr className="border-white/5" />
            <div className="space-y-5">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="flex gap-4 items-start">
                  <div className="w-7 h-7 rounded-full bg-white/5 animate-pulse shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-1/3 bg-white/5 rounded animate-pulse" />
                    <div className="h-3 w-2/3 bg-white/5 rounded animate-pulse" />
                    <div className="h-3 w-1/2 bg-white/5 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Plan Display */}
      <AnimatePresence>
        {plan && !isGenerating && (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Metadata Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-4 space-y-4"
            >
              {/* Plan Stats Card */}
              <div className="glass p-5 rounded-2xl border border-white/10 space-y-4">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Plan Overview</span>

                {/* Status badge */}
                <div className="flex items-center justify-between text-xs border-b border-white/5 pb-3">
                  <span className="text-slate-400">Status</span>
                  <span className={`px-2.5 py-0.5 text-[9px] font-bold border rounded-full ${PLAN_STATUS_STYLES[plan.status]}`}>
                    {plan.status}
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-400">Estimated Steps</span>
                    <span className="text-white font-semibold">{plan.estimated_steps} steps</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-400">Estimated Duration</span>
                    <span className="text-white font-semibold">{plan.estimated_duration}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-400">Prompt Version</span>
                    <span className="text-violet-400 font-mono">{plan.prompt_version}</span>
                  </div>
                  {plan.metadata?.model && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Model</span>
                      <span className="text-slate-300 font-mono text-[10px]">{plan.metadata.model}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Created At */}
              <div className="glass p-4 rounded-2xl border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Generated</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">{new Date(plan.created_at).toLocaleString()}</span>
              </div>

              {/* Planner Strategy & Success Criteria */}
              {(plan.strategy || plan.checkpoints) && (
                <div className="glass p-5 rounded-2xl border border-white/10 space-y-4 text-left">
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
                </div>
              )}

              {/* Step Legend */}
              <div className="glass p-4 rounded-2xl border border-white/5 space-y-2">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Step Status</span>
                {Object.entries(STEP_STATUS_STYLES).map(([status, cls]) => (
                  <div key={status} className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-[8px] font-bold border rounded-full ${cls}`}>{status}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Step Timeline */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="lg:col-span-8 glass p-6 rounded-2xl border border-white/10"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                  Execution Timeline
                </span>
                <span className="text-[10px] text-slate-600 font-mono">
                  {plan.steps.length} step{plan.steps.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="relative border-l border-white/5 pl-6 ml-3 space-y-8">
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {plan.steps.map((step, idx) => (
                    <motion.div
                      key={idx}
                      variants={stepVariants}
                      className="relative group"
                    >
                      {/* Step dot */}
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: idx * 0.07 + 0.2, type: "spring", stiffness: 400, damping: 20 }}
                        className="absolute -left-[35px] top-0.5 w-7 h-7 rounded-full bg-slate-950 border border-white/10 flex items-center justify-center font-bold text-[10px] text-slate-400 group-hover:border-violet-500/40 group-hover:text-violet-400 transition-colors"
                      >
                        {step.step_number}
                      </motion.span>

                      {/* Step Card */}
                      <div className="glass p-4 rounded-xl border border-white/5 group-hover:border-white/10 hover:bg-white/1 transition-all duration-200 space-y-3">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                            {getActionIcon(step.action)}
                            {step.title}
                          </h4>
                          <span className={`px-2.5 py-0.5 text-[9px] font-bold border rounded-full uppercase ${STEP_STATUS_STYLES[step.status]}`}>
                            {step.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed">{step.description}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-white/5">
                          <div>
                            <span className="text-[9px] text-slate-600 uppercase font-bold tracking-wider block mb-0.5">
                              Action
                            </span>
                            <code className="text-[10px] text-violet-300 font-mono">{step.action}</code>
                          </div>

                          {step.target && (
                            <div>
                              <span className="text-[9px] text-slate-600 uppercase font-bold tracking-wider block mb-0.5">
                                Target
                              </span>
                              <code className="text-[10px] text-sky-300 font-mono break-all">{step.target}</code>
                            </div>
                          )}

                          {step.input !== null && step.input !== undefined && (
                            <div>
                              <span className="text-[9px] text-slate-600 uppercase font-bold tracking-wider block mb-0.5">
                                Input
                              </span>
                              <code className="text-[10px] text-emerald-300 font-mono">
                                {typeof step.input === "string" ? step.input : JSON.stringify(step.input)}
                              </code>
                            </div>
                          )}

                          <div>
                            <span className="text-[9px] text-slate-600 uppercase font-bold tracking-wider block mb-0.5">
                              Expected Result
                            </span>
                            <span className="text-[10px] text-slate-400 leading-relaxed">{step.expected_result}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              {/* Plan Completed Indicator */}
              {plan.status === PlanStatus.READY && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: plan.steps.length * 0.07 + 0.3 }}
                  className="flex items-center gap-2 mt-8 ml-3 pl-6 border-l border-white/5"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-emerald-400 font-semibold">Plan ready for execution</span>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty: No plan and not generating */}
      <AnimatePresence>
        {!plan && !isGenerating && activeTask.status !== TaskStatus.PENDING && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass p-8 rounded-2xl border border-white/10 text-center flex flex-col items-center gap-4"
          >
            <GitBranch className="w-12 h-12 text-slate-600" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-300">No Plan Available</h3>
              <p className="text-xs text-slate-500">
                This task cannot be planned in its current status (<span className="font-mono">{activeTask.status}</span>).
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PlannerPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-[400px] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          <span className="text-xs text-slate-500">Loading planner...</span>
        </div>
      }
    >
      <PlannerContent />
    </Suspense>
  );
}
