import { BookOpen, Timer, CheckSquare } from "lucide-react";
import Modal from "../../components/ui/Modal";
import { useCalendarDay } from "./hooks";
import DynamicIcon from "../../components/ui/DynamicIcon";
import Skeleton from "../../components/ui/Skeleton";
import { formatMinutes, formatPretty } from "../../utils/date";
import "./DayDetailModal.css";

const MOOD_EMOJI: Record<string, string> = {
  great: "😄",
  good: "🙂",
  okay: "😐",
  bad: "😞",
  terrible: "😔",
};

export default function DayDetailModal({ date, onClose }: { date: string | null; onClose: () => void }) {
  const { data, isLoading } = useCalendarDay(date);

  return (
    <Modal open={!!date} onClose={onClose} title={date ? formatPretty(date) : undefined} width={460}>
      {isLoading || !data ? (
        <div className="stack" style={{ gap: 10 }}>
          <Skeleton height={70} radius={12} />
          <Skeleton height={140} radius={12} />
        </div>
      ) : (
        <div className="day-detail">
          <div className="day-detail-score">
            <strong>{data.summary.productivityScore}%</strong>
            <span>Productivity score</span>
          </div>

          <div className="day-detail-stats">
            <div>
              <CheckSquare size={14} />
              {data.summary.habitsCompleted}/{data.summary.habitsScheduled} habits
            </div>
            <div>
              <Timer size={14} />
              {formatMinutes(data.summary.focusMinutes)} focus
            </div>
            <div>
              <BookOpen size={14} />
              {data.journal ? "Journaled" : "No entry"}
            </div>
            {data.mood && (
              <div>
                {MOOD_EMOJI[data.mood.mood] ?? "🙂"} {data.mood.mood}
              </div>
            )}
          </div>

          {data.habits.length > 0 && (
            <div className="day-detail-section">
              <h4>Habits</h4>
              <div className="stack" style={{ gap: 6 }}>
                {data.habits.map((h) => (
                  <div key={h.id} className="day-detail-habit-row">
                    <span className="day-detail-habit-icon" style={{ background: `${h.color}22`, color: h.color }}>
                      <DynamicIcon name={h.icon} size={13} />
                    </span>
                    <span className="grow">{h.name}</span>
                    <span className={"badge badge-" + statusBadge(h.status)}>{h.status.replace("_", " ")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.tasks.length > 0 && (
            <div className="day-detail-section">
              <h4>Tasks due</h4>
              <div className="stack" style={{ gap: 6 }}>
                {data.tasks.map((t) => (
                  <div key={t._id} className="day-detail-task-row">
                    <span>{t.title}</span>
                    <span className={"badge badge-" + (t.status === "completed" ? "success" : "neutral")}>{t.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.journal && (
            <div className="day-detail-section">
              <h4>Journal</h4>
              {data.journal.wentWell && <p className="day-detail-journal-text">"{data.journal.wentWell}"</p>}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function statusBadge(status: string): string {
  if (status === "completed") return "success";
  if (status === "missed" || status === "skipped") return "danger";
  if (status === "paused") return "primary";
  return "neutral";
}
