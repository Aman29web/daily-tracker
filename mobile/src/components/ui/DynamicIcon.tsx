import {
  Target,
  Dumbbell,
  Footprints,
  Droplet,
  BookOpen,
  Code,
  Brain,
  Moon,
  Sunrise,
  Pencil,
  Music,
  Heart,
  Coffee,
  Leaf,
  Flame,
  Wallet,
  Layers,
  Trophy,
  CheckCircle,
  Notebook,
  Star,
  HelpCircle,
  type LucideIcon,
} from "lucide-react-native";

/**
 * Icon name strings are persisted server-side on Habit/Plan/Achievement
 * docs and shared between the web and mobile clients - this registry's
 * keys MUST match frontend/src/components/ui/DynamicIcon.tsx exactly, or
 * data created on one client silently fails to render its icon on the
 * other.
 */
const REGISTRY: Record<string, LucideIcon> = {
  target: Target,
  dumbbell: Dumbbell,
  footprints: Footprints,
  droplet: Droplet,
  "book-open": BookOpen,
  code: Code,
  brain: Brain,
  moon: Moon,
  sunrise: Sunrise,
  pencil: Pencil,
  music: Music,
  heart: Heart,
  coffee: Coffee,
  leaf: Leaf,
  flame: Flame,
  wallet: Wallet,
  layers: Layers,
  trophy: Trophy,
  "check-circle": CheckCircle,
  notebook: Notebook,
  star: Star,
};

export const ICON_NAMES = Object.keys(REGISTRY);

export default function DynamicIcon({
  name,
  size = 18,
  color,
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  const Icon = REGISTRY[name] ?? HelpCircle;
  return <Icon size={size} color={color} />;
}
