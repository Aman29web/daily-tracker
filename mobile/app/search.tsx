import { useState } from "react";
import { View, Text, TextInput, Pressable, FlatList, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Search, Repeat, CheckSquare, Target, BookOpen, X } from "lucide-react-native";
import ScreenContainer from "@/components/ui/ScreenContainer";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { searchApi } from "@/api/endpoints/insights";
import { useAppTheme } from "@/hooks/useAppTheme";

interface ResultItem {
  _id: string;
  name?: string;
  title?: string;
  content?: string;
}

const GROUPS = [
  { key: "habits" as const, label: "Habits", icon: Repeat, href: "/(tabs)/habits" },
  { key: "tasks" as const, label: "Tasks", icon: CheckSquare, href: "/(tabs)/tasks" },
  { key: "goals" as const, label: "Goals", icon: Target, href: "/(more)/goals" },
  { key: "journal" as const, label: "Journal", icon: BookOpen, href: "/(more)/journal" },
];

export default function SearchScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [q, setQ] = useState("");
  const debounced = useDebouncedValue(q, 300);

  const { data, isFetching } = useQuery({
    queryKey: ["search", debounced],
    queryFn: () => searchApi.search(debounced),
    enabled: debounced.trim().length > 0,
  });

  const sections = GROUPS.map((g) => ({ ...g, items: (data?.[g.key] as ResultItem[]) ?? [] })).filter((g) => g.items.length > 0);
  const noResults = debounced.trim().length > 0 && !isFetching && data && sections.length === 0;

  return (
    <ScreenContainer>
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}>
        <View style={[styles.inputRow, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <Search size={16} color={colors.textMuted} />
          <TextInput
            autoFocus
            placeholder="Search habits, tasks, goals, journal…"
            placeholderTextColor={colors.textMuted}
            value={q}
            onChangeText={setQ}
            style={[styles.input, { color: colors.text }]}
          />
        </View>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <X size={22} color={colors.text} />
        </Pressable>
      </View>

      <FlatList
        contentContainerStyle={styles.list}
        data={sections}
        keyExtractor={(s) => s.key}
        ListEmptyComponent={
          <Text style={{ color: colors.textMuted, textAlign: "center", marginTop: 30 }}>
            {!debounced ? "Start typing to search everything." : isFetching ? "Searching…" : noResults ? `No results for "${debounced}"` : ""}
          </Text>
        }
        renderItem={({ item: group }) => (
          <View style={{ marginBottom: 18 }}>
            <View style={styles.groupLabel}>
              <group.icon size={13} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: "700" }}>{group.label}</Text>
            </View>
            {group.items.map((item) => (
              <Pressable
                key={item._id}
                style={[styles.resultRow, { borderColor: colors.border }]}
                onPress={() => router.push(group.href as never)}
              >
                <Text style={{ color: colors.text, fontSize: 14 }} numberOfLines={1}>
                  {item.name ?? item.title ?? item.content?.slice(0, 60) ?? "Untitled"}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  inputRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, height: 42 },
  input: { flex: 1, fontSize: 14 },
  list: { padding: 20 },
  groupLabel: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  resultRow: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
});
