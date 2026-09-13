import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAuthStore } from "../../stores/authStore";
import { useThemeStore } from "../../stores/themeStore";
import ThemeSwitcher from "../../components/ui/ThemeSwitcher";
import { useChangePassword, useSettings, useUpdateProfile, useUpdateSettings } from "./hooks";
import { COMMON_TIMEZONES } from "../../constants/timezones";
import "./SettingsPage.css";

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const { theme } = useThemeStore();

  const profileForm = useForm({ defaultValues: { name: user?.name ?? "", timezone: user?.timezone ?? "UTC" } });
  const passwordForm = useForm({ defaultValues: { currentPassword: "", newPassword: "" } });

  useEffect(() => {
    if (user) profileForm.reset({ name: user.name, timezone: user.timezone });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div className="settings-page">
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Your account, preferences, and notifications.</p>
        </div>
      </div>

      <section className="card card-pad settings-section">
        <h3>Profile</h3>
        <form
          className="settings-form"
          onSubmit={profileForm.handleSubmit((values) => updateProfile.mutate(values))}
        >
          <div className="two-col-inline">
            <div className="field">
              <label>Name</label>
              <input className="input" {...profileForm.register("name")} />
            </div>
            <div className="field">
              <label>Email</label>
              <input className="input" value={user?.email ?? ""} disabled />
            </div>
          </div>
          <div className="field">
            <label>Timezone</label>
            <select className="select" {...profileForm.register("timezone")}>
              {(user?.timezone && !COMMON_TIMEZONES.includes(user.timezone) ? [user.timezone, ...COMMON_TIMEZONES] : COMMON_TIMEZONES).map(
                (tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                )
              )}
            </select>
          </div>
          <button className="btn btn-primary btn-sm" type="submit" disabled={updateProfile.isPending}>
            Save profile
          </button>
        </form>
      </section>

      <section className="card card-pad settings-section">
        <h3>Appearance</h3>
        <div className="settings-row">
          <span>Theme ({theme})</span>
          <ThemeSwitcher />
        </div>
      </section>

      <section className="card card-pad settings-section">
        <h3>Change password</h3>
        <form
          className="settings-form"
          onSubmit={passwordForm.handleSubmit(async (values) => {
            await changePassword.mutateAsync(values);
            passwordForm.reset();
          })}
        >
          <div className="two-col-inline">
            <div className="field">
              <label>Current password</label>
              <input className="input" type="password" {...passwordForm.register("currentPassword", { required: true })} />
            </div>
            <div className="field">
              <label>New password</label>
              <input className="input" type="password" {...passwordForm.register("newPassword", { required: true })} />
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" type="submit" disabled={changePassword.isPending}>
            Update password
          </button>
        </form>
      </section>

      {settings && (
        <section className="card card-pad settings-section">
          <h3>Notifications</h3>
          <div className="settings-toggle-list">
            <ToggleRow
              label="Morning reminder"
              checked={settings.notificationPreferences.morningReminder.enabled}
              onChange={(v) =>
                updateSettings.mutate({
                  notificationPreferences: { ...settings.notificationPreferences, morningReminder: { ...settings.notificationPreferences.morningReminder, enabled: v } },
                })
              }
            />
            <ToggleRow
              label="Habit reminders"
              checked={settings.notificationPreferences.habitReminders}
              onChange={(v) => updateSettings.mutate({ notificationPreferences: { ...settings.notificationPreferences, habitReminders: v } })}
            />
            <ToggleRow
              label="Task reminders"
              checked={settings.notificationPreferences.taskReminders}
              onChange={(v) => updateSettings.mutate({ notificationPreferences: { ...settings.notificationPreferences, taskReminders: v } })}
            />
            <ToggleRow
              label="Nightly review"
              checked={settings.notificationPreferences.nightlyReview.enabled}
              onChange={(v) =>
                updateSettings.mutate({
                  notificationPreferences: { ...settings.notificationPreferences, nightlyReview: { ...settings.notificationPreferences.nightlyReview, enabled: v } },
                })
              }
            />
            <ToggleRow
              label="Streak risk alerts"
              checked={settings.notificationPreferences.streakRisk}
              onChange={(v) => updateSettings.mutate({ notificationPreferences: { ...settings.notificationPreferences, streakRisk: v } })}
            />
            <ToggleRow
              label="Goal reminders"
              checked={settings.notificationPreferences.goalReminders}
              onChange={(v) => updateSettings.mutate({ notificationPreferences: { ...settings.notificationPreferences, goalReminders: v } })}
            />
            <ToggleRow
              label="Achievement alerts"
              checked={settings.notificationPreferences.achievementAlerts}
              onChange={(v) => updateSettings.mutate({ notificationPreferences: { ...settings.notificationPreferences, achievementAlerts: v } })}
            />
          </div>
        </section>
      )}

      <section className="card card-pad settings-section">
        <h3>Productivity score</h3>
        <p className="habit-detail-hint">
          Your daily score is based entirely on habit completion: finish every habit scheduled for the day and you're at
          100%, no matter what else is on your plate. Tasks, focus time, and your Top 3 are still tracked and shown
          separately on your dashboard and analytics — they just don't change this number.
        </p>
      </section>
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="settings-toggle-row">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}
