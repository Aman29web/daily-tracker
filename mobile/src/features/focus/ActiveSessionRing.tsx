import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, AppState } from "react-native";
import { Play, Pause, CheckCircle2, Square } from "lucide-react-native";
import ProgressRing from "@/components/ui/ProgressRing";
import { useFocusActions } from "./hooks";
import { useAppTheme } from "@/hooks/useAppTheme";
import { FocusSession } from "@/types";

function computeElapsedSeconds(session: FocusSession): number {
  const baseMinutes = session.actualDuration;
  const runningExtra =
    session.status === "running" && session.lastResumedAt ? (Date.now() - new Date(session.lastResumedAt).getTime()) / 1000 : 0;
  return Math.floor(baseMinutes * 60 + runningExtra);
}

/**
 * Elapsed time is always derived from actualDuration + lastResumedAt + wall
 * clock (Date.now()) rather than counted via setInterval ticks - RN
 * throttles/suspends JS timers when backgrounded, so a tick-counted value
 * would drift or freeze. The interval below only triggers a re-render each
 * second while foregrounded; an AppState listener forces an immediate
 * recompute on return to foreground so any time spent backgrounded is
 * caught up instantly instead of jumping visibly. Mirrors
 * frontend/src/features/focus/FocusPage.tsx's ActiveSession effect.
 */
export default function ActiveSessionRing({ session }: { session: FocusSession }) {
  const { colors } = useAppTheme();
  const { pause, resume, complete, cancel } = useFocusActions();
  const [elapsedSeconds, setElapsedSeconds] = useState(() => computeElapsedSeconds(session));
  const sessionRef = useRef(session);
  sessionRef.current = session;

  useEffect(() => {
    setElapsedSeconds(computeElapsedSeconds(session));
    if (session.status !== "running") return;

    const interval = setInterval(() => setElapsedSeconds(computeElapsedSeconds(sessionRef.current)), 1000);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") setElapsedSeconds(computeElapsedSeconds(sessionRef.current));
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [session]);

  const plannedSeconds = session.plannedDuration * 60;
  const pct = Math.min(100, Math.round((elapsedSeconds / plannedSeconds) * 100));
  const mm = String(Math.floor(elapsedSeconds / 60)).padStart(2, "0");
  const ss = String(elapsedSeconds % 60).padStart(2, "0");

  return (
    <View style={styles.container}>
      <ProgressRing
        value={pct}
        size={220}
        strokeWidth={14}
        color={session.status === "running" ? colors.primary : colors.warning}
        label={
          <>
            <Text style={[styles.time, { color: colors.text }]}>
              {mm}:{ss}
            </Text>
            <Text style={[styles.status, { color: colors.textMuted }]}>{session.status}</Text>
          </>
        }
      />
      <View style={styles.controls}>
        {session.status === "running" ? (
          <ControlButton icon={<Pause size={16} color={colors.text} />} label="Pause" onPress={() => pause.mutate(session._id)} colors={colors} />
        ) : (
          <ControlButton icon={<Play size={16} color={colors.text} />} label="Resume" onPress={() => resume.mutate(session._id)} colors={colors} />
        )}
        <ControlButton
          icon={<CheckCircle2 size={16} color={colors.primaryText} />}
          label="Complete"
          onPress={() => complete.mutate(session._id)}
          colors={colors}
          primary
        />
        <ControlButton icon={<Square size={16} color={colors.danger} />} label="Cancel" onPress={() => cancel.mutate(session._id)} colors={colors} />
      </View>
    </View>
  );
}

function ControlButton({
  icon,
  label,
  onPress,
  colors,
  primary,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  colors: ReturnType<typeof useAppTheme>["colors"];
  primary?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.controlBtn, { backgroundColor: primary ? colors.primary : colors.surfaceAlt }]}
    >
      {icon}
      <Text style={{ color: primary ? colors.primaryText : colors.text, fontSize: 13, fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: 20 },
  time: { fontSize: 36, fontWeight: "800", fontVariant: ["tabular-nums"] },
  status: { fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
  controls: { flexDirection: "row", gap: 10 },
  controlBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
});
