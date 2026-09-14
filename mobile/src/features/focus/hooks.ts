import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { focusApi } from "@/api/endpoints/focus";
import { extractErrorMessage } from "@/api/client";
import { toast } from "@/stores/toastStore";

function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["focus-sessions"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  queryClient.invalidateQueries({ queryKey: ["achievements"] });
}

export function useFocusSessions(params?: { start?: string; end?: string; status?: string; limit?: number }) {
  return useQuery({ queryKey: ["focus-sessions", params], queryFn: () => focusApi.list(params) });
}

export function useActiveFocusSession() {
  return useQuery({
    queryKey: ["focus-sessions", { status: "running" }],
    queryFn: () => focusApi.list({ status: "running", limit: 1 }),
    select: (sessions) => sessions[0] ?? null,
    refetchInterval: 15_000,
  });
}

export function useStartFocus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: focusApi.start,
    onSuccess: () => invalidate(queryClient),
    onError: (err) => toast.error(extractErrorMessage(err, "Could not start session")),
  });
}

export function useFocusActions() {
  const queryClient = useQueryClient();
  const pause = useMutation({ mutationFn: focusApi.pause, onSuccess: () => invalidate(queryClient) });
  const resume = useMutation({ mutationFn: focusApi.resume, onSuccess: () => invalidate(queryClient) });
  const complete = useMutation({
    mutationFn: focusApi.complete,
    onSuccess: () => {
      invalidate(queryClient);
      toast.success("Focus session logged");
    },
  });
  const cancel = useMutation({ mutationFn: focusApi.cancel, onSuccess: () => invalidate(queryClient) });
  return { pause, resume, complete, cancel };
}
