import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Search, Bell } from "lucide-react-native";
import { useNotifications } from "@/features/notifications/hooks";
import { useAppTheme } from "@/hooks/useAppTheme";

/** Fixed overlay (search + bell w/ unread badge) shown above every tab, since headerShown is false at the tab-navigator level. */
export default function HeaderBellBadge() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data } = useNotifications();
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <View style={[styles.row, { top: insets.top + 8 }]} pointerEvents="box-none">
      <Pressable style={[styles.btn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => router.push("/search")}>
        <Search size={17} color={colors.text} />
      </Pressable>
      <Pressable style={[styles.btn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => router.push("/notifications")}>
        <Bell size={17} color={colors.text} />
        {unreadCount > 0 ? (
          <View style={[styles.badge, { backgroundColor: colors.danger }]}>
            <Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { position: "absolute", right: 16, flexDirection: "row", gap: 8, zIndex: 50 },
  btn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  badge: { position: "absolute", top: -3, right: -3, minWidth: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },
});
