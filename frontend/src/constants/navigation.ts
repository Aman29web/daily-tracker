import {
  LayoutDashboard,
  Calendar,
  Repeat,
  Layers,
  CheckSquare,
  Target,
  Timer,
  BookOpen,
  BarChart3,
  Trophy,
  Settings,
  LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/habits", label: "Habits", icon: Repeat },
  { to: "/plans", label: "Plans", icon: Layers },
  { to: "/tasks", label: "Tasks", icon: CheckSquare },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/focus", label: "Focus", icon: Timer },
  { to: "/journal", label: "Journal", icon: BookOpen },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/achievements", label: "Achievements", icon: Trophy },
  { to: "/settings", label: "Settings", icon: Settings },
];

export const MOBILE_NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Home", icon: LayoutDashboard, end: true },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/habits", label: "Habits", icon: Repeat },
  { to: "/tasks", label: "Tasks", icon: CheckSquare },
  { to: "/focus", label: "Focus", icon: Timer },
  { to: "/journal", label: "Journal", icon: BookOpen },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/achievements", label: "Awards", icon: Trophy },
  { to: "/settings", label: "Settings", icon: Settings },
];
