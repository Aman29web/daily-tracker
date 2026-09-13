import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { habitsApi, CreateHabitInput } from "../../api/endpoints/habits";
import { extractErrorMessage } from "../../api/client";
import { HabitSchedule } from "../../types";
import { HabitFormValues } from "./HabitForm";

export function toCreateInput(values: HabitFormValues): CreateHabitInput {
  return {
    name: values.name,
    description: values.description,
    icon: values.icon,
    color: values.color,
    category: values.category,
    type: values.type,
    target: values.type === "numeric" && values.targetValue ? { value: values.targetValue, unit: values.targetUnit || "units" } : undefined,
    priority: values.priority,
    reminderTime: values.reminderTime || undefined,
    startDate: values.startDate,
    schedule: values.schedule as HabitSchedule,
  };
}

export function useHabits(filters?: { category?: string; planId?: string; isActive?: boolean; search?: string }) {
  return useQuery({
    queryKey: ["habits", filters],
    queryFn: () => habitsApi.list(filters),
  });
}

export function useHabit(id: string | undefined) {
  return useQuery({
    queryKey: ["habit", id],
    queryFn: () => habitsApi.get(id!),
    enabled: !!id,
  });
}

function invalidateHabitQueries(queryClient: ReturnType<typeof useQueryClient>, habitId?: string) {
  queryClient.invalidateQueries({ queryKey: ["habits"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  queryClient.invalidateQueries({ queryKey: ["calendar"] });
  queryClient.invalidateQueries({ queryKey: ["achievements"] });
  if (habitId) queryClient.invalidateQueries({ queryKey: ["habit", habitId] });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: habitsApi.create,
    onSuccess: () => {
      invalidateHabitQueries(queryClient);
      toast.success("Habit created");
    },
    onError: (err) => toast.error(extractErrorMessage(err, "Could not create habit")),
  });
}

export function useUpdateHabit(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<CreateHabitInput> & { isActive?: boolean }) => habitsApi.update(id, input),
    onSuccess: () => {
      invalidateHabitQueries(queryClient, id);
      toast.success("Habit updated");
    },
    onError: (err) => toast.error(extractErrorMessage(err, "Could not update habit")),
  });
}

export function useUpdateHabitSchedule(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ schedule, effectiveFrom }: { schedule: HabitSchedule; effectiveFrom?: string }) =>
      habitsApi.updateSchedule(id, schedule, effectiveFrom),
    onSuccess: () => {
      invalidateHabitQueries(queryClient, id);
      toast.success("Schedule updated — history stays untouched");
    },
    onError: (err) => toast.error(extractErrorMessage(err, "Could not update schedule")),
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: habitsApi.remove,
    onSuccess: () => {
      invalidateHabitQueries(queryClient);
      toast.success("Habit deleted");
    },
  });
}

export function useCheckIn(habitId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof habitsApi.checkIn>[1]) => habitsApi.checkIn(habitId, input),
    onSuccess: () => invalidateHabitQueries(queryClient, habitId),
    onError: (err) => toast.error(extractErrorMessage(err, "Could not update check-in")),
  });
}

export function useHabitRange(habitId: string | undefined, start: string, end: string) {
  return useQuery({
    queryKey: ["habit-range", habitId, start, end],
    queryFn: () => habitsApi.range(habitId!, start, end),
    enabled: !!habitId,
  });
}
