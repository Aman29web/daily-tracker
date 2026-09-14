import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatDistanceToNow } from "date-fns";
import { Bell, Check, Trophy, Target, ListChecks, Flame, Sunrise, Moon, Info, X, type LucideIcon } from "lucide-react-native";
import ScreenContainer from "@/components/ui/ScreenContainer";
import EmptyState from "@/components/ui/EmptyState";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/features/notifications/hooks";
import { useAppTheme } from "@/hooks/useAppTheme";
import { AppNotification } from "@/types";

const ICONS: Record<string, LucideIcon> = {
  morning_reminder: Sunrise,
  habit_reminder: ListChecks,
  task_reminder: ListChecks,
  nightly_review: Moon,
  streak_risk: Flame,
  goal_reminder: Target,
  achievement_unlocked: Trophy,
  weekly_report: Info,
  system: Info,
};

export default function NotificationsScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = data?.unreadCount ?? 0;

  return (
    <ScreenContainer>
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
        <View style={styles.headerActions}>
          {unreadCount > 0 ? (
            <Pressable onPress={() => markAllRead.mutate()}>
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "600" }}>Mark all read</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <X size={22} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <FlatList
        contentContainerStyle={styles.list}
        data={data?.items ?? []}
        keyExtractor={(n) => n._id}
        ListEmptyComponent={<EmptyState icon={Bell} title="You're all caught up." description="New notifications will show up here." />}
        renderItem={({ item }) => <NotificationRow item={item} onPress={() => !item.readAt && markRead.mutate(item._id)} />}
      />
    </ScreenContainer>
  );
}

function NotificationRow({ item, onPress }: { item: AppNotification; onPress: () => void }) {
  const { colors } = useAppTheme();
  const Icon = ICONS[item.type] ?? Info;
  const unread = !item.readAt;

  return (
    <Pressable onPress={onPress} style={[styles.row, { backgroundColor: unread ? colors.primary + "0D" : "transparent", borderColor: colors.border }]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.surfaceAlt }]}>
        <Icon size={15} color={colors.text} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: colors.text, fontWeight: "700", fontSize: 13 }}>{item.title}</Text>
        <Text style={{ color: colors.textMuted, fontSize: 12 }}>{item.body}</Text>
        <Text style={{ color: colors.textMuted, fontSize: 10 }}>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</Text>
      </View>
      {unread ? <Check size={14} color={colors.primary} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  title: { fontSize: 18, fontWeight: "800" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 16 },
  list: { padding: 20, gap: 8 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  iconWrap: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
});
