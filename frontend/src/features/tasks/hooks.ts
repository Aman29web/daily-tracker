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

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<Task> }) => tasksApi.update(id, input),
    onSuccess: () => invalidate(queryClient),
    onError: (err) => toast.error(extractErrorMessage(err, "Could not update task")),
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
    onSuccess: () => invalidate(queryClient),
  });
}
