import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Repeat, CheckSquare, BookOpen, Target, Timer } from "lucide-react";
import { useUiStore } from "../../stores/uiStore";
import { useClickOutside } from "../../hooks/useClickOutside";
import "./QuickAddButton.css";

const OPTIONS = [
  { kind: "habit" as const, label: "Habit", icon: Repeat },
  { kind: "task" as const, label: "Task", icon: CheckSquare },
  { kind: "goal" as const, label: "Goal", icon: Target },
  { kind: "journal" as const, label: "Journal", icon: BookOpen },
  { kind: "focus" as const, label: "Focus session", icon: Timer },
];

export default function QuickAddButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const openQuickAdd = useUiStore((s) => s.openQuickAdd);
  useClickOutside(ref, () => setOpen(false), open);

  return (
    <div className="quick-add-wrap" ref={ref}>
      <button className="btn btn-primary quick-add-btn" onClick={() => setOpen((v) => !v)} type="button">
        <Plus size={16} />
        <span className="quick-add-label">Quick add</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="quick-add-menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
          >
            {OPTIONS.map((opt) => (
              <button
                key={opt.kind}
                className="quick-add-item"
                type="button"
                onClick={() => {
                  setOpen(false);
                  openQuickAdd(opt.kind);
                }}
              >
                <opt.icon size={15} />
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
