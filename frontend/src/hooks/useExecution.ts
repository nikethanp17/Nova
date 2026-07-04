import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { TaskExecution } from "@/types/execution";
import { ResponseEnvelope } from "@/types/api";

// ─── GET /tasks/{taskId}/execution ───────────────────────────────────────────
export function useExecution(taskId?: string, pollingEnabled = false) {
  return useQuery({
    queryKey: ["execution", taskId],
    queryFn: async () => {
      if (!taskId) return null;
      try {
        const { data } = await api.get<ResponseEnvelope<TaskExecution>>(
          `/tasks/${taskId}/execution`
        );
        if (data.success && data.data) {
          return data.data;
        }
        return null;
      } catch {
        // 404 means no execution yet — return null gracefully
        return null;
      }
    },
    enabled: !!taskId,
    // Live polling when requested (e.g. while RUNNING)
    refetchInterval: pollingEnabled ? 2000 : false,
    refetchIntervalInBackground: false,
  });
}

// ─── POST /tasks/{taskId}/execute ────────────────────────────────────────────
export function useExecuteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { data } = await api.post<ResponseEnvelope<TaskExecution>>(
        `/tasks/${taskId}/execute`
      );
      if (data.success && data.data) {
        return data.data;
      }
      throw new Error(data.error?.message || "Failed to start execution");
    },
    onSuccess: (_, taskId) => {
      // Immediately invalidate so the execution data and task status refresh
      queryClient.invalidateQueries({ queryKey: ["execution", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
    },
  });
}
