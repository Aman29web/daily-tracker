import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { goalsApi } from "../../api/endpoints/goals";
import { extractErrorMessage } from "../../api/client";

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
    onSuccess: (goal) => {
      invalidate(queryClient);
      toast.success(goal.status === "completed" ? `🎉 Goal complete: ${goal.title}` : "Progress updated");
    },
    onError: (err) => toast.error(extractErrorMessage(err, "Could not update progress")),
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
