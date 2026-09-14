import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { habitsApi, CreateHabitInput } from "../../api/endpoints/habits";
import { extractErrorMessage } from "../../api/client";
import { DashboardData, DayStatus, HabitSchedule, HabitWithStats } from "../../types";
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

type CheckInInput = Parameters<typeof habitsApi.checkIn>[1];

interface DayGuessInput {
  status: DayStatus;
  value?: number;
  targetValue?: number;
  streakCurrent: number;
}

interface DayGuess {
  status: DayStatus;
  value?: number;
  streakCurrent: number;
}

/**
 * A same-tick best guess at what the server will say, purely so a tap feels
 * instant. resolveDayStatus/computeHabitStreak on the backend remain the one
 * source of truth (rule #33) - the guess is always overwritten by the real
 * response in onSuccess below, so a wrong guess here can never leave the UI
 * in an incorrect state, only flip back for a moment on a rare mismatch.
 */
function guessNextDayState(current: DayGuessInput, input: CheckInInput): DayGuess {
  const wasCompleted = current.status === "completed";
  switch (input.action) {
    case "complete":
      return {
        status: "completed",
        value: current.targetValue ?? input.value ?? current.value ?? 1,
        streakCurrent: wasCompleted ? current.streakCurrent : current.streakCurrent + 1,
      };
    case "undo":
      return {
        status: "pending",
        value: undefined,
        streakCurrent: wasCompleted ? Math.max(0, current.streakCurrent - 1) : current.streakCurrent,
      };
    case "skip":
      return { status: "skipped", value: current.value, streakCurrent: 0 };
    case "miss":
      return { status: "missed", value: current.value, streakCurrent: 0 };
    case "increment":
    case "set_value": {
      const delta = input.value ?? 1;
      const newValue = input.action === "set_value" ? delta : Math.max(0, (current.value ?? 0) + delta);
      const met = current.targetValue !== undefined ? newValue >= current.targetValue : false;
      const streakCurrent = met === wasCompleted ? current.streakCurrent : met ? current.streakCurrent + 1 : Math.max(0, current.streakCurrent - 1);
      return { status: met ? "completed" : "pending", value: newValue, streakCurrent };
    }
    default:
      return { status: current.status, value: current.value, streakCurrent: current.streakCurrent };
  }
}

interface CheckInSnapshot {
  dashboard: [readonly unknown[], DashboardData | undefined][];
  habits: [readonly unknown[], HabitWithStats[] | undefined][];
  habit: HabitWithStats | undefined;
}

export function useCheckIn(habitId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CheckInInput) => habitsApi.checkIn(habitId, input),

    // Flip the checkbox/value/streak everywhere this habit is rendered
    // (dashboard row, habits list row, habit detail) before the request
    // even leaves the browser, instead of waiting on the round trip.
    onMutate: async (input): Promise<CheckInSnapshot> => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ["dashboard"] }),
        queryClient.cancelQueries({ queryKey: ["habits"] }),
        queryClient.cancelQueries({ queryKey: ["habit", habitId] }),
      ]);

      const snapshot: CheckInSnapshot = {
        dashboard: queryClient.getQueriesData<DashboardData>({ queryKey: ["dashboard"] }),
        habits: queryClient.getQueriesData<HabitWithStats[]>({ queryKey: ["habits"] }),
        habit: queryClient.getQueryData<HabitWithStats>(["habit", habitId]),
      };

      queryClient.setQueriesData<DashboardData>({ queryKey: ["dashboard"] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          habits: old.habits.map((h) => {
            if (h.habit.id !== habitId) return h;
            const next = guessNextDayState({ status: h.status, value: h.value, targetValue: h.targetValue, streakCurrent: h.streak }, input);
            return { ...h, status: next.status, value: next.value, streak: next.streakCurrent };
          }),
        };
      });

      queryClient.setQueriesData<HabitWithStats[]>({ queryKey: ["habits"] }, (old) => {
        if (!old) return old;
        return old.map((item) => {
          if (item.habit._id !== habitId) return item;
          const next = guessNextDayState(
            { status: item.today.status, value: item.today.value, targetValue: item.today.targetValue, streakCurrent: item.streak.current },
            input
          );
          return {
            ...item,
            today: { ...item.today, status: next.status, value: next.value },
            streak: { ...item.streak, current: next.streakCurrent },
          };
        });
      });

      queryClient.setQueryData<HabitWithStats>(["habit", habitId], (old) => {
        if (!old) return old;
        const next = guessNextDayState(
          { status: old.today.status, value: old.today.value, targetValue: old.today.targetValue, streakCurrent: old.streak.current },
          input
        );
        return {
          ...old,
          today: { ...old.today, status: next.status, value: next.value },
          streak: { ...old.streak, current: next.streakCurrent },
        };
      });

      return snapshot;
    },

    onError: (err, _input, snapshot) => {
      if (snapshot) {
        snapshot.dashboard.forEach(([key, data]) => queryClient.setQueryData(key, data));
        snapshot.habits.forEach(([key, data]) => queryClient.setQueryData(key, data));
        queryClient.setQueryData(["habit", habitId], snapshot.habit);
      }
      toast.error(extractErrorMessage(err, "Could not update check-in"));
    },

    onSuccess: (result) => {
      // Overwrite the guess with the backend's authoritative day/streak
      // directly in cache - no extra round trip needed for the habit(s)
      // that were already patched optimistically above.
      queryClient.setQueriesData<DashboardData>({ queryKey: ["dashboard"] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          habits: old.habits.map((h) =>
            h.habit.id === habitId
              ? { ...h, status: result.day.status, value: result.day.value, targetValue: result.day.targetValue ?? h.targetValue, streak: result.streak.current }
              : h
          ),
        };
      });
      queryClient.setQueriesData<HabitWithStats[]>({ queryKey: ["habits"] }, (old) => {
        if (!old) return old;
        return old.map((item) => (item.habit._id === habitId ? { ...item, today: result.day, streak: result.streak } : item));
      });
      queryClient.setQueryData<HabitWithStats>(["habit", habitId], (old) => (old ? { ...old, today: result.day, streak: result.streak } : old));

      // The dashboard's aggregate productivity score/hero message/longest
      // streak depend on every habit, not just this one, and must stay
      // backend-computed (rule #33) - refetch just that, now that habits/habit
      // above are already correct and don't need to be re-fetched too.
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
    },
  });
}

export function useHabitRange(habitId: string | undefined, start: string, end: string) {
  return useQuery({
    queryKey: ["habit-range", habitId, start, end],
    queryFn: () => habitsApi.range(habitId!, start, end),
    enabled: !!habitId,
  });
}
