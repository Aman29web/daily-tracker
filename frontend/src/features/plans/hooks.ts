import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { pausesApi, plansApi } from "../../api/endpoints/plans";
import { extractErrorMessage } from "../../api/client";

function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["plans"] });
  queryClient.invalidateQueries({ queryKey: ["pauses"] });
  queryClient.invalidateQueries({ queryKey: ["habits"] });
  queryClient.invalidateQueries({ queryKey: ["habit"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  queryClient.invalidateQueries({ queryKey: ["calendar"] });
}

export function usePlans(params?: { isArchived?: boolean; isTemplate?: boolean }) {
  return useQuery({ queryKey: ["plans", params], queryFn: () => plansApi.list(params) });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: plansApi.create,
    onSuccess: () => {
      invalidate(queryClient);
      toast.success("Plan created");
    },
    onError: (err) => toast.error(extractErrorMessage(err, "Could not create plan")),
  });
}

export function usePlanActions() {
  const queryClient = useQueryClient();
  const activate = useMutation({ mutationFn: plansApi.activate, onSuccess: () => invalidate(queryClient) });
  const deactivate = useMutation({ mutationFn: plansApi.deactivate, onSuccess: () => invalidate(queryClient) });
  const archive = useMutation({ mutationFn: plansApi.archive, onSuccess: () => invalidate(queryClient) });
  const duplicate = useMutation({
    mutationFn: plansApi.duplicate,
    onSuccess: () => {
      invalidate(queryClient);
      toast.success("Plan duplicated");
    },
  });
  return { activate, deactivate, archive, duplicate };
}

export function usePauses() {
  return useQuery({ queryKey: ["pauses"], queryFn: pausesApi.list });
}

export function useCreatePause() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: pausesApi.create,
    onSuccess: () => {
      invalidate(queryClient);
      toast.success("Vacation mode scheduled");
    },
    onError: (err) => toast.error(extractErrorMessage(err, "Could not schedule pause")),
  });
}

export function useDeletePause() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: pausesApi.remove,
    onSuccess: () => {
      invalidate(queryClient);
      toast.success("Pause removed");
    },
  });
}

export function useEndPauseNow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: pausesApi.endNow,
    onSuccess: () => {
      invalidate(queryClient);
      toast.success("Resumed");
    },
  });
}
