/**
 * History Adapter Interface
 *
 * The backend does not yet expose a global execution history endpoint.
 * All history data is fetched by combining:
 *   - GET /tasks (all user tasks)
 *   - GET /tasks/{taskId}/execution (per-task execution result)
 *
 * When the backend adds a dedicated history endpoint (e.g. GET /executions),
 * replace ONLY this file — the History page and hooks import from here exclusively.
 *
 * Adapter contract:
 *   fetchExecutionHistory(options) → Promise<HistoryRecord[]>
 */

import api from "@/lib/api";
import { ResponseEnvelope } from "@/types/api";
import { Task } from "@/types/task";
import { TaskExecution } from "@/types/execution";

export interface HistoryRecord {
  executionId: string;
  taskId: string;
  taskTitle: string;
  taskGoal: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  error: string | null;
  stepResults: Array<{
    step_number: number;
    action: string;
    target: string | null;
    status: string;
    duration_ms: number;
    screenshot_path: string | null;
    error: string | null;
    confidence: number;
    started_at: string;
    completed_at: string;
    url: string | null;
  }>;
}

// ─── Helper: fetch execution for a single task (silences 404) ─────────────────
async function fetchTaskExecution(taskId: string): Promise<TaskExecution | null> {
  try {
    const { data } = await api.get<ResponseEnvelope<TaskExecution>>(
      `/tasks/${taskId}/execution`
    );
    if (data.success && data.data) return data.data;
    return null;
  } catch {
    return null;
  }
}

// ─── Main adapter function (SWAP THIS when backend adds GET /executions) ───────
export async function fetchExecutionHistory(): Promise<HistoryRecord[]> {
  // 1. Fetch all tasks
  const { data: tasksResp } = await api.get<ResponseEnvelope<Task[]>>(
    "/tasks?page=1&limit=100&sort_by=updated_at&sort_order=desc"
  );
  const tasks = tasksResp.success && tasksResp.data ? tasksResp.data : [];

  // 2. For each task that has been executed, fetch its execution record in parallel
  const executedStatuses = new Set(["RUNNING", "COMPLETED", "FAILED", "CANCELLED"]);
  const executedTasks = tasks.filter((t) => executedStatuses.has(t.status));

  const executions = await Promise.all(
    executedTasks.map(async (task): Promise<HistoryRecord | null> => {
      const execution = await fetchTaskExecution(task.id);
      if (!execution) return null;

      const stepResults = execution.metadata?.step_results ?? [];
      return {
        executionId: execution.id,
        taskId: task.id,
        taskTitle: task.title,
        taskGoal: task.goal,
        status: execution.status,
        startedAt: execution.started_at,
        completedAt: execution.completed_at,
        error: execution.error,
        stepResults,
      };
    })
  );

  // 3. Return only valid records, most recent first
  return executions
    .filter((e): e is HistoryRecord => e !== null)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
}
