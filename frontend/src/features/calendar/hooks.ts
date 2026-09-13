import { useQuery } from "@tanstack/react-query";
import { calendarApi } from "../../api/endpoints/insights";

export function useCalendarRange(start: string, end: string) {
  return useQuery({ queryKey: ["calendar", start, end], queryFn: () => calendarApi.range(start, end) });
}

export function useCalendarDay(date: string | null) {
  return useQuery({
    queryKey: ["calendar-day", date],
    queryFn: () => calendarApi.day(date!),
    enabled: !!date,
  });
}
