import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Play, Pause, Square, CheckCircle2, Timer as TimerIcon } from "lucide-react";
import { useActiveFocusSession, useFocusActions, useFocusSessions, useStartFocus } from "./hooks";
import { useTasks } from "../tasks/hooks";
import ProgressRing from "../../components/ui/ProgressRing";
import EmptyState from "../../components/ui/EmptyState";
import { formatMinutes, todayStr } from "../../utils/date";
import "./FocusPage.css";

export default function FocusPage() {
  const { data: active, isLoading } = useActiveFocusSession();
  const { data: todaysSessions } = useFocusSessions({ start: todayStr(), end: todayStr(), limit: 20 });

  const todayMinutes = (todaysSessions ?? []).filter((s) => s.status === "completed").reduce((sum, s) => sum + s.actualDuration, 0);

  return (
    <div className="focus-page">
      <div className="page-header">
        <div>
          <h1>Focus</h1>
          <p>Deep work, timed.</p>
        </div>
        <div className="focus-today-total">
          <TimerIcon size={14} /> {formatMinutes(todayMinutes)} focused today
        </div>
      </div>

      <div className="card card-pad focus-main-card">
        {isLoading ? null : active ? <ActiveSession session={active} /> : <StartSession />}
      </div>

      <section className="card card-pad">
        <h3 className="habit-detail-section-title">Today's sessions</h3>
        {!todaysSessions?.length ? (
          <EmptyState icon={TimerIcon} title="No sessions yet" description="Start a focus session above to begin tracking deep work." />
        ) : (
          <div className="stack" style={{ gap: 8 }}>
            {todaysSessions.map((s) => (
              <div key={s._id} className="focus-session-row">
                <span className={"badge badge-" + (s.status === "completed" ? "success" : s.status === "cancelled" ? "danger" : "neutral")}>
                  {s.status}
                </span>
                <span className="grow">{s.category}</span>
                <span>{formatMinutes(s.actualDuration)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StartSession() {
  const start = useStartFocus();
  const { data: tasks } = useTasks({ status: "todo", limit: 50 });
  const [duration, setDuration] = useState<"25" | "50" | "custom">("25");
  const [customMinutes, setCustomMinutes] = useState(35);
  const { register, handleSubmit } = useForm({ defaultValues: { taskId: "", category: "general" } });

  const plannedDuration = duration === "custom" ? customMinutes : Number(duration);

  return (
    <form
      className="focus-start"
      onSubmit={handleSubmit(async (values) => {
        await start.mutateAsync({
          mode: duration,
          plannedDuration,
          taskId: values.taskId || null,
          category: values.category || "general",
        });
      })}
    >
      <ProgressRing
        value={0}
        size={180}
        strokeWidth={12}
        label={
          <>
            <strong style={{ fontSize: 34, fontWeight: 800 }}>{plannedDuration}</strong>
            <span style={{ fontSize: 12, color: "var(--text-tertiary)", fontWeight: 600 }}>minutes</span>
          </>
        }
      />

      <div className="focus-duration-picker">
        {(["25", "50", "custom"] as const).map((d) => (
          <button key={d} type="button" className={"focus-duration-btn" + (duration === d ? " active" : "")} onClick={() => setDuration(d)}>
            {d === "custom" ? "Custom" : `${d} min`}
          </button>
        ))}
      </div>

      {duration === "custom" && (
        <input
          type="range"
          min={5}
          max={120}
          step={5}
          value={customMinutes}
          onChange={(e) => setCustomMinutes(Number(e.target.value))}
          className="focus-slider"
        />
      )}

      <div className="focus-options">
        <select className="select" {...register("taskId")}>
          <option value="">No linked task</option>
          {tasks?.map((t) => (
            <option key={t._id} value={t._id}>
              {t.title}
            </option>
          ))}
        </select>
        <input className="input" placeholder="Category (e.g. deep-work)" {...register("category")} />
      </div>

      <button className="btn btn-primary" type="submit" disabled={start.isPending}>
        <Play size={16} /> Start focus session
      </button>
    </form>
  );
}

function ActiveSession({ session }: { session: NonNullable<ReturnType<typeof useActiveFocusSession>["data"]> }) {
  const { pause, resume, complete, cancel } = useFocusActions();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    function computeElapsed() {
      const baseMinutes = session.actualDuration;
      const runningExtra =
        session.status === "running" && session.lastResumedAt
          ? (Date.now() - new Date(session.lastResumedAt).getTime()) / 1000
          : 0;
      return Math.floor(baseMinutes * 60 + runningExtra);
    }
    setElapsedSeconds(computeElapsed());
    if (session.status !== "running") return;
    const id = setInterval(() => setElapsedSeconds(computeElapsed()), 1000);
    return () => clearInterval(id);
  }, [session]);

  const plannedSeconds = session.plannedDuration * 60;
  const pct = Math.min(100, Math.round((elapsedSeconds / plannedSeconds) * 100));
  const mm = String(Math.floor(elapsedSeconds / 60)).padStart(2, "0");
  const ss = String(elapsedSeconds % 60).padStart(2, "0");

  return (
    <div className="focus-active">
      <ProgressRing
        value={pct}
        size={220}
        strokeWidth={14}
        color={session.status === "running" ? "var(--primary-500)" : "var(--warning-500)"}
        label={
          <>
            <strong style={{ fontSize: 40, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
              {mm}:{ss}
            </strong>
            <span style={{ fontSize: 12, color: "var(--text-tertiary)", fontWeight: 600, textTransform: "capitalize" }}>
              {session.status}
            </span>
          </>
        }
      />
      <div className="focus-active-controls">
        {session.status === "running" ? (
          <button className="btn btn-secondary" type="button" onClick={() => pause.mutate(session._id)}>
            <Pause size={16} /> Pause
          </button>
        ) : (
          <button className="btn btn-secondary" type="button" onClick={() => resume.mutate(session._id)}>
            <Play size={16} /> Resume
          </button>
        )}
        <button className="btn btn-primary" type="button" onClick={() => complete.mutate(session._id)}>
          <CheckCircle2 size={16} /> Complete
        </button>
        <button className="btn btn-ghost" type="button" onClick={() => cancel.mutate(session._id)}>
          <Square size={16} /> Cancel
        </button>
      </div>
    </div>
  );
}
