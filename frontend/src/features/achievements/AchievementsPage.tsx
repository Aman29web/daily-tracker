import { useQuery } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { achievementsApi } from "../../api/endpoints/insights";
import DynamicIcon from "../../components/ui/DynamicIcon";
import ConfettiBurst from "../../components/ui/ConfettiBurst";
import Skeleton from "../../components/ui/Skeleton";
import "./AchievementsPage.css";

export default function AchievementsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["achievements"], queryFn: achievementsApi.list });

  const unlockedCount = data?.filter((a) => a.unlocked).length ?? 0;

  return (
    <div className="achievements-page">
      <div className="page-header">
        <div>
          <h1>Achievements</h1>
          <p>
            {unlockedCount} of {data?.length ?? 0} unlocked
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="achievements-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height={130} radius={18} />
          ))}
        </div>
      )}

      <div className="achievements-grid">
        {data?.map((item) => {
          const justUnlocked = item.unlocked && item.unlockedAt && Date.now() - new Date(item.unlockedAt).getTime() < 86_400_000;
          const pct = Math.round((item.progress / item.threshold) * 100);
          return (
            <div key={item.achievement.key} className={"card card-pad achievement-card" + (item.unlocked ? " unlocked" : "")}>
              {justUnlocked && <ConfettiBurst />}
              <div className="achievement-icon" style={{ opacity: item.unlocked ? 1 : 0.4 }}>
                {item.unlocked ? <DynamicIcon name={item.achievement.icon} size={22} /> : <Lock size={18} />}
              </div>
              <h4>{item.achievement.title}</h4>
              <p>{item.achievement.description}</p>
              {!item.unlocked && (
                <div className="achievement-progress">
                  <div className="habit-check-progress-track" style={{ maxWidth: "100%" }}>
                    <div className="habit-check-progress-fill" style={{ width: `${pct}%`, background: "var(--primary-500)" }} />
                  </div>
                  <span>
                    {item.progress}/{item.threshold}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
