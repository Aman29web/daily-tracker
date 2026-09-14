import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { goalsApi } from "../../api/endpoints/goals";
import { extractErrorMessage } from "../../api/client";
import { Goal } from "../../types";

function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["goals"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  queryClient.invalidateQueries({ queryKey: ["achievements"] });
}

export function useGoals(params?: { status?: string; category?: string }) {
  return useQuery({ queryKey: ["goals", params], queryFn: () => goalsApi.list(params) });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: goalsApi.create,
    onSuccess: () => {
      invalidate(queryClient);
      toast.success("Goal created");
    },
    onError: (err) => toast.error(extractErrorMessage(err, "Could not create goal")),
  });
}

export function useUpdateGoalProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, currentValue }: { id: string; currentValue: number }) => goalsApi.setProgress(id, currentValue),

    // Move the progress bar/percentage instantly; whether it flips to
    // "completed" is a same-tick guess (currentValue >= targetValue) that
    // the response overwrites a moment later with the backend's own status.
    onMutate: async ({ id, currentValue }) => {
      await queryClient.cancelQueries({ queryKey: ["goals"] });
      const previousGoals = queryClient.getQueriesData<Goal[]>({ queryKey: ["goals"] });

      // Mirrors goalService.setGoalProgress exactly: crossing the target while
      // still active locks it to "completed" - a goal never reverts back to
      // active just because currentValue is edited down again afterward.
      queryClient.setQueriesData<Goal[]>({ queryKey: ["goals"] }, (old) =>
        old
          ? old.map((g) =>
              g._id === id ? { ...g, currentValue, status: g.status === "active" && currentValue >= g.targetValue ? "completed" : g.status } : g
            )
          : old
      );

      return { previousGoals };
    },
    onError: (err, _vars, context) => {
      context?.previousGoals.forEach(([key, data]) => queryClient.setQueryData(key, data));
      toast.error(extractErrorMessage(err, "Could not update progress"));
    },
    onSuccess: (goal) => {
      queryClient.setQueriesData<Goal[]>({ queryKey: ["goals"] }, (old) => (old ? old.map((g) => (g._id === goal._id ? goal : g)) : old));
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
      toast.success(goal.status === "completed" ? `🎉 Goal complete: ${goal.title}` : "Progress updated");
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Record<string, unknown> }) => goalsApi.update(id, input),
    onSuccess: () => invalidate(queryClient),
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: goalsApi.remove,
    onSuccess: () => {
      invalidate(queryClient);
      toast.success("Goal deleted");
    },
  });
}
