import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { tasksApi, TaskFilters } from "../../api/endpoints/tasks";
import { extractErrorMessage } from "../../api/client";
import { Task } from "../../types";

function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["tasks"] });
  queryClient.invalidateQueries({ queryKey: ["top3"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  queryClient.invalidateQueries({ queryKey: ["achievements"] });
}

export function useTasks(filters?: TaskFilters) {
  return useQuery({ queryKey: ["tasks", filters], queryFn: () => tasksApi.list(filters) });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Task> & { title: string }) => tasksApi.create(input),
    onSuccess: () => {
      invalidate(queryClient);
      toast.success("Task created");
    },
    onError: (err) => toast.error(extractErrorMessage(err, "Could not create task")),
  });
}

interface TaskMutationSnapshot {
  tasks: [readonly unknown[], Task[] | undefined][];
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<Task> }) => tasksApi.update(id, input),

    // Drives both the "mark complete" checkbox and the kanban drag-drop -
    // patch the cached task's fields (status in particular) instantly so
    // the checkbox flips / the card jumps column before the response lands.
    onMutate: async ({ id, input }): Promise<TaskMutationSnapshot> => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const snapshot: TaskMutationSnapshot = { tasks: queryClient.getQueriesData<Task[]>({ queryKey: ["tasks"] }) };

      queryClient.setQueriesData<Task[]>({ queryKey: ["tasks"] }, (old) => {
        if (!old) return old;
        return old.map((t) => {
          if (t._id !== id) return t;
          const becomingCompleted = input.status === "completed" && t.status !== "completed";
          const leavingCompleted = input.status && input.status !== "completed" && t.status === "completed";
          return {
            ...t,
            ...input,
            completedAt: becomingCompleted ? new Date().toISOString() : leavingCompleted ? null : t.completedAt,
          };
        });
      });

      return snapshot;
    },
    onError: (err, _vars, snapshot) => {
      snapshot?.tasks.forEach(([key, data]) => queryClient.setQueryData(key, data));
      toast.error(extractErrorMessage(err, "Could not update task"));
    },
    onSuccess: (task) => {
      queryClient.setQueriesData<Task[]>({ queryKey: ["tasks"] }, (old) => (old ? old.map((t) => (t._id === task._id ? task : t)) : old));
      queryClient.invalidateQueries({ queryKey: ["top3"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tasksApi.remove,
    onSuccess: () => {
      invalidate(queryClient);
      toast.success("Task deleted");
    },
  });
}

export function useTop3(date: string) {
  return useQuery({ queryKey: ["top3", date], queryFn: () => tasksApi.getTop3(date) });
}

export function useSetTop3() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ date, taskIds }: { date: string; taskIds: string[] }) => tasksApi.setTop3(date, taskIds),

    onMutate: async ({ date, taskIds }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ["top3", date] }),
        queryClient.cancelQueries({ queryKey: ["tasks"] }),
      ]);

      const previousTop3 = queryClient.getQueryData<Task[]>(["top3", date]);
      const previousTasks = queryClient.getQueriesData<Task[]>({ queryKey: ["tasks"] });

      // Best-effort optimistic top-3 list, built from whatever tasks are
      // already cached (e.g. the tasks page's own list) - falls back to
      // leaving the query as-is if a task isn't cached anywhere yet, since
      // the response corrects it a moment later regardless.
      const byId = new Map<string, Task>();
      for (const [, tasks] of previousTasks) for (const t of tasks ?? []) byId.set(t._id, t);

      const idSet = new Set(taskIds);
      queryClient.setQueriesData<Task[]>({ queryKey: ["tasks"] }, (old) =>
        old ? old.map((t) => (idSet.has(t._id) ? { ...t, isTop3: true, top3Date: date } : t.isTop3 && t.top3Date === date ? { ...t, isTop3: false, top3Date: null } : t)) : old
      );

      const optimisticTop3 = taskIds.map((id) => byId.get(id)).filter((t): t is Task => !!t);
      if (optimisticTop3.length === taskIds.length) {
        queryClient.setQueryData<Task[]>(["top3", date], optimisticTop3);
      }

      return { previousTop3, previousTasks };
    },
    onError: (_err, { date }, context) => {
      if (context?.previousTop3 !== undefined) queryClient.setQueryData(["top3", date], context.previousTop3);
      context?.previousTasks.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSuccess: (top3, { date }) => {
      queryClient.setQueryData(["top3", date], top3);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
