export enum StepStatus {
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export enum PlanStatus {
  PLANNING = "PLANNING",
  READY = "READY",
  FAILED = "FAILED",
}

export interface Step {
  step_number: number;
  title: string;
  description: string;
  action: string;
  target: string | null;
  input: any;
  expected_result: string;
  status: StepStatus;
}

export interface ExecutionPlan {
  id: string;
  task_id: string;
  user_id: string;
  goal: string;
  status: PlanStatus;
  estimated_steps: number;
  estimated_duration: string;
  prompt_version: string;
  created_at: string;
  steps: Step[];
  strategy?: string;
  checkpoints?: string[];
  success_criteria?: string;
  metadata: Record<string, any>;
}
