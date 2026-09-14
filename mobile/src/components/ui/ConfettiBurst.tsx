import { useMemo, useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, { useSharedValue, withDelay, withTiming, useAnimatedStyle, Easing } from "react-native-reanimated";

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4"];

/** Lightweight, dependency-free confetti burst (reanimated-driven) for achievement unlocks. */
export default function ConfettiBurst({ count = 24 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 220,
        y: Math.random() * 180 + 40,
        rotate: Math.random() * 540 - 270,
        color: COLORS[i % COLORS.length],
        delay: Math.random() * 150,
        size: 6 + Math.random() * 6,
      })),
    [count]
  );

  return (
    <Animated.View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p) => (
        <ConfettiPiece key={p.id} {...p} />
      ))}
    </Animated.View>
  );
}

function ConfettiPiece({ x, y, rotate, color, delay, size }: { x: number; y: number; rotate: number; color: string; delay: number; size: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(delay, withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) }));
  }, [delay, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [
      { translateX: x * progress.value },
      { translateY: -y * progress.value },
      { rotate: `${rotate * progress.value}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        { position: "absolute", left: "50%", top: "30%", width: size, height: size * 0.4, backgroundColor: color, borderRadius: 2 },
        style,
      ]}
    />
  );
}
