import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Flame, Trophy, Palmtree, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useHabit, useCheckIn, useDeleteHabit, useUpdateHabitSchedule } from "./hooks";
import DynamicIcon from "../../components/ui/DynamicIcon";
import Modal from "../../components/ui/Modal";
import HabitCheckItem from "./HabitCheckItem";
import HabitHistoryStrip from "./HabitHistoryStrip";
import ScheduleEditor from "./ScheduleEditor";
import { describeSchedule } from "../../utils/scheduleLabel";
import { todayStr } from "../../utils/date";
import { usePauses, useCreatePause, useDeletePause, useEndPauseNow } from "../plans/hooks";
import { HabitSchedule } from "../../types";
import Skeleton from "../../components/ui/Skeleton";
import "./HabitDetailPage.css";

export default function HabitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useHabit(id);
  const checkIn = useCheckIn(id!);
  const deleteHabit = useDeleteHabit();
  const [scheduleEditOpen, setScheduleEditOpen] = useState(false);
  const [pauseModalOpen, setPauseModalOpen] = useState(false);

  if (isLoading || !data) {
    return (
      <div className="stack" style={{ gap: 16 }}>
        <Skeleton height={40} width={160} />
        <Skeleton height={140} radius={18} />
        <Skeleton height={140} radius={18} />
      </div>
    );
  }

  const { habit, today, streak } = data;
  const today_ = todayStr();

  return (
    <div className="habit-detail-page">
      <button className="btn btn-ghost btn-sm" onClick={() => navigate("/habits")} type="button">
        <ArrowLeft size={15} /> Back to habits
      </button>

      <div className="habit-detail-header">
        <div className="habit-detail-icon" style={{ background: `${habit.color}22`, color: habit.color }}>
          <DynamicIcon name={habit.icon} size={22} />
        </div>
        <div className="grow">
          <h1>{habit.name}</h1>
          {habit.description && <p>{habit.description}</p>}
          <div className="habit-detail-badges">
            <span className="badge badge-neutral">{habit.category}</span>
            <span className="badge badge-primary">{habit.priority} priority</span>
            {!habit.isActive && <span className="badge badge-danger">Inactive</span>}
          </div>
        </div>
        <button
          className="btn btn-icon"
          type="button"
          onClick={async () => {
            if (!confirm(`Delete "${habit.name}"? Historical check-ins are kept.`)) return;
            await deleteHabit.mutateAsync(habit._id);
            navigate("/habits");
          }}
          aria-label="Delete habit"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="habit-detail-stats">
        <div className="habit-stat-card">
          <Flame size={18} color="var(--warning-500)" />
          <div>
            <strong>{streak.current}</strong>
            <span>Current streak</span>
          </div>
        </div>
        <div className="habit-stat-card">
          <Trophy size={18} color="var(--primary-500)" />
          <div>
            <strong>{streak.longest}</strong>
            <span>Longest streak</span>
          </div>
        </div>
        <div className="habit-stat-card">
          <Palmtree size={18} color="var(--info-500)" />
          <div>
            <strong style={{ textTransform: "capitalize" }}>{today.status.replace("_", " ")}</strong>
            <span>Today</span>
          </div>
        </div>
      </div>

      <section className="card card-pad">
        <h3 className="habit-detail-section-title">Check in</h3>
        <HabitCheckItem
          item={{
            id: habit._id,
            name: habit.name,
            icon: habit.icon,
            color: habit.color,
            type: habit.type,
            priority: habit.priority,
            status: today.status,
            value: today.value,
            targetValue: today.targetValue,
            unit: habit.target?.unit,
            streak: streak.current,
          }}
          onComplete={() => checkIn.mutate({ date: today_, action: "complete" })}
          onUndo={() => checkIn.mutate({ date: today_, action: "undo" })}
          onSkip={() => checkIn.mutate({ date: today_, action: "skip" })}
          onMiss={() => checkIn.mutate({ date: today_, action: "miss" })}
          onIncrement={(delta) => checkIn.mutate({ date: today_, action: "increment", value: delta })}
        />
      </section>

      <section className="card card-pad">
        <div className="habit-detail-section-header">
          <h3 className="habit-detail-section-title">Schedule</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => setScheduleEditOpen(true)} type="button">
            <Pencil size={13} /> Edit
          </button>
        </div>
        <p className="habit-detail-schedule-desc">{describeSchedule(habit.scheduleHistory.at(-1)!.schedule)}</p>
        <p className="habit-detail-hint">
          Changing your schedule only affects days from today onward — your history stays exactly as it happened.
        </p>
      </section>

      <section className="card card-pad">
        <div className="habit-detail-section-header">
          <h3 className="habit-detail-section-title">Vacation mode</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => setPauseModalOpen(true)} type="button">
            Pause this habit
          </button>
        </div>
        <HabitPauses habitId={habit._id} />
      </section>

      <section className="card card-pad">
        <h3 className="habit-detail-section-title">Last 42 days</h3>
        <HabitHistoryStrip habitId={habit._id} />
        <div className="history-legend">
          <span>
            <i className="s-completed" /> Completed
          </span>
          <span>
            <i className="s-missed" /> Missed
          </span>
          <span>
            <i className="s-paused" /> Paused
          </span>
          <span>
            <i className="s-none" /> Not scheduled
          </span>
        </div>
      </section>

      <Modal open={scheduleEditOpen} onClose={() => setScheduleEditOpen(false)} title="Edit schedule" width={520}>
        <ScheduleEditModalBody habitId={habit._id} initial={habit.scheduleHistory.at(-1)!.schedule} onDone={() => setScheduleEditOpen(false)} />
      </Modal>

      <Modal open={pauseModalOpen} onClose={() => setPauseModalOpen(false)} title="Pause this habit">
        <PauseForm habitId={habit._id} onDone={() => setPauseModalOpen(false)} />
      </Modal>
    </div>
  );
}

