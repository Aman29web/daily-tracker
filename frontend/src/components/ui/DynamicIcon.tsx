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
  type LucideIcon,
  HelpCircle,
} from "lucide-react";

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

export default function DynamicIcon({ name, size = 16, ...rest }: { name: string; size?: number; className?: string }) {
  const Icon = REGISTRY[name] ?? HelpCircle;
  return <Icon size={size} {...rest} />;
}
