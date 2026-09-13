import { useMemo } from "react";
import { motion } from "framer-motion";

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4"];

/** Lightweight, dependency-free confetti burst (no canvas-confetti needed) for achievement unlocks. */
export default function ConfettiBurst({ count = 40 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 360,
        y: Math.random() * -260 - 40,
        rotate: Math.random() * 540 - 270,
        color: COLORS[i % COLORS.length],
        delay: Math.random() * 0.15,
        size: 6 + Math.random() * 6,
      })),
    [count]
  );

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: p.x, y: -p.y, opacity: 0, rotate: p.rotate }}
          transition={{ duration: 1.1 + Math.random() * 0.4, delay: p.delay, ease: "easeOut" }}
          style={{
            position: "absolute",
            left: "50%",
            top: "30%",
            width: p.size,
            height: p.size * 0.4,
            background: p.color,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}
