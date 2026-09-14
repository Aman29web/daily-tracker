import { Link } from "react-router-dom";
import { Flame, Timer, BookOpen, Target, ArrowRight, Smile, Repeat } from "lucide-react";
import { useDashboard } from "./hooks";
import HeroBanner from "./HeroBanner";
import ProgressRing from "../../components/ui/ProgressRing";
import Skeleton from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import HabitCheckItem from "../habits/HabitCheckItem";
import DailyAiCard from "./DailyAiCard";
import { useCheckIn } from "../habits/hooks";
import { formatMinutes, todayStr } from "../../utils/date";
import type { DashboardData } from "../../types";
import "./DashboardPage.css";

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();

  if (isLoading || !data) return <DashboardSkeleton />;

  return (
    <div className="dashboard-page">
      <HeroBanner
        message={data.hero.message}
        date={data.date}
        streak={data.streaks.longestActive}
        productivityScore={data.productivity.score}
      />

      <div className="dashboard-grid">
        <div className="dashboard-main stack" style={{ gap: 20 }}>
          <section className="card card-pad dashboard-progress-card">
            <div className="dashboard-progress-ring">
              <ProgressRing
                value={data.productivity.score}
                size={116}
                label={
                  <>
                    <strong style={{ fontSize: 26, fontWeight: 800 }}>{data.productivity.score}%</strong>
                    <span style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600 }}>Today</span>
                  </>
                }
              />
            </div>
            <div className="dashboard-progress-stats">
              <div className="dashboard-stat">
                <span className="dashboard-stat-icon habits">
                  <Repeat size={14} />
                </span>
                <div>
                  <strong>
                    {data.productivity.habits.completed}/{data.productivity.habits.scheduled}
                  </strong>
                  <span>Habits done</span>
                </div>
              </div>
              <div className="dashboard-stat">
                <span className="dashboard-stat-icon focus">
                  <Timer size={14} />
                </span>
                <div>
                  <strong>{formatMinutes(data.focusMinutes)}</strong>
                  <span>Focus time</span>
                </div>
              </div>
              <div className="dashboard-stat">
                <span className="dashboard-stat-icon streak">
                  <Flame size={14} />
                </span>
                <div>
                  <strong>{data.streaks.longestActive}</strong>
                  <span>Day streak</span>
                </div>
              </div>
              <div className="dashboard-stat">
                <span className="dashboard-stat-icon mood">
                  <Smile size={14} />
                </span>
                <div>
                  <strong>{data.mood ? data.mood.mood : "—"}</strong>
                  <span>Mood</span>
                </div>
              </div>
            </div>
          </section>

          <section className="card card-pad">
            <div className="dashboard-section-header">
              <h3>Today's habits</h3>
              <Link to="/habits" className="dashboard-section-link">
                View all <ArrowRight size={13} />
              </Link>
            </div>
            {data.habits.length === 0 ? (
              <EmptyState
                icon={Repeat}
                title="Your first habit starts here."
                description="Add a habit to start tracking real progress."
                action={
                  <Link to="/habits" className="btn btn-primary btn-sm">
                    Create habit
                  </Link>
                }
              />
            ) : (
              <div className="stack">
                {data.habits.map((h) => (
                  <DashboardHabitRow key={h.habit.id} habit={h} date={data.date} />
                ))}
              </div>
            )}
          </section>

          <section className="card card-pad">
            <div className="dashboard-section-header">
              <h3>Today's Top 3</h3>
              <Link to="/tasks" className="dashboard-section-link">
                Manage <ArrowRight size={13} />
              </Link>
            </div>
            {data.top3.length === 0 ? (
              <EmptyState icon={Target} title="No top priorities set" description="Pick your 3 most important tasks for today." />
            ) : (
              <ol className="dashboard-top3-list">
                {data.top3.map((t) => (
                  <li key={t._id} className={t.status === "completed" ? "done" : ""}>
                    <span>{t.title}</span>
                    {t.status === "completed" && <span className="badge badge-success">Done</span>}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <div className="dashboard-side stack" style={{ gap: 20 }}>
          <section className="card card-pad">
            <div className="dashboard-section-header">
              <h3>Goals</h3>
              <Link to="/goals" className="dashboard-section-link">
                View all <ArrowRight size={13} />
              </Link>
            </div>
            {data.goals.length === 0 ? (
              <EmptyState icon={Target} title="Give your effort a direction." description="Set a goal to connect your daily habits to something bigger." />
            ) : (
              <div className="stack" style={{ gap: 14 }}>
                {data.goals.map((g) => {
                  const pct = Math.min(100, Math.round((g.currentValue / g.targetValue) * 100));
                  return (
                    <div key={g._id}>
                      <div className="dashboard-goal-row">
                        <span>{g.title}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="habit-check-progress-track" style={{ maxWidth: "100%" }}>
                        <div className="habit-check-progress-fill" style={{ width: `${pct}%`, background: "var(--primary-500)" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="card card-pad dashboard-status-card">
            <div className="dashboard-status-row">
              <span className="dashboard-status-icon">
                <BookOpen size={15} />
              </span>
              <div>
                <strong>Journal</strong>
                <span>{data.journalCompleted ? "Completed today" : "Not written yet"}</span>
              </div>
              <Link to="/journal" className="btn btn-sm btn-secondary">
                {data.journalCompleted ? "View" : "Write"}
              </Link>
            </div>
            <div className="dashboard-status-row">
              <span className="dashboard-status-icon">
                <Timer size={15} />
              </span>
              <div>
                <strong>Focus</strong>
                <span>{formatMinutes(data.focusMinutes)} today</span>
              </div>
              <Link to="/focus" className="btn btn-sm btn-secondary">
                Start
              </Link>
            </div>
          </section>

          <DailyAiCard />
        </div>
      </div>
    </div>
  );
}

function DashboardHabitRow({ habit, date }: { habit: DashboardData["habits"][number]; date: string }) {
  const checkIn = useCheckIn(habit.habit.id);
  const today = todayStr();
  const effectiveDate = date || today;

  return (
    <HabitCheckItem
      item={{
        id: habit.habit.id,
        name: habit.habit.name,
        icon: habit.habit.icon,
        color: habit.habit.color,
        type: habit.habit.type,
        priority: habit.habit.priority,
        status: habit.status,
        value: habit.value,
        targetValue: habit.targetValue,
        streak: habit.streak,
      }}
      onComplete={() => checkIn.mutate({ date: effectiveDate, action: "complete" })}
      onUndo={() => checkIn.mutate({ date: effectiveDate, action: "undo" })}
      onSkip={() => checkIn.mutate({ date: effectiveDate, action: "skip" })}
      onMiss={() => checkIn.mutate({ date: effectiveDate, action: "miss" })}
      onIncrement={(delta) => checkIn.mutate({ date: effectiveDate, action: "increment", value: delta })}
    />
  );
}

function DashboardSkeleton() {
  return (
    <div className="dashboard-page">
      <Skeleton height={170} radius={24} style={{ marginBottom: 20 }} />
      <div className="dashboard-grid">
        <div className="dashboard-main stack" style={{ gap: 20 }}>
          <Skeleton height={140} radius={18} />
          <Skeleton height={220} radius={18} />
        </div>
        <div className="dashboard-side stack" style={{ gap: 20 }}>
          <Skeleton height={160} radius={18} />
          <Skeleton height={120} radius={18} />
        </div>
      </div>
    </div>
  );
}
