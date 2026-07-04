import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Task, TaskCreate, TaskUpdate } from "@/types/task";
import { ResponseEnvelope } from "@/types/api";

export function useTasks(page = 1, limit = 10, sortBy = "created_at", sortOrder = "desc") {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["tasks", page, limit, sortBy, sortOrder],
    queryFn: async () => {
      const { data } = await api.get<ResponseEnvelope<Task[]>>(
        `/tasks?page=${page}&limit=${limit}&sort_by=${sortBy}&sort_order=${sortOrder}`
      );
      if (data.success && data.data) {
        return data.data;
      }
      return [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (task: TaskCreate) => {
      const { data } = await api.post<ResponseEnvelope<Task>>("/tasks", task);
      if (data.success && data.data) {
        return data.data;
      }
      throw new Error(data.error?.message || "Failed to create task");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: TaskUpdate }) => {
      const { data } = await api.patch<ResponseEnvelope<Task>>(`/tasks/${taskId}`, updates);
      if (data.success && data.data) {
        return data.data;
      }
      throw new Error(data.error?.message || "Failed to update task");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task", variables.taskId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { data } = await api.delete<ResponseEnvelope<null>>(`/tasks/${taskId}`);
      if (data.success) {
        return null;
      }
      throw new Error(data.error?.message || "Failed to delete task");
    },
    onSuccess: (_, taskId) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
    },
  });

  return {
    tasks: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    createTask: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateTask: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteTask: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
