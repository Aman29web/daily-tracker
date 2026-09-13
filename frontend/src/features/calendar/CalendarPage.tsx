import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCalendarRange } from "./hooks";
import { startOfMonth, endOfMonth, addMonths, format } from "date-fns";
import { dayOfWeek, todayStr } from "../../utils/date";
import DayDetailModal from "./DayDetailModal";
import Skeleton from "../../components/ui/Skeleton";
import "./CalendarPage.css";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function scoreClass(score: number): string {
  if (score >= 80) return "heat-4";
  if (score >= 60) return "heat-3";
  if (score >= 35) return "heat-2";
  if (score > 0) return "heat-1";
  return "heat-0";
}

export default function CalendarPage() {
  const [cursor, setCursor] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const today = todayStr();

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const startStr = format(monthStart, "yyyy-MM-dd");
  const endStr = format(monthEnd, "yyyy-MM-dd");

  const { data, isLoading } = useCalendarRange(startStr, endStr);
  const dataMap = useMemo(() => new Map((data ?? []).map((d) => [d.date, d])), [data]);

  const leadingBlanks = (dayOfWeek(startStr) + 6) % 7; // convert Sun=0 to Mon-first index
  const daysInMonth = monthEnd.getDate();
  const cells: (string | null)[] = [...Array(leadingBlanks).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => startStr.slice(0, 8) + String(i + 1).padStart(2, "0"))];

  return (
    <div className="calendar-page">
      <div className="page-header">
        <div>
          <h1>Calendar</h1>
          <p>Your productivity, day by day.</p>
        </div>
        <div className="calendar-nav">
          <button className="btn btn-icon" onClick={() => setCursor(addMonths(cursor, -1))} type="button">
            <ChevronLeft size={16} />
          </button>
          <strong>{format(cursor, "MMMM yyyy")}</strong>
          <button className="btn btn-icon" onClick={() => setCursor(addMonths(cursor, 1))} type="button">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="card card-pad">
        <div className="calendar-weekdays">
          {WEEKDAYS.map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>

        {isLoading ? (
          <Skeleton height={320} radius={12} />
        ) : (
          <div className="calendar-grid">
            {cells.map((date, idx) => {
              if (!date) return <div key={idx} className="calendar-cell empty" />;
              const day = dataMap.get(date);
              const hasData = day?.hasData ?? false;
              return (
                <button
                  key={date}
                  className={"calendar-cell " + (hasData ? scoreClass(day!.productivityScore) : "heat-0") + (date === today ? " today" : "")}
                  onClick={() => setSelectedDate(date)}
                  type="button"
                >
                  <span className="calendar-cell-date">{Number(date.slice(-2))}</span>
                  {hasData && day!.productivityScore > 0 && <span className="calendar-cell-score">{day!.productivityScore}%</span>}
                  {day?.journalCompleted && <span className="calendar-cell-dot" />}
                </button>
              );
            })}
          </div>
        )}

        <div className="calendar-legend">
          <span>Less</span>
          <i className="heat-0" />
          <i className="heat-1" />
          <i className="heat-2" />
          <i className="heat-3" />
          <i className="heat-4" />
          <span>More</span>
        </div>
      </div>

      <DayDetailModal date={selectedDate} onClose={() => setSelectedDate(null)} />
    </div>
  );
}
