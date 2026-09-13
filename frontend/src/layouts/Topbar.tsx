import { Search } from "lucide-react";
import { useUiStore } from "../stores/uiStore";
import ThemeSwitcher from "../components/ui/ThemeSwitcher";
import NotificationsBell from "../features/notifications/NotificationsBell";
import QuickAddButton from "../features/quickadd/QuickAddButton";
import UserMenu from "../features/auth/UserMenu";
import "./Topbar.css";

export default function Topbar() {
  const setSearchOpen = useUiStore((s) => s.setSearchOpen);

  return (
    <header className="topbar">
      <button className="search-trigger" onClick={() => setSearchOpen(true)} type="button">
        <Search size={15} />
        <span>Search…</span>
        <kbd>⌘K</kbd>
      </button>

      <div className="topbar-actions">
        <ThemeSwitcher />
        <NotificationsBell />
        <QuickAddButton />
        <UserMenu />
      </div>
    </header>
  );
}
