import { View, Text, StyleSheet } from "react-native";
import { Lock } from "lucide-react-native";
import Modal from "@/components/ui/Modal";
import { JournalEntry, Mood } from "@/types";
import { formatPretty } from "@/utils/date";
import { useAppTheme } from "@/hooks/useAppTheme";

const MOOD_EMOJI: Record<Mood, string> = {
  great: "😄",
  good: "🙂",
  okay: "😐",
  bad: "😞",
  terrible: "😔",
};

const FIELDS: { key: keyof JournalEntry; label: string }[] = [
  { key: "content", label: "About the day" },
  { key: "wentWell", label: "What went well" },
  { key: "wentWrong", label: "What went wrong" },
  { key: "learned", label: "What I learned" },
  { key: "improveTomorrow", label: "Tomorrow, I'll..." },
];

interface Props {
  entry: JournalEntry | null;
  isToday: boolean;
  onClose: () => void;
}

export default function JournalEntryModal({ entry, isToday, onClose }: Props) {
  const { colors } = useAppTheme();

  return (
    <Modal visible={!!entry} onClose={onClose} title={entry ? (isToday ? "Today" : formatPretty(entry.date)) : undefined}>
      {entry ? (
        <View style={{ gap: 16 }}>
          {!isToday ? (
            <View style={[styles.lockedNote, { backgroundColor: colors.surfaceAlt }]}>
              <Lock size={12} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, fontSize: 12, flex: 1 }}>
                This page is sealed — entries can only be edited on the day they're written.
              </Text>
            </View>
          ) : null}

          {entry.mood || entry.energy !== undefined ? (
            <View style={styles.moodRow}>
              {entry.mood ? (
                <Text style={{ color: colors.text, fontSize: 13 }}>
                  {MOOD_EMOJI[entry.mood]} {entry.mood}
                </Text>
              ) : null}
              {entry.energy !== undefined ? <Text style={{ color: colors.text, fontSize: 13 }}>⚡ {entry.energy}% energy</Text> : null}
            </View>
          ) : null}

          {FIELDS.map(({ key, label }) => {
            const value = entry[key];
            if (!value || typeof value !== "string") return null;
            return (
              <View key={key}>
                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>{label}</Text>
                <Text style={{ color: colors.text, fontSize: 14, lineHeight: 20 }}>{value}</Text>
              </View>
            );
          })}

          {entry.tags.length > 0 ? (
            <View style={styles.tagsRow}>
              {entry.tags.map((tag) => (
                <View key={tag} style={[styles.tag, { backgroundColor: colors.surfaceAlt }]}>
                  <Text style={{ color: colors.textMuted, fontSize: 11 }}>{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {FIELDS.every(({ key }) => !entry[key]) ? (
            <Text style={{ color: colors.textMuted, fontSize: 13 }}>No written reflection for this day — just a mood check-in.</Text>
          ) : null}
        </View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  lockedNote: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10 },
  moodRow: { flexDirection: "row", gap: 16 },
  fieldLabel: { fontSize: 12, fontWeight: "700", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.3 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8 },
});
