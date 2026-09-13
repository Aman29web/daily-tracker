import { Sun, Moon, Monitor } from "lucide-react";
import { useThemeStore } from "../../stores/themeStore";
import "./ThemeSwitcher.css";

const OPTIONS = [
  { value: "light" as const, icon: Sun, label: "Light" },
  { value: "dark" as const, icon: Moon, label: "Dark" },
  { value: "system" as const, icon: Monitor, label: "System" },
];

export default function ThemeSwitcher() {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="theme-switcher" role="radiogroup" aria-label="Theme">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          role="radio"
          aria-checked={theme === opt.value}
          className={"theme-switch-btn" + (theme === opt.value ? " active" : "")}
          onClick={() => setTheme(opt.value)}
          title={opt.label}
          type="button"
        >
          <opt.icon size={15} />
        </button>
      ))}
    </div>
  );
}
