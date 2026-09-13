import { Star, Trash2, Clock } from "lucide-react";
import { Task } from "../../types";
import { formatShort } from "../../utils/date";
import "./TaskCard.css";

const PRIORITY_CLASS: Record<string, string> = {
  low: "neutral",
  medium: "primary",
  high: "warning",
  urgent: "danger",
};

interface TaskCardProps {
  task: Task;
  /** Whether this task is in *today's* Top 3 — not the same as task.isTop3, which reflects whatever date it was last starred for. */
  isTop3Today: boolean;
  onToggleComplete: () => void;
  onToggleTop3: () => void;
  onDelete: () => void;
  draggable?: boolean;
  onDragStart?: () => void;
}

export default function TaskCard({ task, isTop3Today, onToggleComplete, onToggleTop3, onDelete, draggable, onDragStart }: TaskCardProps) {
  return (
    <div className="task-card" draggable={draggable} onDragStart={onDragStart}>
      <button
        type="button"
        className={"task-card-check" + (task.status === "completed" ? " done" : "")}
        onClick={onToggleComplete}
        aria-label="Toggle complete"
      />
      <div className="grow" style={{ minWidth: 0 }}>
        <span className={"task-card-title" + (task.status === "completed" ? " done" : "")}>{task.title}</span>
        <div className="task-card-meta">
          <span className={"badge badge-" + PRIORITY_CLASS[task.priority]}>{task.priority}</span>
          {task.dueDate && (
            <span className="task-card-due">
              <Clock size={11} /> {formatShort(task.dueDate)}
            </span>
          )}
        </div>
      </div>
      <button
        type="button"
        className={"btn btn-icon task-card-star" + (isTop3Today ? " active" : "")}
        onClick={onToggleTop3}
        aria-label="Toggle top 3"
        title="Add to today's Top 3"
      >
        <Star size={14} fill={isTop3Today ? "currentColor" : "none"} />
      </button>
      <button type="button" className="btn btn-icon" onClick={onDelete} aria-label="Delete task">
        <Trash2 size={14} />
      </button>
    </div>
  );
}
