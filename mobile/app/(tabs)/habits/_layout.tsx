import { Stack } from "expo-router";
import { useAppTheme } from "@/hooks/useAppTheme";

export default function HabitsLayout() {
  const { colors } = useAppTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Habits", headerShown: false }} />
      <Stack.Screen name="[id]" options={{ title: "Habit" }} />
    </Stack>
  );
}
