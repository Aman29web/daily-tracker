import { useState } from "react";
import { Layers, Plus, Copy, Archive, Play, Pause, Palmtree } from "lucide-react";
import { useForm } from "react-hook-form";
import { usePlans, useCreatePlan, usePlanActions, useCreatePause, usePauses } from "../plans/hooks";
import DynamicIcon from "../../components/ui/DynamicIcon";
import Modal from "../../components/ui/Modal";
import EmptyState from "../../components/ui/EmptyState";
import Skeleton from "../../components/ui/Skeleton";
import { todayStr } from "../../utils/date";
import { HABIT_COLORS, HABIT_ICONS } from "../../constants/habitOptions";
import "./PlansPage.css";

export default function PlansPage() {
  const { data: plans, isLoading } = usePlans({ isArchived: false });
  const { data: pauses } = usePauses();
  const create = useCreatePlan();
  const { activate, deactivate, archive, duplicate } = usePlanActions();
  const createPause = useCreatePause();
  const [createOpen, setCreateOpen] = useState(false);
  const [pausingPlanId, setPausingPlanId] = useState<string | null>(null);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { name: "", description: "", category: "general", icon: HABIT_ICONS[0], color: HABIT_COLORS[0] },
  });

  return (
    <div className="plans-page">
      <div className="page-header">
        <div>
          <h1>Plans</h1>
          <p>Bundles of habits built around a goal or lifestyle.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)} type="button">
          <Plus size={16} /> New plan
        </button>
      </div>

      {isLoading && (
        <div className="stack" style={{ gap: 14 }}>
          <Skeleton height={110} radius={16} />
          <Skeleton height={110} radius={16} />
        </div>
      )}

      {!isLoading && plans?.length === 0 && (
        <div className="card card-pad">
          <EmptyState icon={Layers} title="No plans yet" description="Bundle related habits into a plan, like Fitness or Deep Work." />
        </div>
      )}

      <div className="plans-grid">
        {plans?.map((plan) => {
          const activePause = (pauses ?? []).find((p) => p.planId === plan._id && p.isActive);
          return (
            <div className="card card-pad plan-card" key={plan._id}>
              <div className="plan-card-header">
                <div className="plan-card-icon" style={{ background: `${plan.color}22`, color: plan.color }}>
                  <DynamicIcon name={plan.icon} size={18} />
                </div>
                <div className="grow">
                  <h3>{plan.name}</h3>
                  <span>{plan.habitCount ?? 0} habits</span>
                </div>
                {plan.isActive ? <span className="badge badge-success">Active</span> : <span className="badge badge-neutral">Inactive</span>}
              </div>
              {plan.description && <p className="plan-card-desc">{plan.description}</p>}
              {activePause && (
                <div className="plan-card-vacation">
                  <Palmtree size={13} /> Paused until {activePause.endDate}
                </div>
              )}
              <div className="plan-card-actions">
                {plan.isActive ? (
                  <button className="btn btn-secondary btn-sm" onClick={() => deactivate.mutate(plan._id)} type="button">
                    <Pause size={13} /> Deactivate
                  </button>
                ) : (
                  <button className="btn btn-secondary btn-sm" onClick={() => activate.mutate(plan._id)} type="button">
                    <Play size={13} /> Activate
                  </button>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => setPausingPlanId(plan._id)} type="button">
                  <Palmtree size={13} /> Pause
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => duplicate.mutate(plan._id)} type="button">
                  <Copy size={13} /> Duplicate
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => archive.mutate(plan._id)} type="button">
                  <Archive size={13} /> Archive
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New plan">
        <form
          className="stack"
          style={{ gap: 14 }}
          onSubmit={handleSubmit(async (values) => {
            await create.mutateAsync(values);
            reset();
            setCreateOpen(false);
          })}
        >
          <div className="field">
            <label>Name</label>
            <input className="input" autoFocus placeholder="e.g. Fitness Plan" {...register("name", { required: true })} />
          </div>
          <div className="field">
            <label>Description (optional)</label>
            <textarea className="textarea" rows={2} {...register("description")} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={create.isPending}>
            {create.isPending ? "Creating…" : "Create plan"}
          </button>
        </form>
      </Modal>

      <Modal open={!!pausingPlanId} onClose={() => setPausingPlanId(null)} title="Pause plan (vacation mode)">
        {pausingPlanId && (
          <PlanPauseForm
            planId={pausingPlanId}
            onDone={() => setPausingPlanId(null)}
            createPause={createPause}
          />
        )}
      </Modal>
    </div>
  );
}

function PlanPauseForm({
  planId,
  onDone,
  createPause,
}: {
  planId: string;
  onDone: () => void;
  createPause: ReturnType<typeof useCreatePause>;
}) {
  const [startDate, setStartDate] = useState(todayStr());
  const [endDate, setEndDate] = useState(todayStr());

  return (
    <div className="stack" style={{ gap: 14 }}>
      <p className="habit-detail-hint">
        Every habit in this plan will be marked paused for the range you choose. Streaks are protected and no reminders fire.
      </p>
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
      <button
        className="btn btn-primary"
        type="button"
        disabled={createPause.isPending}
        onClick={async () => {
          await createPause.mutateAsync({ planId, startDate, endDate });
          onDone();
        }}
      >
        {createPause.isPending ? "Scheduling…" : "Pause plan"}
      </button>
    </div>
  );
}
