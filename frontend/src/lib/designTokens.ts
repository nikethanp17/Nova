import { TaskStatus, TaskPriority } from "@/types/task";
import React from "react";
import {
  CheckCircle2,
  Loader2,
  Clock,
  Cpu,
  XCircle,
  Globe,
  MousePointerClick,
  Type,
  Send,
  Eye,
  Zap,
} from "lucide-react";

// Task Status Badge Styles
export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  [TaskStatus.COMPLETED]: "bg-emerald-500/10 border-emerald-500/20 text-emerald-450 text-emerald-400",
  [TaskStatus.RUNNING]:   "bg-blue-500/10 border-blue-500/20 text-blue-450 text-blue-400",
  [TaskStatus.READY]:     "bg-violet-500/10 border-violet-500/20 text-violet-450 text-violet-400",
  [TaskStatus.PLANNING]:  "bg-sky-500/10 border-sky-500/20 text-sky-450 text-sky-400",
  [TaskStatus.WAITING]:   "bg-amber-500/10 border-amber-500/20 text-amber-450 text-amber-400",
  [TaskStatus.FAILED]:    "bg-rose-500/10 border-rose-500/20 text-rose-450 text-rose-400",
  [TaskStatus.CANCELLED]: "bg-slate-500/10 border-slate-500/20 text-slate-450 text-slate-455 text-slate-400",
  [TaskStatus.PENDING]:   "bg-slate-500/10 border-slate-500/20 text-slate-450 text-slate-455 text-slate-400",
};

// Task Priority Badge Styles
export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  [TaskPriority.URGENT]: "text-red-400 bg-red-400/8 border-red-500/20",
  [TaskPriority.HIGH]:   "text-amber-400 bg-amber-400/8 border-amber-500/20",
  [TaskPriority.MEDIUM]: "text-blue-400 bg-blue-400/8 border-blue-500/20",
  [TaskPriority.LOW]:    "text-slate-400 bg-slate-400/8 border-slate-500/15",
};

// Step Status Styles (Timeline & Execution Cards)
export const STEP_STATUS_STYLES: Record<string, { badge: string; dot: string; card: string }> = {
  SUCCESS:  { badge: "bg-emerald-500/10 border-emerald-500/25 text-emerald-400", dot: "bg-emerald-400", card: "border-emerald-500/15 bg-emerald-500/3" },
  COMPLETED:{ badge: "bg-emerald-500/10 border-emerald-500/25 text-emerald-400", dot: "bg-emerald-400", card: "border-emerald-500/15 bg-emerald-500/3" },
  RUNNING:  { badge: "bg-blue-500/10 border-blue-500/25 text-blue-400",          dot: "bg-blue-400",   card: "border-blue-500/15 bg-blue-500/3" },
  FAILED:   { badge: "bg-rose-500/10 border-rose-500/25 text-rose-400",          dot: "bg-rose-400",   card: "border-rose-500/15 bg-rose-500/3" },
  PENDING:  { badge: "bg-slate-500/10 border-slate-500/20 text-slate-400",       dot: "bg-slate-600",  card: "border-white/5 bg-slate-950/20" },
};

// Execution Status Styles
export const EXEC_STATUS_STYLES: Record<string, string> = {
  RUNNING:   "bg-blue-500/10 border-blue-500/20 text-blue-400",
  COMPLETED: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  FAILED:    "bg-rose-500/10 border-rose-500/20 text-rose-400",
  CANCELLED: "bg-slate-500/10 border-slate-500/20 text-slate-400",
};

// Browser Action Icons
export const ACTION_ICONS: Record<string, React.ReactNode> = {
  navigate: React.createElement(Globe, { className: "w-3.5 h-3.5 text-sky-400" }),
  click:    React.createElement(MousePointerClick, { className: "w-3.5 h-3.5 text-violet-400" }),
  type:     React.createElement(Type, { className: "w-3.5 h-3.5 text-emerald-400" }),
  fill:     React.createElement(Type, { className: "w-3.5 h-3.5 text-emerald-400" }),
  submit:   React.createElement(Send, { className: "w-3.5 h-3.5 text-indigo-400" }),
  extract:  React.createElement(Eye, { className: "w-3.5 h-3.5 text-sky-400" }),
  verify:   React.createElement(CheckCircle2, { className: "w-3.5 h-3.5 text-emerald-400" }),
  wait:     React.createElement(Clock, { className: "w-3.5 h-3.5 text-amber-400" }),
};

export function getActionIcon(action: string): React.ReactNode {
  return ACTION_ICONS[action?.toLowerCase()] ?? React.createElement(Zap, { className: "w-3.5 h-3.5 text-slate-400" });
}

export const TASK_STATUS_ICONS: Record<TaskStatus, React.ReactNode> = {
  [TaskStatus.COMPLETED]: React.createElement(CheckCircle2, { className: "w-4 h-4 text-emerald-400" }),
  [TaskStatus.RUNNING]:   React.createElement(Loader2, { className: "w-4 h-4 text-blue-400 animate-spin" }),
  [TaskStatus.READY]:     React.createElement(Clock, { className: "w-4 h-4 text-violet-400" }),
  [TaskStatus.PLANNING]:  React.createElement(Cpu, { className: "w-4 h-4 text-sky-400" }),
  [TaskStatus.WAITING]:   React.createElement(Clock, { className: "w-4 h-4 text-amber-400" }),
  [TaskStatus.FAILED]:    React.createElement(XCircle, { className: "w-4 h-4 text-rose-400" }),
  [TaskStatus.CANCELLED]: React.createElement(XCircle, { className: "w-4 h-4 text-slate-400" }),
  [TaskStatus.PENDING]:   React.createElement(Clock, { className: "w-4 h-4 text-slate-400" }),
};
