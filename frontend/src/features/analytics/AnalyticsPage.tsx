import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Lightbulb, Trophy, Flame, Clock, Sparkles } from "lucide-react";
import { useInsights, useMonthlyReport, useProductivityProfile, useWeeklyReport } from "./hooks";
import Skeleton from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import AIPanel from "./AIPanel";
import { formatMinutes, formatShort } from "../../utils/date";
import "./AnalyticsPage.css";

export default function AnalyticsPage() {
  const [range, setRange] = useState<"week" | "month">("week");
  const weekly = useWeeklyReport();
  const monthly = useMonthlyReport();
  const insights = useInsights();
  const profile = useProductivityProfile();

  const report = range === "week" ? weekly.data : monthly.data;
  const chartData = (report?.dailyScores ?? []).map((d) => ({ date: formatShort(d.date), score: d.score }));

  return (
    <div className="analytics-page">
      <div className="page-header">
        <div>
          <h1>Analytics</h1>
          <p>Are you becoming better than you were last week?</p>
        </div>
        <div className="segmented">
          <label className={range === "week" ? "active" : ""}>
            <input type="radio" checked={range === "week"} onChange={() => setRange("week")} className="visually-hidden" />
            This week
          </label>
          <label className={range === "month" ? "active" : ""}>
            <input type="radio" checked={range === "month"} onChange={() => setRange("month")} className="visually-hidden" />
            This month
          </label>
        </div>
      </div>

      {!report ? (
        <Skeleton height={300} radius={18} />
      ) : (
        <>
          <div className="analytics-summary-grid">
            <SummaryStat label="Productivity" value={`${report.productivityAvg}%`} />
            <SummaryStat label="Habit completion" value={`${report.habitsCompletionAvg}%`} />
            <SummaryStat label="Focus time" value={formatMinutes(report.focusMinutesTotal)} />
            <SummaryStat label="Journal days" value={`${report.journalDays}/${report.totalDays}`} />
          </div>

          <section className="card card-pad">
            <h3 className="habit-detail-section-title">Productivity trend</h3>
            <div style={{ width: "100%", height: 240 }}>
              <ResponsiveContainer>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary-500)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--primary-500)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} axisLine={false} tickLine={false} width={32} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="score" stroke="var(--primary-500)" strokeWidth={2.5} fill="url(#scoreFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div className="analytics-two-col">
            <section className="card card-pad">
              <h3 className="habit-detail-section-title">Highlights</h3>
              <div className="stack" style={{ gap: 10 }}>
                {report.topHabit && (
                  <HighlightRow icon={Trophy} label="Most consistent habit" value={`${report.topHabit.name} (${report.topHabit.completionRate}%)`} />
                )}
                {report.mostMissedHabit && (
                  <HighlightRow icon={Flame} label="Most missed habit" value={`${report.mostMissedHabit.name} (${report.mostMissedHabit.missRate}% missed)`} />
                )}
                {report.bestDay && <HighlightRow icon={Sparkles} label="Best day" value={`${formatShort(report.bestDay.date)} (${report.bestDay.score}%)`} />}
                {report.worstDay && <HighlightRow icon={Clock} label="Toughest day" value={`${formatShort(report.worstDay.date)} (${report.worstDay.score}%)`} />}
              </div>
            </section>

            <section className="card card-pad">
              <h3 className="habit-detail-section-title">Insights</h3>
              {insights.isLoading && <Skeleton height={80} radius={12} />}
              {!insights.isLoading && !insights.data?.length && (
                <EmptyState icon={Lightbulb} title="Not enough data yet" description="Keep logging — insights appear once there's enough history to trust." />
              )}
              <div className="stack" style={{ gap: 10 }}>
                {insights.data?.map((insight, idx) => (
                  <div key={idx} className="analytics-insight-row">
                    <Lightbulb size={14} />
                    <span>{insight.text}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {profile.data && (
            <section className="card card-pad">
              <h3 className="habit-detail-section-title">Your productivity profile</h3>
              <div className="analytics-profile-grid">
                <ProfileStat label="Best time" value={profile.data.bestProductivityTime ?? "Not enough data"} />
                <ProfileStat label="Best day" value={profile.data.bestDayOfWeek ?? "Not enough data"} />
                <ProfileStat label="Strongest habit" value={profile.data.strongestHabit ?? "—"} />
                <ProfileStat label="Weakest habit" value={profile.data.weakestHabit ?? "—"} />
                <ProfileStat label="Avg focus / day" value={formatMinutes(profile.data.avgFocusMinutesPerDay)} />
                <ProfileStat label="Longest streak ever" value={String(profile.data.longestStreakEver)} />
              </div>
            </section>
          )}

          <AIPanel />
        </>
      )}
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card card-pad analytics-summary-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function HighlightRow({ icon: Icon, label, value }: { icon: typeof Trophy; label: string; value: string }) {
  return (
    <div className="analytics-highlight-row">
      <Icon size={15} />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function ProfileStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="analytics-profile-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
