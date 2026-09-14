import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from "react-native";
import { BookOpen, Search, Trash2, Lock, Minus, Plus } from "lucide-react-native";
import { useJournalByDate, useJournalEntries, useUpsertJournal, useDeleteJournal } from "@/features/journal/hooks";
import JournalEntryModal from "@/features/journal/JournalEntryModal";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import ScreenContainer from "@/components/ui/ScreenContainer";
import { formatPretty, todayStr } from "@/utils/date";
import { useAppTheme } from "@/hooks/useAppTheme";
import { JournalEntry, Mood } from "@/types";

const MOODS: { value: Mood; emoji: string; label: string }[] = [
  { value: "great", emoji: "😄", label: "Great" },
  { value: "good", emoji: "🙂", label: "Good" },
  { value: "okay", emoji: "😐", label: "Okay" },
  { value: "bad", emoji: "😞", label: "Bad" },
  { value: "terrible", emoji: "😔", label: "Terrible" },
];

export default function JournalScreen() {
  const { colors } = useAppTheme();
  const today = todayStr();
  const { data: todayEntry } = useJournalByDate(today);
  const upsert = useUpsertJournal();
  const remove = useDeleteJournal();
  const [search, setSearch] = useState("");
  const { data: entries } = useJournalEntries({ search: search || undefined });
  const [openEntry, setOpenEntry] = useState<JournalEntry | null>(null);

  const [content, setContent] = useState("");
  const [wentWell, setWentWell] = useState("");
  const [wentWrong, setWentWrong] = useState("");
  const [learned, setLearned] = useState("");
  const [improveTomorrow, setImproveTomorrow] = useState("");
  const [mood, setMood] = useState<Mood | "">("");
  const [energy, setEnergy] = useState(70);

  useEffect(() => {
    if (todayEntry) {
      setContent(todayEntry.content ?? "");
      setWentWell(todayEntry.wentWell ?? "");
      setWentWrong(todayEntry.wentWrong ?? "");
      setLearned(todayEntry.learned ?? "");
      setImproveTomorrow(todayEntry.improveTomorrow ?? "");
      setMood(todayEntry.mood ?? "");
      setEnergy(todayEntry.energy ?? 70);
    }
  }, [todayEntry]);

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.diaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.diaryDate, { color: colors.textMuted }]}>{formatPretty(today)} · Today's page</Text>

          <View style={styles.moodRow}>
            {MOODS.map((m) => {
              const active = mood === m.value;
              return (
                <Pressable
                  key={m.value}
                  onPress={() => setMood(m.value)}
                  style={[styles.moodSeal, active && { borderColor: colors.primary, backgroundColor: colors.primary + "15" }]}
                >
                  <Text style={{ fontSize: 22 }}>{m.emoji}</Text>
                </Pressable>
              );
            })}
          </View>

          {mood ? (
            <View style={styles.energyRow}>
              <Text style={{ color: colors.text, fontSize: 13 }}>⚡ {energy}%</Text>
              <View style={styles.energySteppers}>
                <Pressable style={[styles.stepBtn, { backgroundColor: colors.surfaceAlt }]} onPress={() => setEnergy((e) => Math.max(0, e - 10))}>
                  <Minus size={13} color={colors.text} />
                </Pressable>
                <Pressable style={[styles.stepBtn, { backgroundColor: colors.surfaceAlt }]} onPress={() => setEnergy((e) => Math.min(100, e + 10))}>
                  <Plus size={13} color={colors.text} />
                </Pressable>
              </View>
            </View>
          ) : null}

          <DiaryField label="About your day…" value={content} onChangeText={setContent} placeholder="Write freely — no one else will read this." rows={4} />
          <DiaryField label="What went well?" value={wentWell} onChangeText={setWentWell} rows={2} />
          <DiaryField label="What went wrong?" value={wentWrong} onChangeText={setWentWrong} rows={2} />
          <DiaryField label="What did I learn?" value={learned} onChangeText={setLearned} rows={2} />
          <DiaryField label="Tomorrow, I'll..." value={improveTomorrow} onChangeText={setImproveTomorrow} rows={2} />

          <Button
            label={upsert.isPending ? "Writing…" : "Seal today's page"}
            loading={upsert.isPending}
            onPress={() =>
              upsert.mutate({
                date: today,
                content,
                wentWell,
                wentWrong,
                learned,
                improveTomorrow,
                mood: mood || undefined,
                energy: mood ? energy : undefined,
              })
            }
          />
        </View>

        <View style={styles.entriesHeader}>
          <Text style={[styles.entriesTitle, { color: colors.text }]}>Your pages</Text>
          <View style={[styles.searchBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <Search size={13} color={colors.textMuted} />
            <TextInput
              placeholder="Search entries…"
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
              style={{ flex: 1, color: colors.text, fontSize: 13 }}
            />
          </View>
        </View>

        {!entries?.length ? (
          <EmptyState icon={BookOpen} title="Write your first reflection." description="Your journal history will appear here." />
        ) : (
          <View style={{ gap: 10 }}>
            {entries.map((entry) => {
              const isToday = entry.date === today;
              const preview = entry.content || entry.wentWell || entry.learned || entry.wentWrong;
              return (
                <Pressable
                  key={entry._id}
                  onPress={() => setOpenEntry(entry)}
                  style={[styles.entryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={styles.entryHeaderRow}>
                    <Text style={{ color: colors.text, fontWeight: "700", fontSize: 13 }}>{isToday ? "Today" : formatPretty(entry.date)}</Text>
                    {entry.mood ? <Text>{MOODS.find((m) => m.value === entry.mood)?.emoji}</Text> : null}
                    {!isToday ? <Lock size={11} color={colors.textMuted} /> : null}
                    <View style={{ flex: 1 }} />
                    <Pressable onPress={() => remove.mutate(entry._id)} hitSlop={8}>
                      <Trash2 size={13} color={colors.textMuted} />
                    </Pressable>
                  </View>
                  {preview ? (
                    <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }} numberOfLines={2}>
                      {preview}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <JournalEntryModal entry={openEntry} isToday={openEntry?.date === today} onClose={() => setOpenEntry(null)} />
    </ScreenContainer>
  );
}

function DiaryField({
  label,
  value,
  onChangeText,
  placeholder,
  rows = 2,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: "600" }}>{label}</Text>
      <TextInput
        multiline
        numberOfLines={rows}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        style={[
          styles.textarea,
          { minHeight: rows * 22, backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.text },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 20, paddingBottom: 40 },
  diaryCard: { borderWidth: 1, borderRadius: 18, padding: 18, gap: 14 },
  diaryDate: { fontSize: 12, fontWeight: "600" },
  moodRow: { flexDirection: "row", justifyContent: "space-between" },
  moodSeal: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: "transparent", alignItems: "center", justifyContent: "center" },
  energyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  energySteppers: { flexDirection: "row", gap: 8 },
  stepBtn: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  textarea: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, textAlignVertical: "top" },
  entriesHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  entriesTitle: { fontSize: 16, fontWeight: "700" },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, height: 34, minWidth: 140 },
  entryCard: { borderWidth: 1, borderRadius: 12, padding: 12 },
  entryHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8 },
});
