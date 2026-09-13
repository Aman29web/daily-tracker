import { motion } from "framer-motion";
import { Lock, X } from "lucide-react";
import Modal from "../../components/ui/Modal";
import { JournalEntry, Mood } from "../../types";
import { formatPretty } from "../../utils/date";
import "./JournalEntryModal.css";

const MOOD_EMOJI: Record<Mood, string> = {
  great: "😄",
  good: "🙂",
  okay: "😐",
  bad: "😞",
  terrible: "😔",
};

const FIELDS: { key: keyof JournalEntry; label: string }[] = [
  { key: "content", label: "About the day" },
  { key: "wentWell", label: "What went well" },
  { key: "wentWrong", label: "What went wrong" },
  { key: "learned", label: "What I learned" },
  { key: "improveTomorrow", label: "Tomorrow, I'll..." },
];

interface JournalEntryModalProps {
  entry: JournalEntry | null;
  isToday: boolean;
  onClose: () => void;
}

export default function JournalEntryModal({ entry, isToday, onClose }: JournalEntryModalProps) {
  return (
    <Modal open={!!entry} onClose={onClose} width={580}>
      {entry && (
        <motion.div
          className="diary-modal-page"
          initial={{ opacity: 0, rotateY: -12, scale: 0.97 }}
          animate={{ opacity: 1, rotateY: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformPerspective: 1400, transformOrigin: "left center" }}
        >
          <button className="diary-modal-close" onClick={onClose} type="button" aria-label="Close">
            <X size={16} />
          </button>

          <div className="diary-modal-date">
            <strong>{isToday ? "Today" : formatPretty(entry.date)}</strong>
            {!isToday && <span>{formatPretty(entry.date)}</span>}
          </div>

          {!isToday && (
            <div className="journal-detail-locked-note">
              <Lock size={12} /> This page is sealed — entries can only be edited on the day they're written.
            </div>
          )}

          {(entry.mood || entry.energy !== undefined) && (
            <div className="journal-detail-mood">
              {entry.mood && (
                <span>
                  {MOOD_EMOJI[entry.mood]} {entry.mood}
                </span>
              )}
              {entry.energy !== undefined && <span>⚡ {entry.energy}% energy</span>}
            </div>
          )}

          <div className="diary-modal-body">
            {FIELDS.map(({ key, label }, idx) => {
              const value = entry[key];
              if (!value || typeof value !== "string") return null;
              return (
                <motion.div
                  key={key}
                  className="journal-detail-field"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + idx * 0.06 }}
                >
                  <h4>{label}</h4>
                  <p>{value}</p>
                </motion.div>
              );
            })}
          </div>

          {entry.tags.length > 0 && (
            <div className="journal-detail-tags">
              {entry.tags.map((tag) => (
                <span key={tag} className="badge badge-neutral">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {FIELDS.every(({ key }) => !entry[key]) && (
            <p className="journal-detail-empty">No written reflection for this day — just a mood check-in.</p>
          )}
        </motion.div>
      )}
    </Modal>
  );
}
