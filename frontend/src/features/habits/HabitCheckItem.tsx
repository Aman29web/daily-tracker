import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, MoreHorizontal, Minus, Plus, SkipForward, X, Flame } from "lucide-react";
import DynamicIcon from "../../components/ui/DynamicIcon";
import { useClickOutside } from "../../hooks/useClickOutside";
import { DayStatus, HabitType, Priority } from "../../types";
import "./HabitCheckItem.css";

export interface HabitCheckItemData {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: HabitType;
  priority: Priority;
  status: DayStatus;
  value?: number;
  targetValue?: number;
  unit?: string;
  streak?: number;
}

interface HabitCheckItemProps {
  item: HabitCheckItemData;
  onComplete: () => void;
  onUndo: () => void;
  onSkip: () => void;
  onMiss: () => void;
  onIncrement: (delta: number) => void;
  disabled?: boolean;
}

const STATUS_LABEL: Partial<Record<DayStatus, string>> = {
  paused: "Paused",
  rest_day: "Rest day",
  not_scheduled: "Flexible",
  skipped: "Skipped",
  missed: "Missed",
};

export default function HabitCheckItem({ item, onComplete, onUndo, onSkip, onMiss, onIncrement, disabled }: HabitCheckItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setMenuOpen(false), menuOpen);

  const isDone = item.status === "completed";
  const isInert = ["paused", "rest_day", "not_scheduled", "inactive", "upcoming"].includes(item.status);
  const canInteract = !disabled && !isInert;

  return (
    <div className={"habit-check-item" + (isInert ? " inert" : "")}>
      {item.type === "boolean" ? (
        <button
          type="button"
          className={"habit-check-circle" + (isDone ? " done" : "")}
          style={{ borderColor: isDone ? item.color : undefined, background: isDone ? item.color : undefined }}
          onClick={() => canInteract && (isDone ? onUndo() : onComplete())}
          disabled={!canInteract}
          aria-label={isDone ? "Mark not done" : "Mark done"}
        >
          <AnimatePresence mode="wait">
            {isDone ? (
              <motion.span key="check" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.18 }}>
                <Check size={15} color="#fff" strokeWidth={3} />
              </motion.span>
            ) : (
              <motion.span key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            )}
          </AnimatePresence>
        </button>
      ) : (
        <div className="habit-check-icon" style={{ background: `${item.color}22`, color: item.color }}>
          <DynamicIcon name={item.icon} size={16} />
        </div>
      )}

      <div className="habit-check-info">
        <span className="habit-check-name">{item.name}</span>
        {item.type === "numeric" ? (
          <div className="habit-check-progress">
            <div className="habit-check-progress-track">
              <motion.div
                className="habit-check-progress-fill"
                style={{ background: item.color }}
                initial={false}
                animate={{ width: `${Math.min(100, ((item.value ?? 0) / (item.targetValue || 1)) * 100)}%` }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <span className="habit-check-progress-label">
              {item.value ?? 0} / {item.targetValue} {item.unit}
            </span>
          </div>
        ) : (
          STATUS_LABEL[item.status] && <span className="habit-check-status">{STATUS_LABEL[item.status]}</span>
        )}
      </div>

      {!!item.streak && item.streak > 0 && (
        <span className="habit-check-streak">
          <Flame size={12} /> {item.streak}
        </span>
      )}

      {item.type === "numeric" && canInteract && (
        <div className="habit-check-stepper">
          <button type="button" className="btn-icon btn-sm" onClick={() => onIncrement(-1)} aria-label="Decrease">
            <Minus size={13} />
          </button>
          <button type="button" className="btn-icon btn-sm" onClick={() => onIncrement(1)} aria-label="Increase">
            <Plus size={13} />
          </button>
        </div>
      )}

      {item.type === "boolean" && canInteract && (
        <div className="habit-check-menu-wrap" ref={ref}>
          <button className="btn btn-icon" type="button" onClick={() => setMenuOpen((v) => !v)} aria-label="More actions">
            <MoreHorizontal size={16} />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                className="habit-check-menu"
                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={{ duration: 0.12 }}
              >
                <button type="button" onClick={() => (setMenuOpen(false), onSkip())}>
                  <SkipForward size={13} /> Skip today
                </button>
                <button type="button" onClick={() => (setMenuOpen(false), onMiss())}>
                  <X size={13} /> Mark missed
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
