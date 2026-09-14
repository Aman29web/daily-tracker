import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Repeat, Search, ChevronRight } from "lucide-react";
import { useHabits, useCreateHabit, useCheckIn, toCreateInput } from "./hooks";
import HabitCheckItem from "./HabitCheckItem";
import HabitForm from "./HabitForm";
import Modal from "../../components/ui/Modal";
import EmptyState from "../../components/ui/EmptyState";
import Skeleton from "../../components/ui/Skeleton";
import { todayStr } from "../../utils/date";
import { HabitWithStats } from "../../types";
import "./HabitsPage.css";

export default function HabitsPage() {
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const { data: habits, isLoading } = useHabits(showInactive ? undefined : { isActive: true });
  const create = useCreateHabit();

  const filtered = (habits ?? []).filter((h) => h.habit.name.toLowerCase().includes(search.toLowerCase()));
  const grouped = groupByCategory(filtered);

  return (
    <div className="habits-page">
      <div className="page-header">
        <div>
          <h1>Habits</h1>
          <p>Everything you're building, day by day.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)} type="button">
          <Plus size={16} /> New habit
        </button>
      </div>

      <div className="habits-toolbar">
        <div className="habits-search">
          <Search size={15} />
          <input placeholder="Search habits…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <label className="habits-toggle">
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
          Show inactive
        </label>
      </div>

      {isLoading && (
        <div className="stack" style={{ gap: 14 }}>
          <Skeleton height={90} radius={16} />
          <Skeleton height={90} radius={16} />
          <Skeleton height={90} radius={16} />
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="card card-pad">
          <EmptyState
            icon={Repeat}
            title="Your first habit starts here."
            description="Create a habit, set a flexible schedule, and start building your streak."
            action={
              <button className="btn btn-primary btn-sm" onClick={() => setCreateOpen(true)} type="button">
                Create habit
              </button>
            }
          />
        </div>
      )}

      {!isLoading &&
        Object.entries(grouped).map(([category, items]) => (
          <section key={category} className="card card-pad habits-category-card">
            <h3 className="habits-category-title">{category}</h3>
            <div className="stack">
              {items.map((item) => (
                <HabitRow key={item.habit._id} item={item} />
              ))}
            </div>
          </section>
        ))}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New habit" width={560}>
        <HabitForm
          submitting={create.isPending}
          onSubmit={async (values) => {
            await create.mutateAsync(toCreateInput(values));
            setCreateOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}

function groupByCategory(items: HabitWithStats[]): Record<string, HabitWithStats[]> {
  return items.reduce<Record<string, HabitWithStats[]>>((acc, item) => {
    const key = item.habit.category || "general";
    acc[key] = acc[key] ? [...acc[key], item] : [item];
    return acc;
  }, {});
}

function HabitRow({ item }: { item: HabitWithStats }) {
  const { habit, today: todayStatus, streak } = item;
  const checkIn = useCheckIn(habit._id);
  const today = todayStr();

  return (
    <div className="habits-row">
      <HabitCheckItem
        item={{
          id: habit._id,
          name: habit.name,
          icon: habit.icon,
          color: habit.color,
          type: habit.type,
          priority: habit.priority,
          status: todayStatus.status,
          value: todayStatus.value,
          targetValue: todayStatus.targetValue ?? habit.target?.value,
          unit: habit.target?.unit,
          streak: streak.current,
        }}
        onComplete={() => checkIn.mutate({ date: today, action: "complete" })}
        onUndo={() => checkIn.mutate({ date: today, action: "undo" })}
        onSkip={() => checkIn.mutate({ date: today, action: "skip" })}
        onMiss={() => checkIn.mutate({ date: today, action: "miss" })}
        onIncrement={(delta) => checkIn.mutate({ date: today, action: "increment", value: delta })}
      />
      <Link to={`/habits/${habit._id}`} className="habits-row-detail-link" aria-label={`Open ${habit.name} details`}>
        <ChevronRight size={16} />
      </Link>
    </div>
  );
}
