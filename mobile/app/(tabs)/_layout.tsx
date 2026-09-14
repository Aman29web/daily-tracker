import { View, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { Home, ListTodo, CheckSquare, Timer, Menu } from "lucide-react-native";
import { useAppTheme } from "@/hooks/useAppTheme";
import QuickAddButton from "@/features/quickadd/QuickAddButton";
import QuickAddSheet from "@/features/quickadd/QuickAddSheet";
import HeaderBellBadge from "@/components/ui/HeaderBellBadge";

export default function TabsLayout() {
  const { colors } = useAppTheme();

  return (
    <View style={styles.flex}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{ title: "Home", tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }}
        />
        <Tabs.Screen
          name="habits"
          options={{ title: "Habits", tabBarIcon: ({ color, size }) => <ListTodo color={color} size={size} /> }}
        />
        <Tabs.Screen
          name="tasks"
          options={{ title: "Tasks", tabBarIcon: ({ color, size }) => <CheckSquare color={color} size={size} /> }}
        />
        <Tabs.Screen
          name="focus"
          options={{ title: "Focus", tabBarIcon: ({ color, size }) => <Timer color={color} size={size} /> }}
        />
        <Tabs.Screen
          name="more"
          options={{ title: "More", tabBarIcon: ({ color, size }) => <Menu color={color} size={size} /> }}
        />
      </Tabs>

      <HeaderBellBadge />
      <QuickAddButton />
      <QuickAddSheet />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