function ScheduleEditModalBody({ habitId, initial, onDone }: { habitId: string; initial: HabitSchedule; onDone: () => void }) {
  const [schedule, setSchedule] = useState<HabitSchedule>(initial);
  const update = useUpdateHabitSchedule(habitId);

  return (
    <div className="stack" style={{ gap: 16 }}>
      <ScheduleEditor value={schedule} onChange={setSchedule} />
      <button
        className="btn btn-primary"
        type="button"
        disabled={update.isPending}
        onClick={async () => {
          await update.mutateAsync({ schedule });
          onDone();
        }}
      >
        {update.isPending ? "Saving…" : "Save schedule (effective today)"}
      </button>
    </div>
  );
}

function HabitPauses({ habitId }: { habitId: string }) {
  const { data: pauses } = usePauses();
  const endNow = useEndPauseNow();
  const remove = useDeletePause();
  const habitPauses = (pauses ?? []).filter((p) => p.habitId === habitId);

  if (!habitPauses.length) {
    return <p className="habit-detail-hint">No vacation windows scheduled for this habit.</p>;
  }

  return (
    <div className="stack" style={{ gap: 8 }}>
      {habitPauses.map((p) => (
        <div key={p._id} className="pause-row">
          <span>
            {p.startDate} → {p.endDate} {p.reason && `· ${p.reason}`}
          </span>
          <div className="row" style={{ gap: 6 }}>
            {p.isActive && (
              <button className="btn btn-secondary btn-sm" onClick={() => endNow.mutate(p._id)} type="button">
                Resume now
              </button>
            )}
            <button className="btn btn-ghost btn-sm" onClick={() => remove.mutate(p._id)} type="button">
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function PauseForm({ habitId, onDone }: { habitId: string; onDone: () => void }) {
  const [startDate, setStartDate] = useState(todayStr());
  const [endDate, setEndDate] = useState(todayStr());
  const [reason, setReason] = useState("");
  const create = useCreatePause();

  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className="two-col-inline">
        <div className="field">
          <label>Start date</label>
          <input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="field">
          <label>End date</label>
          <input className="input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>Reason (optional)</label>
        <input className="input" placeholder="e.g. Vacation" value={reason} onChange={(e) => setReason(e.target.value)} />
      </div>
      <button
        className="btn btn-primary"
        type="button"
        disabled={create.isPending}
        onClick={async () => {
          if (endDate < startDate) {
            toast.error("End date must be on or after start date");
            return;
          }
          await create.mutateAsync({ habitId, startDate, endDate, reason: reason || undefined });
          onDone();
        }}
      >
        {create.isPending ? "Scheduling…" : "Schedule pause"}
      </button>
    </div>
  );
}
