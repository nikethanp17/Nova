"use client";

import { useState, useEffect } from "react";
import { useTasks } from "@/hooks/useTasks";
import { Task, TaskStatus, TaskPriority, TaskUpdate } from "@/types/task";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  CheckSquare,
  Calendar,
  Loader2,
  Plus,
  Trash2,
  Play,
  Activity,
  AlertTriangle,
  X,
  Search,
  Filter,
  Pencil,
  ChevronRight,
  AlertCircle,
  ClipboardList,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TASK_STATUS_COLORS, TASK_PRIORITY_COLORS } from "@/lib/designTokens";

// ─── Animation Variants ───────────────────────────────────────────────────────
const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.055 },
  },
};

const rowVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" as const } },
  exit: { opacity: 0, x: -16, transition: { duration: 0.2 } },
};

const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.22, ease: "easeOut" as const } },
  exit: { opacity: 0, scale: 0.96, y: 8, transition: { duration: 0.16 } },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const STATUS_COLORS = TASK_STATUS_COLORS;
const PRIORITY_COLORS = TASK_PRIORITY_COLORS;

function SkeletonRow() {
  return (
    <div className="p-5 flex items-center justify-between animate-pulse">
      <div className="space-y-2 flex-1">
        <div className="flex items-center gap-2">
          <div className="h-4 w-40 bg-white/5 rounded" />
          <div className="h-4 w-12 bg-white/5 rounded-full" />
        </div>
        <div className="h-3 w-64 bg-white/5 rounded" />
        <div className="h-3 w-32 bg-white/5 rounded" />
      </div>
      <div className="flex items-center gap-3">
        <div className="h-6 w-20 bg-white/5 rounded-full" />
        <div className="h-7 w-7 bg-white/5 rounded-lg" />
        <div className="h-7 w-7 bg-white/5 rounded-lg" />
      </div>
    </div>
  );
}

