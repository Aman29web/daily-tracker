import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import Modal from "../../components/ui/Modal";
import { useUiStore } from "../../stores/uiStore";
import HabitForm from "../habits/HabitForm";
import { toCreateInput, useCreateHabit } from "../habits/hooks";
import { useCreateTask } from "../tasks/hooks";
import { useCreateGoal } from "../goals/hooks";
import { useUpsertJournal } from "../journal/hooks";
import { useStartFocus } from "../focus/hooks";
import { todayStr } from "../../utils/date";

const TITLES: Record<string, string> = {
  habit: "New habit",
  task: "New task",
  journal: "Today's journal",
  goal: "New goal",
  focus: "Start focus session",
};

export default function QuickAddModal() {
  const kind = useUiStore((s) => s.quickAddKind);
  const close = useUiStore((s) => s.closeQuickAdd);

  return (
    <Modal open={!!kind} onClose={close} title={kind ? TITLES[kind] : undefined} width={kind === "habit" ? 560 : 460}>
      {kind === "habit" && <QuickHabitForm />}
      {kind === "task" && <QuickTaskForm />}
      {kind === "goal" && <QuickGoalForm />}
      {kind === "journal" && <QuickJournalForm />}
      {kind === "focus" && <QuickFocusForm />}
    </Modal>
  );
}

function QuickHabitForm() {
  const close = useUiStore((s) => s.closeQuickAdd);
  const create = useCreateHabit();
  return (
    <HabitForm
      submitting={create.isPending}
      onSubmit={async (values) => {
        await create.mutateAsync(toCreateInput(values));
        close();
      }}
    />
  );
}

function QuickTaskForm() {
  const close = useUiStore((s) => s.closeQuickAdd);
  const create = useCreateTask();
  const { register, handleSubmit } = useForm({
    defaultValues: { title: "", priority: "medium" as const, dueDate: todayStr() },
  });

  return (
    <form
      className="stack"
      style={{ gap: 14 }}
      onSubmit={handleSubmit(async (values) => {
        await create.mutateAsync(values);
        close();
      })}
    >
      <div className="field">
        <label>Title</label>
        <input className="input" autoFocus placeholder="What needs to get done?" {...register("title", { required: true })} />
      </div>
      <div className="two-col-inline">
        <div className="field">
          <label>Priority</label>
          <select className="select" {...register("priority")}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div className="field">
          <label>Due date</label>
          <input className="input" type="date" {...register("dueDate")} />
        </div>
      </div>
      <button className="btn btn-primary" type="submit" disabled={create.isPending}>
        {create.isPending ? "Adding…" : "Add task"}
      </button>
    </form>
  );
}

function QuickGoalForm() {
  const close = useUiStore((s) => s.closeQuickAdd);
  const create = useCreateGoal();
  const { register, handleSubmit } = useForm({
    defaultValues: { title: "", targetValue: 10, unit: "hours", deadline: "" },
  });

  return (
    <form
      className="stack"
      style={{ gap: 14 }}
      onSubmit={handleSubmit(async (values) => {
        await create.mutateAsync({ ...values, deadline: values.deadline || undefined, targetValue: Number(values.targetValue) });
        close();
      })}
    >
      <div className="field">
        <label>Title</label>
        <input className="input" autoFocus placeholder="e.g. Master system design" {...register("title", { required: true })} />
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
        {create.isPending ? "Adding…" : "Add goal"}
      </button>
    </form>
  );
}

function QuickJournalForm() {
  const close = useUiStore((s) => s.closeQuickAdd);
  const upsert = useUpsertJournal();
  const { register, handleSubmit } = useForm({
    defaultValues: { wentWell: "", learned: "" },
  });

  return (
    <form
      className="stack"
      style={{ gap: 14 }}
      onSubmit={handleSubmit(async (values) => {
        await upsert.mutateAsync({ date: todayStr(), ...values });
        close();
      })}
    >
      <div className="field">
        <label>What went well today?</label>
        <textarea className="textarea" rows={3} autoFocus {...register("wentWell")} />
      </div>
      <div className="field">
        <label>What did you learn?</label>
        <textarea className="textarea" rows={3} {...register("learned")} />
      </div>
      <button className="btn btn-primary" type="submit" disabled={upsert.isPending}>
        {upsert.isPending ? "Saving…" : "Save entry"}
      </button>
    </form>
  );
}

function QuickFocusForm() {
  const close = useUiStore((s) => s.closeQuickAdd);
  const start = useStartFocus();
  const navigate = useNavigate();
  const [duration, setDuration] = useState<25 | 50>(25);

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="field">
        <label>Session length</label>
        <div className="segmented">
          <label className={duration === 25 ? "active" : ""}>
            <input type="radio" checked={duration === 25} onChange={() => setDuration(25)} className="visually-hidden" />
            25 min
          </label>
          <label className={duration === 50 ? "active" : ""}>
            <input type="radio" checked={duration === 50} onChange={() => setDuration(50)} className="visually-hidden" />
            50 min
          </label>
        </div>
      </div>
      <button
        className="btn btn-primary"
        type="button"
        disabled={start.isPending}
        onClick={async () => {
          await start.mutateAsync({ mode: String(duration) as "25" | "50", plannedDuration: duration, category: "general" });
          close();
          navigate("/focus");
        }}
      >
        {start.isPending ? "Starting…" : "Start session"}
      </button>
    </div>
  );
}
