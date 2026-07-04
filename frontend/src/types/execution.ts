// Execution types matching backend TaskExecutionResponse and BrowserStepResult

export interface BrowserStepResult {
  step_number: number;
  action: string;
  target: string | null;
  status: "SUCCESS" | "COMPLETED" | "FAILED" | "RUNNING" | "PENDING";
  duration_ms: number;
  screenshot_path: string | null;
  error: string | null;
  confidence: number;
  started_at: string;
  completed_at: string;
  url: string | null;
}

export interface ExecutionMetadata {
  step_results?: BrowserStepResult[];
  [key: string]: unknown;
}

export interface TaskExecution {
  id: string;
  task_id: string;
  status: string; // RUNNING, COMPLETED, FAILED, CANCELLED
  started_at: string;
  completed_at: string | null;
  error: string | null;
  metadata: ExecutionMetadata;
}
