"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/auth";
import { useTasks } from "@/hooks/useTasks";
import { TaskStatus, TaskPriority } from "@/types/task";
import {
  Activity,
  Plus,
  CheckCircle2,
  PlayCircle,
  Clock,
  Heart,
  ExternalLink,
  Loader2,
  Trash2,
  Calendar,
  Send,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const { tasks, isLoading, createTask, deleteTask } = useTasks(1, 10);

  // Quick Create Form State
  const [quickTitle, setQuickTitle] = useState("");
  const [quickGoal, setQuickGoal] = useState("");
  const [isCreatingQuick, setIsCreatingQuick] = useState(false);
  const [errorQuick, setErrorQuick] = useState("");

  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorQuick("");
    if (!quickTitle || !quickGoal) {
      setErrorQuick("Please fill in title and goal.");
      return;
    }

    try {
      setIsCreatingQuick(true);
      await createTask({
        title: quickTitle,
        goal: quickGoal,
        priority: TaskPriority.MEDIUM,
      });
      setQuickTitle("");
      setQuickGoal("");
    } catch (err: any) {
      setErrorQuick(err.message || "Failed to create task");
    } finally {
      setIsCreatingQuick(false);
    }
  };

  // Stats derivation
  const completedCount = tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
  const runningCount = tasks.filter((t) => t.status === TaskStatus.RUNNING).length;
  const plannedCount = tasks.filter((t) => t.status === TaskStatus.READY).length;
  
  const failedCount = tasks.filter((t) => t.status === TaskStatus.FAILED).length;
  const healthPercent = tasks.length > 0 ? Math.round(((tasks.length - failedCount) / tasks.length) * 100) : 100;

  const recentTasks = tasks.slice(0, 5);

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
      case TaskStatus.RUNNING:
        return "bg-blue-500/10 border-blue-500/20 text-blue-400";
      case TaskStatus.READY:
        return "bg-violet-500/10 border-violet-500/20 text-violet-400";
      case TaskStatus.FAILED:
        return "bg-rose-500/10 border-rose-500/20 text-rose-400";
      default:
        return "bg-slate-500/10 border-slate-500/20 text-slate-400";
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.URGENT:
        return "text-red-400 bg-red-400/5 border-red-450/10";
      case TaskPriority.HIGH:
        return "text-amber-400 bg-amber-400/5 border-amber-450/10";
      default:
        return "text-slate-400 bg-slate-400/5 border-slate-450/10";
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Card & Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Welcome Card */}
        <div className="lg:col-span-4 glass p-6 rounded-2xl border border-white/10 relative overflow-hidden flex flex-col justify-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-radial-glow opacity-30 pointer-events-none -mr-16 -mt-16" />
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">
            Welcome back, <span className="text-gradient-purple">{user?.full_name || user?.username || "Operator"}</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            All systems are active. Deployed agent processes are monitoring web playbooks. Adjust goals or review execution timelines below.
          </p>
        </div>

        {/* Stat 1: Completed */}
        <div className="glass p-5 rounded-2xl border border-white/10 flex items-center justify-between group hover:border-violet-500/20 transition-all duration-300">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Tasks Completed
            </span>
            {isLoading ? (
              <div className="h-7 w-12 bg-white/5 rounded animate-pulse" />
            ) : (
              <h2 className="text-2xl font-black text-white">{completedCount}</h2>
            )}
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Stat 2: Running */}
        <div className="glass p-5 rounded-2xl border border-white/10 flex items-center justify-between group hover:border-violet-500/20 transition-all duration-300">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Active Executions
            </span>
            {isLoading ? (
              <div className="h-7 w-12 bg-white/5 rounded animate-pulse" />
            ) : (
              <h2 className="text-2xl font-black text-white">{runningCount}</h2>
            )}
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <PlayCircle className="w-5 h-5 animate-spin-slow" />
          </div>
        </div>

        {/* Stat 3: Planned */}
        <div className="glass p-5 rounded-2xl border border-white/10 flex items-center justify-between group hover:border-violet-500/20 transition-all duration-300">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Plans Generated
            </span>
            {isLoading ? (
              <div className="h-7 w-12 bg-white/5 rounded animate-pulse" />
            ) : (
              <h2 className="text-2xl font-black text-white">{plannedCount}</h2>
            )}
          </div>
          <div className="w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Stat 4: System Health */}
        <div className="glass p-5 rounded-2xl border border-white/10 flex items-center justify-between group hover:border-violet-500/20 transition-all duration-300">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              System Success Rate
            </span>
            {isLoading ? (
              <div className="h-7 w-12 bg-white/5 rounded animate-pulse" />
            ) : (
              <h2 className="text-2xl font-black text-white">{healthPercent}%</h2>
            )}
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
            <Heart className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Content Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Tasks */}
        <div className="lg:col-span-8 space-y-6">
          {/* Recent Tasks Card */}
          <div className="glass rounded-2xl border border-white/10 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 bg-slate-950/20 flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                Recent Task List
              </span>
              <Link
                href="/dashboard/tasks"
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1"
              >
                View All <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {/* List */}
            <div className="divide-y divide-white/5 bg-slate-950/10">
              {isLoading ? (
                // Skeletons
                Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="p-5 flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4.5 w-48 bg-white/5 rounded animate-pulse" />
                      <div className="h-3 w-72 bg-white/5 rounded animate-pulse" />
                    </div>
                    <div className="h-6 w-16 bg-white/5 rounded-full animate-pulse" />
                  </div>
                ))
              ) : recentTasks.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No tasks created yet. Use the quick task panel on the right.
                </div>
              ) : (
                recentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-5 flex items-center justify-between hover:bg-white/1 transition-all duration-200"
                  >
                    <div className="space-y-1.5 pr-4 flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/tasks?id=${task.id}`}
                          className="font-bold text-sm text-white hover:text-violet-400 transition-colors"
                        >
                          {task.title}
                        </Link>
                        <span className={`px-2 py-0.5 text-[9px] font-semibold border rounded-full ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1 leading-relaxed">
                        {task.goal}
                      </p>
                      <div className="flex items-center gap-4 text-[10px] text-slate-500 font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(task.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 text-[10px] font-semibold border rounded-full uppercase tracking-wider ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-1.5 rounded-lg border border-white/5 bg-white/3 hover:bg-rose-500/10 hover:border-rose-500/20 text-slate-450 hover:text-rose-400 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* System logs / Activity Card */}
          <div className="glass rounded-2xl border border-white/10 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 bg-slate-950/20 flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                Latest Activity
              </span>
              <span className="text-violet-400 flex items-center gap-1.5 text-[10px] uppercase font-bold">
                <Activity className="w-3.5 h-3.5 animate-pulse" /> Live Status
              </span>
            </div>
            <div className="p-5 font-mono text-xs text-slate-400 space-y-3 bg-slate-950/40">
              {isLoading ? (
                <div className="h-4 w-48 bg-white/5 rounded animate-pulse" />
              ) : tasks.length === 0 ? (
                <div className="flex items-start gap-2.5">
                  <span className="text-slate-600">[{new Date().toLocaleTimeString()}]</span>
                  <span className="text-slate-300">System initialized. No task activities recorded.</span>
                </div>
              ) : (
                tasks.slice(0, 4).map((task) => (
                  <div key={task.id} className="flex items-start gap-2.5">
                    <span className="text-slate-650 text-slate-600">
                      [{new Date(task.updated_at || task.created_at).toLocaleTimeString()}]
                    </span>
                    <span className="text-slate-300 truncate max-w-[85%]">
                      Task &ldquo;{task.title}&rdquo; state:{" "}
                      <span className="text-violet-405 text-violet-400 font-semibold">{task.status}</span>
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Quick Create & Status */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Create Task */}
          <div className="glass p-5 rounded-2xl border border-white/10 flex flex-col gap-4 relative overflow-hidden">
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              Quick Create Task
            </span>
            <form onSubmit={handleQuickCreate} className="space-y-4">
              {errorQuick && (
                <div className="p-2.5 rounded border border-red-500/20 bg-red-500/5 text-[10px] text-red-400">
                  {errorQuick}
                </div>
              )}

              <div className="space-y-1">
                <input
                  type="text"
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  placeholder="Task Title (e.g. Scrape Jobs)"
                  className="w-full px-3 py-2 rounded-lg border border-white/5 bg-slate-950/40 text-xs placeholder-slate-600 focus:outline-none focus:border-violet-500/50"
                  required
                />
              </div>

              <div className="space-y-1">
                <textarea
                  value={quickGoal}
                  onChange={(e) => setQuickGoal(e.target.value)}
                  placeholder="Describe goal details..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-white/5 bg-slate-950/40 text-xs placeholder-slate-600 focus:outline-none focus:border-violet-500/50 resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isCreatingQuick}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-xs shadow transition-all disabled:opacity-50"
              >
                {isCreatingQuick ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" /> Deploy Agent Task
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Planner & Execution Quick Card */}
          <div className="glass p-5 rounded-2xl border border-white/10 flex flex-col gap-3 relative overflow-hidden">
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              System Agent Operations
            </span>
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-450">Decomposition Engine</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Active
                </span>
              </div>
              <hr className="border-white/5" />
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-450">Browser Executor Node</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Idle
                </span>
              </div>
              <hr className="border-white/5" />
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-455">Vault VaultFS Layer</span>
                <span className="text-violet-400 font-semibold flex items-center gap-1">
                  Secure (AES)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
