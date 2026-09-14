import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { Sparkles, Send, Lightbulb, Target } from "lucide-react-native";
import { useAiWeeklyReview, useAiHabitRecommendations, useAiGoalRecommendations, useAskAi } from "./hooks";
import { useAppTheme } from "@/hooks/useAppTheme";

interface QA {
  question: string;
  answer: string;
}

export default function AIPanel() {
  const { colors } = useAppTheme();
  const weeklyReview = useAiWeeklyReview();
  const habitRecs = useAiHabitRecommendations();
  const goalRecs = useAiGoalRecommendations();
  const ask = useAskAi();

  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<QA[]>([]);

  const submitQuestion = () => {
    const q = question.trim();
    if (!q || ask.isPending) return;
    setQuestion("");
    ask.mutate(q, { onSuccess: (answer) => setHistory((h) => [...h, { question: q, answer }]) });
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: colors.primary + "22" }]}>
          <Sparkles size={16} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>AI Assistant</Text>
          <Text style={{ color: colors.textMuted, fontSize: 11 }}>Evidence-based reflections from your real data — never fabricated.</Text>
        </View>
      </View>

      <Block title="Weekly review" colors={colors}>
        {weeklyReview.isLoading ? <ThinkingText label="Reading your week…" colors={colors} /> : null}
        {weeklyReview.isError ? <Text style={{ color: colors.textMuted, fontSize: 13 }}>Couldn't reach the AI provider right now.</Text> : null}
        {weeklyReview.data ? <Text style={{ color: colors.text, fontSize: 13, lineHeight: 19 }}>{weeklyReview.data}</Text> : null}
      </Block>

      <Block title="Habit recommendations" colors={colors}>
        {habitRecs.isLoading ? <ThinkingText label="Thinking…" colors={colors} /> : null}
        {habitRecs.data?.map((r, i) => (
          <Text key={i} style={{ color: colors.text, fontSize: 13 }}>
            • {r}
          </Text>
        ))}
      </Block>

      <Block title="Goal recommendations" colors={colors}>
        {goalRecs.isLoading ? <ThinkingText label="Thinking…" colors={colors} /> : null}
        {goalRecs.data?.map((r, i) => (
          <Text key={i} style={{ color: colors.text, fontSize: 13 }}>
            • {r}
          </Text>
        ))}
      </Block>

      <Block title="Ask anything" colors={colors}>
        {history.map((qa, i) => (
          <View key={i} style={{ gap: 4, marginBottom: 8 }}>
            <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: "600" }}>{qa.question}</Text>
            <Text style={{ color: colors.text, fontSize: 13 }}>{qa.answer}</Text>
          </View>
        ))}
        {ask.isPending ? <ThinkingText label="Thinking about your data…" colors={colors} /> : null}
        <View style={styles.askRow}>
          <TextInput
            placeholder="e.g. Why was I less productive this week?"
            placeholderTextColor={colors.textMuted}
            value={question}
            onChangeText={setQuestion}
            onSubmitEditing={submitQuestion}
            editable={!ask.isPending}
            style={[styles.askInput, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.text }]}
          />
          <Pressable
            disabled={ask.isPending || !question.trim()}
            onPress={submitQuestion}
            style={[styles.sendBtn, { backgroundColor: colors.primary, opacity: ask.isPending || !question.trim() ? 0.5 : 1 }]}
          >
            <Send size={15} color={colors.primaryText} />
          </Pressable>
        </View>
      </Block>
    </View>
  );
}

function Block({ title, colors, children }: { title: string; colors: ReturnType<typeof useAppTheme>["colors"]; children: React.ReactNode }) {
  return (
    <View style={styles.block}>
      <Text style={[styles.blockTitle, { color: colors.textMuted }]}>{title}</Text>
      {children}
    </View>
  );
}

function ThinkingText({ label, colors }: { label: string; colors: ReturnType<typeof useAppTheme>["colors"] }) {
  return <Text style={{ color: colors.textMuted, fontSize: 12 }}>{label}</Text>;
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 16 },
  header: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  iconWrap: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 15, fontWeight: "800" },
  block: { gap: 6 },
  blockTitle: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },
  askRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  askInput: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13 },
  sendBtn: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
});
