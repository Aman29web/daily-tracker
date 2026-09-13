import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Feather, Lock, Search, Trash2 } from "lucide-react";
import { useJournalByDate, useJournalEntries, useUpsertJournal, useDeleteJournal } from "./hooks";
import EmptyState from "../../components/ui/EmptyState";
import JournalEntryModal from "./JournalEntryModal";
import { formatPretty, todayStr } from "../../utils/date";
import { JournalEntry, Mood } from "../../types";
import "./JournalPage.css";

const MOODS: { value: Mood; emoji: string; label: string }[] = [
  { value: "great", emoji: "😄", label: "Great" },
  { value: "good", emoji: "🙂", label: "Good" },
  { value: "okay", emoji: "😐", label: "Okay" },
  { value: "bad", emoji: "😞", label: "Bad" },
  { value: "terrible", emoji: "😔", label: "Terrible" },
];

interface JournalFormValues {
  content: string;
  wentWell: string;
  wentWrong: string;
  learned: string;
  improveTomorrow: string;
  mood: Mood | "";
  energy: number;
}

export default function JournalPage() {
  const today = todayStr();
  const { data: todayEntry } = useJournalByDate(today);
  const upsert = useUpsertJournal();
  const remove = useDeleteJournal();
  const [search, setSearch] = useState("");
  const { data: entries } = useJournalEntries({ search: search || undefined });
  const [openEntry, setOpenEntry] = useState<JournalEntry | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const { register, handleSubmit, reset, watch, setValue } = useForm<JournalFormValues>({
    defaultValues: { content: "", wentWell: "", wentWrong: "", learned: "", improveTomorrow: "", mood: "", energy: 70 },
  });

  useEffect(() => {
    if (todayEntry) {
      reset({
        content: todayEntry.content ?? "",
        wentWell: todayEntry.wentWell ?? "",
        wentWrong: todayEntry.wentWrong ?? "",
        learned: todayEntry.learned ?? "",
        improveTomorrow: todayEntry.improveTomorrow ?? "",
        mood: todayEntry.mood ?? "",
        energy: todayEntry.energy ?? 70,
      });
    }
  }, [todayEntry, reset]);

  const mood = watch("mood");
  const energy = watch("energy");

  return (
    <div className="journal-page">
      <div className="journal-header">
        <div>
          <h1>Journal</h1>
          <span className="journal-header-script">Dear diary, today was...</span>
        </div>
        <motion.span
          className="journal-header-pen"
          initial={{ rotate: -8, y: -4, opacity: 0 }}
          animate={{ rotate: 0, y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <Feather size={26} />
        </motion.span>
      </div>

      <motion.div
        className="diary-book"
        initial={{ opacity: 0, y: 18, rotateX: -6 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformPerspective: 1200 }}
      >
        <div className="diary-page">
          <div className="diary-date-tab">
            <strong>{formatPretty(today)}</strong>
            <span>Today's page</span>
          </div>

          <form
            className="diary-form"
            onSubmit={handleSubmit(async (values) => {
              await upsert.mutateAsync({
                date: today,
                content: values.content,
                wentWell: values.wentWell,
                wentWrong: values.wentWrong,
                learned: values.learned,
                improveTomorrow: values.improveTomorrow,
                mood: values.mood || undefined,
                energy: values.mood ? values.energy : undefined,
              });
              setJustSaved(true);
              setTimeout(() => setJustSaved(false), 1600);
            })}
          >
            <div className="diary-mood-row">
              {MOODS.map((m) => (
                <motion.button
                  key={m.value}
                  type="button"
                  className="diary-mood-seal"
                  style={{
                    boxShadow: mood === m.value ? `0 0 0 2px var(--diary-accent), 0 4px 10px rgba(168,67,46,0.25)` : undefined,
                  }}
                  whileTap={{ scale: 0.88 }}
                  animate={mood === m.value ? { scale: [1, 1.18, 1] } : { scale: 1 }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => setValue("mood", m.value)}
                  title={m.label}
                >
                  <span>{m.emoji}</span>
                </motion.button>
              ))}
            </div>

            {mood && (
              <motion.div className="diary-energy-row" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                <span>⚡ {energy}%</span>
                <input type="range" min={0} max={100} {...register("energy", { valueAsNumber: true })} />
              </motion.div>
            )}

            <div className="diary-field">
              <label>About your day…</label>
              <textarea className="diary-textarea" rows={4} placeholder="Write freely — no one else will read this." {...register("content")} />
            </div>
            <div className="diary-field">
              <label>What went well?</label>
              <textarea className="diary-textarea" rows={2} {...register("wentWell")} />
            </div>
            <div className="diary-field">
              <label>What went wrong?</label>
              <textarea className="diary-textarea" rows={2} {...register("wentWrong")} />
            </div>
            <div className="diary-field">
              <label>What did I learn?</label>
              <textarea className="diary-textarea" rows={2} {...register("learned")} />
            </div>
            <div className="diary-field">
              <label>Tomorrow, I'll...</label>
              <textarea className="diary-textarea" rows={2} {...register("improveTomorrow")} />
            </div>

            <motion.button className="diary-save-btn" type="submit" disabled={upsert.isPending} whileTap={{ scale: 0.95 }}>
              <AnimatePresence mode="wait" initial={false}>
                {justSaved ? (
                  <motion.span key="saved" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    ✓ Sealed for today
                  </motion.span>
                ) : (
                  <motion.span key="save" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    {upsert.isPending ? "Writing…" : "Seal today's page"}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </form>
        </div>
      </motion.div>

      <section>
        <div className="journal-entries-header">
          <h3>Your pages</h3>
          <div className="journal-search">
            <Search size={13} />
            <input placeholder="Search entries…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {!entries?.length ? (
          <div className="card card-pad">
            <EmptyState icon={BookOpen} title="Write your first reflection." description="Your journal history will appear here." />
          </div>
        ) : (
          <div className="journal-entries-stack">
            {entries.map((entry, idx) => {
              const isToday = entry.date === today;
              const preview = entry.content || entry.wentWell || entry.learned || entry.wentWrong;
              return (
                <motion.button
                  key={entry._id}
                  className="journal-entry-card"
                  onClick={() => setOpenEntry(entry)}
                  type="button"
                  initial={{ opacity: 0, x: -10, rotate: idx % 2 === 0 ? -0.6 : 0.6 }}
                  animate={{ opacity: 1, x: 0, rotate: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(idx, 8) * 0.04, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -3, rotate: idx % 2 === 0 ? -0.8 : 0.8 }}
                >
                  <div className="journal-entry-header-row">
                    <strong>{isToday ? "Today" : formatPretty(entry.date)}</strong>
                    {entry.mood && <span>{MOODS.find((m) => m.value === entry.mood)?.emoji}</span>}
                    {!isToday && (
                      <span className="journal-entry-locked" title="Entries can only be edited on the day they were written">
                        <Lock size={11} /> Locked
                      </span>
                    )}
                    <span
                      className="btn btn-icon journal-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        remove.mutate(entry._id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          remove.mutate(entry._id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label="Delete entry"
                    >
                      <Trash2 size={13} />
                    </span>
                  </div>
                  {preview && <p>{preview}</p>}
                </motion.button>
              );
            })}
          </div>
        )}
      </section>

      <JournalEntryModal entry={openEntry} isToday={openEntry?.date === today} onClose={() => setOpenEntry(null)} />
    </div>
  );
}
