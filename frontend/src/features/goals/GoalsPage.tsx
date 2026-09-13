import { useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, Target, TrendingUp, TrendingDown, Trash2, Trophy } from "lucide-react";
import { useGoals, useCreateGoal, useUpdateGoalProgress, useDeleteGoal } from "./hooks";
import Modal from "../../components/ui/Modal";
import EmptyState from "../../components/ui/EmptyState";
import Skeleton from "../../components/ui/Skeleton";
import ProgressRing from "../../components/ui/ProgressRing";
import { formatShort } from "../../utils/date";
import { GoalStatus } from "../../types";
import "./GoalsPage.css";

export default function GoalsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [tab, setTab] = useState<GoalStatus>("active");
  const { data: goals, isLoading } = useGoals({ status: tab });
  const create = useCreateGoal();
  const updateProgress = useUpdateGoalProgress();
  const remove = useDeleteGoal();

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { title: "", targetValue: 10, unit: "hours", deadline: "", description: "" },
  });

  return (
    <div className="goals-page">
      <div className="page-header">
        <div>
          <h1>Goals</h1>
          <p>Give your daily effort a direction.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)} type="button">
          <Plus size={16} /> New goal
        </button>
      </div>

      <div className="segmented" style={{ marginBottom: 18 }}>
        <label className={tab === "active" ? "active" : ""}>
          <input type="radio" checked={tab === "active"} onChange={() => setTab("active")} className="visually-hidden" />
          Active
        </label>
        <label className={tab === "completed" ? "active" : ""}>
          <input type="radio" checked={tab === "completed"} onChange={() => setTab("completed")} className="visually-hidden" />
          Completed
        </label>
        <label className={tab === "abandoned" ? "active" : ""}>
          <input type="radio" checked={tab === "abandoned"} onChange={() => setTab("abandoned")} className="visually-hidden" />
          Abandoned
        </label>
      </div>

      {isLoading && (
        <div className="goals-grid">
          <Skeleton height={220} radius={18} />
          <Skeleton height={220} radius={18} />
        </div>
      )}

      {!isLoading && goals?.length === 0 && (
        <div className="card card-pad">
          {tab === "active" ? (
            <EmptyState icon={Target} title="Give your effort a direction." description="Set a goal to connect daily habits to something bigger." />
          ) : tab === "completed" ? (
            <EmptyState icon={Trophy} title="No completed goals yet." description="Finished goals will show up here to celebrate the win." />
          ) : (
            <EmptyState icon={Target} title="No abandoned goals." description="Goals you give up on will show up here." />
          )}
        </div>
      )}

      <div className="goals-grid">
        {goals?.map((goal) => {
          const pct = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
          const pace = goal.pace;
          const isCompleted = goal.status === "completed";
          return (
            <div className={"card card-pad goal-card" + (isCompleted ? " goal-card-completed" : "")} key={goal._id}>
              <div className="goal-card-header">
                <div>
                  <h3>{goal.title}</h3>
                  {isCompleted && goal.completedAt ? (
                    <span className="goal-card-deadline goal-card-completed-date">
                      <Trophy size={11} /> Completed {formatShort(goal.completedAt.slice(0, 10))}
                    </span>
                  ) : (
                    goal.deadline && <span className="goal-card-deadline">Due {formatShort(goal.deadline)}</span>
                  )}
                </div>
                <button className="btn btn-icon" onClick={() => remove.mutate(goal._id)} type="button" aria-label="Delete goal">
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="goal-card-body">
                <ProgressRing
                  value={pct}
                  size={84}
                  strokeWidth={8}
                  color={isCompleted ? "var(--success-500)" : undefined}
                  label={
                    isCompleted ? (
                      <Trophy size={22} color="var(--success-500)" />
                    ) : (
                      <strong style={{ fontSize: 15, fontWeight: 800 }}>{pct}%</strong>
                    )
                  }
                />
                <div className="goal-card-numbers">
                  <strong>
                    {goal.currentValue} / {goal.targetValue}
                  </strong>
                  <span>{goal.unit}</span>
                  {!isCompleted && pace && (
                    <div className={"goal-pace" + (pace.onTrack === false ? " off-track" : pace.onTrack === true ? " on-track" : "")}>
                      {pace.onTrack === false ? <TrendingDown size={13} /> : <TrendingUp size={13} />}
                      {pace.onTrack === false
                        ? "Behind pace"
                        : pace.onTrack === true
                        ? "On track"
                        : `${pace.currentPacePerDay.toFixed(1)}/day`}
                    </div>
                  )}
                </div>
              </div>

              {!isCompleted && goal.progressSource === "manual" && (
                <div className="goal-card-actions">
                  <button
                    className="btn btn-secondary btn-sm"
                    type="button"
                    onClick={() => updateProgress.mutate({ id: goal._id, currentValue: Math.max(0, goal.currentValue - 1) })}
                  >
                    −1
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    type="button"
                    onClick={() => updateProgress.mutate({ id: goal._id, currentValue: goal.currentValue + 1 })}
                  >
                    +1 {goal.unit}
                  </button>
                </div>
              )}
              {!isCompleted && goal.progressSource !== "manual" && (
                <p className="goal-card-auto-note">Progress updates automatically from your {goal.progressSource.replace("_", " ")}.</p>
              )}
            </div>
          );
        })}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New goal">
        <form
          className="stack"
          style={{ gap: 14 }}
          onSubmit={handleSubmit(async (values) => {
            await create.mutateAsync({ ...values, deadline: values.deadline || undefined, targetValue: Number(values.targetValue) });
            reset();
            setCreateOpen(false);
          })}
        >
          <div className="field">
            <label>Title</label>
            <input className="input" autoFocus placeholder="e.g. Master system design" {...register("title", { required: true })} />
          </div>
          <div className="field">
            <label>Description (optional)</label>
            <textarea className="textarea" rows={2} {...register("description")} />
          </div>
          <div className="two-col-inline">
            <div className="field">
              <label>Target</label>
              <input className="input" type="number" {...register("targetValue", { valueAsNumber: true })} />
            </div>
            <div className="field">
              <label>Unit</label>
              <input className="input" placeholder="hours, sessions…" {...register("unit")} />
            </div>
          </div>
          <div className="field">
            <label>Deadline (optional)</label>
            <input className="input" type="date" {...register("deadline")} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={create.isPending}>
            {create.isPending ? "Adding…" : "Create goal"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