// ─── Create Modal ─────────────────────────────────────────────────────────────
function CreateTaskModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (t: { title: string; goal: string; description?: string | null; priority: TaskPriority }) => Promise<unknown>;
}) {
  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!title.trim() || !goal.trim()) {
      setErrorMsg("Title and Goal are required.");
      return;
    }
    try {
      setIsSubmitting(true);
      await onCreate({ title, goal, description: description || null, priority });
      toast.success("Task playbook created.");
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create task");
      toast.error(err.message || "Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true">
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="w-full max-w-lg glass rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
      >
        <div className="px-6 py-4 border-b border-white/5 bg-slate-950/40 flex items-center justify-between">
          <span className="text-sm font-bold text-white uppercase tracking-wider">
            Create New Task Playbook
          </span>
          <button onClick={onClose} aria-label="Close dialog" className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-start gap-2 p-2.5 rounded border border-red-500/20 bg-red-500/5 text-xs text-red-400"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1">
            <label htmlFor="create-task-title" className="text-xs font-semibold text-slate-300">Task Title</label>
            <input
              id="create-task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Apply for Front-end Engineer Job"
              className="w-full px-3 py-2 rounded-lg border border-white/5 bg-slate-950/40 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="create-task-goal" className="text-xs font-semibold text-slate-300">Decomposition Goal</label>
            <textarea
              id="create-task-goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Describe exactly what needs to be achieved in detail..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-white/5 bg-slate-950/40 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50 resize-none transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="create-task-description" className="text-xs font-semibold text-slate-300">Description (optional)</label>
            <input
              id="create-task-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contextual details for optimization"
              className="w-full px-3 py-2 rounded-lg border border-white/5 bg-slate-950/40 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="create-task-priority" className="text-xs font-semibold text-slate-300">Operational Priority</label>
            <select
              id="create-task-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full px-3 py-2 rounded-lg border border-white/5 bg-slate-950 text-xs text-slate-300 focus:outline-none focus:border-violet-500/50"
            >
              {Object.values(TaskPriority).map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-white/5 bg-white/3 hover:bg-white/6 text-slate-300 hover:text-white text-xs transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-violet-500/20 transition-all disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Deploy Playbook"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditTaskModal({
  task,
  onClose,
  onSave,
}: {
  task: Task;
  onClose: () => void;
  onSave: (args: { taskId: string; updates: TaskUpdate }) => Promise<unknown>;
}) {
  const [title, setTitle] = useState(task.title);
  const [goal, setGoal] = useState(task.goal);
  const [description, setDescription] = useState(task.description || "");
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!title.trim() || !goal.trim()) {
      setErrorMsg("Title and Goal are required.");
      return;
    }
    try {
      setIsSubmitting(true);
      await onSave({ taskId: task.id, updates: {
        title,
        goal,
        description: description || null,
        priority,
      } });
      toast.success("Task updated.");
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update task");
      toast.error(err.message || "Failed to update task");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true">
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="w-full max-w-lg glass rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
      >
        <div className="px-6 py-4 border-b border-white/5 bg-slate-950/40 flex items-center justify-between">
          <span className="text-sm font-bold text-white uppercase tracking-wider">Edit Task</span>
          <button onClick={onClose} aria-label="Close dialog" className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-start gap-2 p-2.5 rounded border border-red-500/20 bg-red-500/5 text-xs text-red-400"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1">
            <label htmlFor="edit-task-title" className="text-xs font-semibold text-slate-300">Task Title</label>
            <input
              id="edit-task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-white/5 bg-slate-950/40 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-task-goal" className="text-xs font-semibold text-slate-300">Decomposition Goal</label>
            <textarea
              id="edit-task-goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-white/5 bg-slate-950/40 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50 resize-none transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-task-description" className="text-xs font-semibold text-slate-300">Description (optional)</label>
            <input
              id="edit-task-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-white/5 bg-slate-950/40 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-task-priority" className="text-xs font-semibold text-slate-300">Priority</label>
            <select
              id="edit-task-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full px-3 py-2 rounded-lg border border-white/5 bg-slate-950 text-xs text-slate-300 focus:outline-none focus:border-violet-500/50"
            >
              {Object.values(TaskPriority).map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-white/5 bg-white/3 hover:bg-white/6 text-slate-300 hover:text-white text-xs transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-violet-500/20 transition-all disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Changes"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Delete Confirmation Dialog ───────────────────────────────────────────────
function DeleteConfirmDialog({
  task,
  onClose,
  onConfirm,
}: {
  task: Task;
  onClose: () => void;
  onConfirm: () => Promise<unknown>;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      await onConfirm();
      toast.success("Task soft-deleted.");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete task");
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true">
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="w-full max-w-md glass rounded-2xl border border-white/10 shadow-2xl p-6 space-y-5"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-rose-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">Soft Delete Task</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              This will mark <span className="text-white font-semibold">{task.title}</span> as deleted.
              The task will no longer appear in your list.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-white/5 bg-white/3 hover:bg-white/6 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-semibold text-xs shadow-md shadow-rose-500/20 transition-all disabled:opacity-50"
          >
            {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (
              <><Trash2 className="w-3.5 h-3.5" /> Delete</>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TasksPage() {
  const { tasks, isLoading, createTask, updateTask, deleteTask } = useTasks(1, 50);
  const router = useRouter();

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteTask_target, setDeleteTaskTarget] = useState<Task | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "ALL">("ALL");

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.goal.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 relative">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass p-6 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-violet-400" />
            Task Management
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure, deploy, and inspect task execution scripts.
          </p>
        </div>
        <button
          id="create-task-btn"
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-violet-500/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Create Task Playbook
        </button>
      </motion.div>

      {/* Search & Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.08 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            id="task-search-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks by title or goal..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-white/5 bg-slate-950/40 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors"
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

        {/* Status Filter */}
        <div className="relative flex items-center gap-2">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          <select
            id="task-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TaskStatus | "ALL")}
            className="pl-9 pr-3 py-2.5 rounded-xl border border-white/5 bg-slate-950/40 text-xs text-slate-300 focus:outline-none focus:border-violet-500/50 min-w-[140px]"
          >
            <option value="ALL">All Statuses</option>
            {Object.values(TaskStatus).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Task List Container */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.12 }}
        className="glass rounded-2xl border border-white/10 overflow-hidden"
      >
        {isLoading ? (
          <div className="divide-y divide-white/5">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : filteredTasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 gap-4 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/3 border border-white/5 flex items-center justify-center">
              <ClipboardList className="w-8 h-8 text-slate-600" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-400">
                {search || statusFilter !== "ALL" ? "No tasks match your filters" : "No task playbooks found"}
              </p>
              <p className="text-xs text-slate-600">
                {search || statusFilter !== "ALL"
                  ? "Try adjusting your search or filter."
                  : "Click the button above to define a new task."}
              </p>
            </div>
            {!search && statusFilter === "ALL" && (
              <button
                onClick={() => setCreateOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600/10 border border-violet-500/20 text-violet-400 font-semibold text-xs hover:bg-violet-500/15 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Create First Task
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            className="divide-y divide-white/5"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence mode="popLayout">
              {filteredTasks.map((task) => (
                <motion.div
                  key={task.id}
                  variants={rowVariants}
                  layout
                  exit="exit"
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/1 transition-all duration-200 cursor-pointer group"
                  onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
                >
                  {/* Left: Info */}
                  <div className="space-y-1.5 flex-1 pr-4 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-white group-hover:text-violet-300 transition-colors truncate">
                        {task.title}
                      </h3>
                      <span className={`px-2 py-0.5 text-[9px] font-semibold border rounded-full shrink-0 ${PRIORITY_COLORS[task.priority]}`}>
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-1">{task.goal}</p>
                    {task.description && (
                      <p className="text-[11px] text-slate-500 leading-relaxed italic line-clamp-1">
                        {task.description}
                      </p>
                    )}
                    <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 pt-0.5">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      {new Date(task.created_at).toLocaleString()}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div
                    className="flex items-center gap-3 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className={`px-3 py-1 text-[10px] font-bold border rounded-full uppercase tracking-wider ${STATUS_COLORS[task.status]}`}>
                      {task.status}
                    </span>

                    {task.status === TaskStatus.PENDING && (
                      <button
                        id={`plan-task-${task.id}`}
                        onClick={() => router.push(`/dashboard/planner?taskId=${task.id}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-violet-500/20 bg-violet-500/5 hover:bg-violet-500/10 text-violet-400 font-semibold text-xs transition-all"
                      >
                        <Activity className="w-3.5 h-3.5" /> Plan
                      </button>
                    )}

                    {task.status === TaskStatus.READY && (
                      <button
                        id={`run-task-${task.id}`}
                        onClick={() => router.push(`/dashboard/execution?taskId=${task.id}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-400 font-semibold text-xs transition-all"
                      >
                        <Play className="w-3.5 h-3.5" /> Execute
                      </button>
                    )}

                    <button
                      id={`details-task-${task.id}`}
                      onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
                      className="p-2 rounded-lg border border-white/5 bg-white/3 hover:bg-white/6 text-slate-400 hover:text-white transition-all"
                      title="View Details"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      id={`edit-task-${task.id}`}
                      onClick={() => setEditTask(task)}
                      className="p-2 rounded-lg border border-white/5 bg-white/3 hover:bg-blue-500/10 hover:border-blue-500/20 text-slate-400 hover:text-blue-400 transition-all"
                      title="Edit Task"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    <button
                      id={`delete-task-${task.id}`}
                      onClick={() => setDeleteTaskTarget(task)}
                      className="p-2 rounded-lg border border-white/5 bg-white/3 hover:bg-rose-500/10 hover:border-rose-500/20 text-slate-400 hover:text-rose-400 transition-all"
                      title="Delete Task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>

      {/* Summary footer */}
      {!isLoading && tasks.length > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-[10px] text-slate-600 text-right font-mono"
        >
          Showing {filteredTasks.length} of {tasks.length} task{tasks.length !== 1 ? "s" : ""}
        </motion.p>
      )}

      {/* Modals */}
      <AnimatePresence>
        {createOpen && (
          <CreateTaskModal
            onClose={() => setCreateOpen(false)}
            onCreate={createTask}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editTask && (
          <EditTaskModal
            task={editTask}
            onClose={() => setEditTask(null)}
            onSave={updateTask}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTask_target && (
          <DeleteConfirmDialog
            task={deleteTask_target}
            onClose={() => setDeleteTaskTarget(null)}
            onConfirm={() => deleteTask(deleteTask_target.id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
