import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuthBootstrap } from "./hooks/useAuthBootstrap";
import { useAuthStore } from "./stores/authStore";
import AppShell from "./layouts/AppShell";
import LoginPage from "./features/auth/LoginPage";
import RegisterPage from "./features/auth/RegisterPage";
import SplashScreen from "./components/ui/SplashScreen";

// Route-level code splitting: the app shell + auth pages load eagerly (the
// first thing every visitor needs), everything behind the authenticated
// shell loads on demand so the initial bundle stays small.
const DashboardPage = lazy(() => import("./features/dashboard/DashboardPage"));
const HabitsPage = lazy(() => import("./features/habits/HabitsPage"));
const HabitDetailPage = lazy(() => import("./features/habits/HabitDetailPage"));
const CalendarPage = lazy(() => import("./features/calendar/CalendarPage"));
const TasksPage = lazy(() => import("./features/tasks/TasksPage"));
const GoalsPage = lazy(() => import("./features/goals/GoalsPage"));
const FocusPage = lazy(() => import("./features/focus/FocusPage"));
const JournalPage = lazy(() => import("./features/journal/JournalPage"));
const AnalyticsPage = lazy(() => import("./features/analytics/AnalyticsPage"));
const AchievementsPage = lazy(() => import("./features/achievements/AchievementsPage"));
const SettingsPage = lazy(() => import("./features/settings/SettingsPage"));
const PlansPage = lazy(() => import("./features/habits/PlansPage"));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((s) => s.status);
  if (status !== "authenticated") return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((s) => s.status);
  if (status === "authenticated") return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const ready = useAuthBootstrap();

  if (!ready) return <SplashScreen />;

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Lazy><DashboardPage /></Lazy>} />
        <Route path="calendar" element={<Lazy><CalendarPage /></Lazy>} />
        <Route path="habits" element={<Lazy><HabitsPage /></Lazy>} />
        <Route path="habits/:id" element={<Lazy><HabitDetailPage /></Lazy>} />
        <Route path="plans" element={<Lazy><PlansPage /></Lazy>} />
        <Route path="tasks" element={<Lazy><TasksPage /></Lazy>} />
        <Route path="goals" element={<Lazy><GoalsPage /></Lazy>} />
        <Route path="focus" element={<Lazy><FocusPage /></Lazy>} />
        <Route path="journal" element={<Lazy><JournalPage /></Lazy>} />
        <Route path="analytics" element={<Lazy><AnalyticsPage /></Lazy>} />
        <Route path="achievements" element={<Lazy><AchievementsPage /></Lazy>} />
        <Route path="settings" element={<Lazy><SettingsPage /></Lazy>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<SplashScreen />}>{children}</Suspense>;
}
