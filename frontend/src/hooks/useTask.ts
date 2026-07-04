import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Task } from "@/types/task";
import { ResponseEnvelope } from "@/types/api";

export function useTask(taskId?: string) {
  const query = useQuery({
    queryKey: ["task", taskId],
    queryFn: async () => {
      if (!taskId) return null;
      const { data } = await api.get<ResponseEnvelope<Task>>(`/tasks/${taskId}`);
      if (data.success && data.data) {
        return data.data;
      }
      return null;
    },
    enabled: !!taskId,
  });

  return {
    task: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
