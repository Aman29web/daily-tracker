import { useEffect, useState } from "react";
import { View, Text, ScrollView, Switch, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";
import { useChangePassword, useSettings, useUpdateProfile, useUpdateSettings } from "@/features/settings/hooks";
import { useLogout } from "@/features/auth/hooks";
import TextField from "@/components/ui/TextField";
import Button from "@/components/ui/Button";
import ThemeSwitcher from "@/components/ui/ThemeSwitcher";
import ScreenContainer from "@/components/ui/ScreenContainer";
import { COMMON_TIMEZONES } from "@/constants/timezones";
import { useAppTheme } from "@/hooks/useAppTheme";
import { UserSettings } from "@/types";

export default function SettingsScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const theme = useThemeStore((s) => s.theme);
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const logout = useLogout();

  const [name, setName] = useState(user?.name ?? "");
  const [timezone, setTimezone] = useState(user?.timezone ?? "UTC");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name);
      setTimezone(user.timezone);
    }
  }, [user]);

  const patchPrefs = (patch: Partial<UserSettings["notificationPreferences"]>) => {
    if (!settings) return;
    updateSettings.mutate({ notificationPreferences: { ...settings.notificationPreferences, ...patch } });
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.container}>
        <Section title="Profile" colors={colors}>
          <TextField label="Name" value={name} onChangeText={setName} />
          <TextField label="Email" value={user?.email ?? ""} editable={false} />
          <TextField label="Timezone" value={timezone} onChangeText={setTimezone} placeholder="e.g. America/New_York" />
          <Text style={{ color: colors.textMuted, fontSize: 11 }}>
            Common: {COMMON_TIMEZONES.slice(0, 4).join(", ")}…
          </Text>
          <Button label="Save profile" onPress={() => updateProfile.mutate({ name, timezone })} loading={updateProfile.isPending} />
        </Section>

        <Section title="Appearance" colors={colors}>
          <View style={styles.row}>
            <Text style={{ color: colors.text }}>Theme ({theme})</Text>
            <ThemeSwitcher />
          </View>
        </Section>

        <Section title="Change password" colors={colors}>
          <TextField label="Current password" secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} />
          <TextField label="New password" secureTextEntry value={newPassword} onChangeText={setNewPassword} />
          <Button
            label="Update password"
            variant="secondary"
            loading={changePassword.isPending}
            onPress={() => {
              changePassword.mutate(
                { currentPassword, newPassword },
                { onSuccess: () => { setCurrentPassword(""); setNewPassword(""); } }
              );
            }}
          />
        </Section>

        {settings ? (
          <Section title="Notifications" colors={colors}>
            <ToggleRow label="Morning reminder" value={settings.notificationPreferences.morningReminder.enabled} onChange={(v) => patchPrefs({ morningReminder: { ...settings.notificationPreferences.morningReminder, enabled: v } })} />
            <ToggleRow label="Habit reminders" value={settings.notificationPreferences.habitReminders} onChange={(v) => patchPrefs({ habitReminders: v })} />
            <ToggleRow label="Task reminders" value={settings.notificationPreferences.taskReminders} onChange={(v) => patchPrefs({ taskReminders: v })} />
            <ToggleRow label="Nightly review" value={settings.notificationPreferences.nightlyReview.enabled} onChange={(v) => patchPrefs({ nightlyReview: { ...settings.notificationPreferences.nightlyReview, enabled: v } })} />
            <ToggleRow label="Streak risk alerts" value={settings.notificationPreferences.streakRisk} onChange={(v) => patchPrefs({ streakRisk: v })} />
            <ToggleRow label="Goal reminders" value={settings.notificationPreferences.goalReminders} onChange={(v) => patchPrefs({ goalReminders: v })} />
            <ToggleRow label="Achievement alerts" value={settings.notificationPreferences.achievementAlerts} onChange={(v) => patchPrefs({ achievementAlerts: v })} />
          </Section>
        ) : null}

        <Section title="Productivity score" colors={colors}>
          <Text style={{ color: colors.textMuted, fontSize: 12, lineHeight: 18 }}>
            Your daily score is based entirely on habit completion: finish every habit scheduled for the day and you're at
            100%, no matter what else is on your plate. Tasks, focus time, and your Top 3 are still tracked and shown
            separately on your dashboard and analytics — they just don't change this number.
          </Text>
        </Section>

        <Pressable
          style={[styles.signOut, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => logout.mutate(undefined, { onSuccess: () => router.replace("/(auth)/login") })}
        >
          <Text style={{ color: colors.danger, fontWeight: "700" }}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

function Section({ title, colors, children }: { title: string; colors: ReturnType<typeof useAppTheme>["colors"]; children: React.ReactNode }) {
  return (
    <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {children}
    </View>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.toggleRow}>
      <Text style={{ color: colors.text, fontSize: 13 }}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.primary }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 16, paddingBottom: 40 },
  section: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 15, fontWeight: "700" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4 },
  signOut: { borderWidth: 1, borderRadius: 14, padding: 14, alignItems: "center" },
});
