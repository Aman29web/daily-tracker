import { useHabitRange } from "./hooks";
import { addDaysStr, todayStr, formatShort } from "../../utils/date";
import { DayStatus } from "../../types";
import "./HabitHistoryStrip.css";

const STATUS_CLASS: Record<DayStatus, string> = {
  completed: "s-completed",
  missed: "s-missed",
  skipped: "s-skipped",
  paused: "s-paused",
  rest_day: "s-rest",
  not_scheduled: "s-none",
  pending: "s-pending",
  upcoming: "s-none",
  inactive: "s-none",
};

export default function HabitHistoryStrip({ habitId, days = 42 }: { habitId: string; days?: number }) {
  const end = todayStr();
  const start = addDaysStr(end, -(days - 1));
  const { data, isLoading } = useHabitRange(habitId, start, end);

  if (isLoading || !data) return <div className="history-strip-loading" />;

  return (
    <div className="history-strip">
      {data.map((d) => (
        <div key={d.date} className={"history-cell " + STATUS_CLASS[d.status]} title={`${formatShort(d.date)} — ${d.status.replace("_", " ")}`} />
      ))}
    </div>
  );
}
