import { motion } from "framer-motion";
import { useAuthStore } from "../../stores/authStore";
import { formatPretty } from "../../utils/date";
import "./HeroBanner.css";

interface HeroBannerProps {
  message: string;
  date: string;
  streak: number;
  productivityScore: number;
}

export default function HeroBanner({ message, date, streak, productivityScore }: HeroBannerProps) {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name.split(" ")[0];

  return (
    <motion.div
      className="hero-banner"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="hero-banner-glow" />
      <div className="hero-banner-content">
        <span className="hero-banner-date">{formatPretty(date)}</span>
        <h1>
          {firstName ? `${firstName}, ` : ""}
          {message}
        </h1>
        <div className="hero-banner-stats">
          <div>
            <strong>{productivityScore}%</strong>
            <span>Today's score</span>
          </div>
          <div className="hero-divider" />
          <div>
            <strong>🔥 {streak}</strong>
            <span>Day streak</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
