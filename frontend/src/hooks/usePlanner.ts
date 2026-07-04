import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { ExecutionPlan } from "@/types/planner";
import { ResponseEnvelope } from "@/types/api";

export function usePlanner(taskId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["planner", taskId],
    queryFn: async () => {
      if (!taskId) return null;
      const { data } = await api.get<ResponseEnvelope<ExecutionPlan>>(
        `/tasks/${taskId}/plan`
      );
      if (data.success && data.data) {
        return data.data;
      }
      return null;
    },
    enabled: !!taskId,
  });

  const generateMutation = useMutation({
    mutationFn: async (targetTaskId: string) => {
      const { data } = await api.post<ResponseEnvelope<ExecutionPlan>>(
        `/tasks/${targetTaskId}/plan`
      );
      if (data.success && data.data) {
        return data.data;
      }
      throw new Error(data.error?.message || "Failed to generate plan");
    },
    onSuccess: (_, targetTaskId) => {
      queryClient.invalidateQueries({ queryKey: ["planner", targetTaskId] });
      queryClient.invalidateQueries({ queryKey: ["task", targetTaskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  return {
    plan: query.data || null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    generatePlan: generateMutation.mutateAsync,
    isGenerating: generateMutation.isPending,
  };
}
