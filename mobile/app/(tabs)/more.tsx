import { View, Text, Pressable, StyleSheet, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { ChevronRight, LogOut } from "lucide-react-native";
import ScreenContainer from "@/components/ui/ScreenContainer";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAuthStore } from "@/stores/authStore";
import { useLogout } from "@/features/auth/hooks";
import { MORE_NAV_ITEMS } from "@/constants/navigation";

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const router = useRouter();

  return (
    <ScreenContainer>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={[styles.title, { color: colors.text }]}>More</Text>
        {user ? <Text style={{ color: colors.textMuted }}>{user.email}</Text> : null}
      </View>

      <FlatList
        data={MORE_NAV_ITEMS}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Link href={item.href as never} asChild>
            <Pressable
              style={StyleSheet.flatten([styles.row, { backgroundColor: colors.surface, borderColor: colors.border }])}
            >
              <item.icon size={18} color={colors.text} />
              <Text style={[styles.rowLabel, { color: colors.text }]}>{item.label}</Text>
              <ChevronRight size={18} color={colors.textMuted} />
            </Pressable>
          </Link>
        )}
        ListFooterComponent={
          <Pressable
            style={[styles.row, styles.signOutRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => {
              logout.mutate(undefined, { onSuccess: () => router.replace("/(auth)/login") });
            }}
          >
            <LogOut size={18} color={colors.danger} />
            <Text style={[styles.rowLabel, { color: colors.danger }]}>Sign out</Text>
          </Pressable>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 12, gap: 2 },
  title: { fontSize: 26, fontWeight: "800" },
  list: { paddingHorizontal: 20, gap: 10, paddingBottom: 24 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: "600" },
  signOutRow: { marginTop: 12 },
});
