import {
  Calendar,
  Target,
  BookOpen,
  Layers,
  BarChart3,
  Trophy,
  Settings,
  type LucideIcon,
} from "lucide-react-native";

export interface MoreNavItem {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
}

/** Everything from the web's 11-item nav except Dashboard/Habits/Tasks/Focus, which are tabs. */
export const MORE_NAV_ITEMS: MoreNavItem[] = [
  { key: "calendar", label: "Calendar", href: "/(more)/calendar", icon: Calendar },
  { key: "goals", label: "Goals", href: "/(more)/goals", icon: Target },
  { key: "journal", label: "Journal", href: "/(more)/journal", icon: BookOpen },
  { key: "plans", label: "Plans", href: "/(more)/plans", icon: Layers },
  { key: "analytics", label: "Analytics", href: "/(more)/analytics", icon: BarChart3 },
  { key: "achievements", label: "Achievements", href: "/(more)/achievements", icon: Trophy },
  { key: "settings", label: "Settings", href: "/(more)/settings", icon: Settings },
];
