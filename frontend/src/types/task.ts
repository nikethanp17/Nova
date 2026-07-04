export enum TaskStatus {
  PENDING = "PENDING",
  PLANNING = "PLANNING",
  READY = "READY",
  RUNNING = "RUNNING",
  WAITING = "WAITING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  goal: string;
  status: TaskStatus;
  priority: TaskPriority;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface TaskCreate {
  title: string;
  description?: string | null;
  goal: string;
  priority?: TaskPriority;
  metadata?: Record<string, any>;
}

export interface TaskUpdate {
  title?: string;
  description?: string | null;
  goal?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  metadata?: Record<string, any>;
}
