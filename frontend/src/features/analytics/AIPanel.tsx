import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Lightbulb, Target } from "lucide-react";
import { useAiWeeklyReview, useAiHabitRecommendations, useAiGoalRecommendations, useAskAi } from "./hooks";
import Skeleton from "../../components/ui/Skeleton";
import "./AIPanel.css";

interface QA {
  question: string;
  answer: string;
}

export default function AIPanel() {
  const weeklyReview = useAiWeeklyReview();
  const habitRecs = useAiHabitRecommendations();
  const goalRecs = useAiGoalRecommendations();
  const ask = useAskAi();

  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<QA[]>([]);

  const submitQuestion = async () => {
    const q = question.trim();
    if (!q || ask.isPending) return;
    setQuestion("");
    const answer = await ask.mutateAsync(q);
    setHistory((h) => [...h, { question: q, answer }]);
  };

  return (
    <section className="card card-pad ai-panel">
      <div className="ai-panel-header">
        <span className="ai-panel-icon">
          <Sparkles size={16} />
        </span>
        <div>
          <h3>AI Assistant</h3>
          <p>Evidence-based reflections generated from your real data - never fabricated.</p>
        </div>
      </div>

      <div className="ai-panel-block">
        <h4>
          <Sparkles size={12} /> Weekly review
        </h4>
        {weeklyReview.isLoading && <AiThinking label="Reading your week…" />}
        {weeklyReview.isError && <p className="ai-panel-error">Couldn't reach the AI provider right now.</p>}
        {weeklyReview.data && <p className="ai-panel-text">{weeklyReview.data}</p>}
      </div>

      <div className="ai-panel-two-col">
        <div className="ai-panel-block">
          <h4>
            <Lightbulb size={12} /> Habit recommendations
          </h4>
          {habitRecs.isLoading && <AiThinking label="Thinking…" />}
          {habitRecs.data && (
            <ul className="ai-panel-list">
              {habitRecs.data.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="ai-panel-block">
          <h4>
            <Target size={12} /> Goal recommendations
          </h4>
          {goalRecs.isLoading && <AiThinking label="Thinking…" />}
          {goalRecs.data && (
            <ul className="ai-panel-list">
              {goalRecs.data.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="ai-panel-block">
        <h4>
          <Sparkles size={12} /> Ask anything
        </h4>

        {history.length > 0 && (
          <div className="ai-chat-history">
            <AnimatePresence initial={false}>
              {history.map((qa, i) => (
                <motion.div
                  key={i}
                  className="ai-chat-turn"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="ai-chat-question">{qa.question}</div>
                  <div className="ai-chat-answer">{qa.answer}</div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {ask.isPending && <AiThinking label="Thinking about your data…" />}

        <div className="ai-ask-row">
          <input
            className="input"
            placeholder="e.g. Why was I less productive this week?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitQuestion();
            }}
            disabled={ask.isPending}
          />
          <button className="btn btn-primary btn-icon" type="button" onClick={submitQuestion} disabled={ask.isPending || !question.trim()}>
            <Send size={15} />
          </button>
        </div>
      </div>
    </section>
  );
}

function AiThinking({ label }: { label: string }) {
  return (
    <div className="ai-thinking">
      <span className="ai-thinking-dot" />
      <span className="ai-thinking-dot" />
      <span className="ai-thinking-dot" />
      {label}
    </div>
  );
}
