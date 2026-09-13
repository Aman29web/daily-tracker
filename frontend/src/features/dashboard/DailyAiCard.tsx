import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { aiApi } from "../../api/endpoints/insights";
import "./DailyAiCard.css";

export default function DailyAiCard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["ai-daily-analysis"],
    queryFn: () => aiApi.dailyAnalysis(),
    staleTime: 10 * 60_000,
    retry: false,
  });

  return (
    <section className="card card-pad daily-ai-card">
      <div className="daily-ai-card-header">
        <span className="daily-ai-card-icon">
          <Sparkles size={14} />
        </span>
        <strong>AI take on today</strong>
      </div>

      {isLoading && (
        <div className="ai-thinking">
          <span className="ai-thinking-dot" />
          <span className="ai-thinking-dot" />
          <span className="ai-thinking-dot" />
          Thinking…
        </div>
      )}
      {isError && <p className="daily-ai-card-text">Couldn't reach the AI provider right now.</p>}
      {data && <p className="daily-ai-card-text">{data}</p>}

      <Link to="/analytics" className="daily-ai-card-link">
        Ask the AI assistant more →
      </Link>
    </section>
  );
}
