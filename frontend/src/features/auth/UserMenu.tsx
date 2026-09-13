import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Settings, User } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../stores/authStore";
import { authApi } from "../../api/endpoints/auth";
import { useClickOutside } from "../../hooks/useClickOutside";
import "./UserMenu.css";

export default function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  useClickOutside(ref, () => setOpen(false), open);

  if (!user) return null;
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore - we clear client-side regardless
    }
    clear();
    toast.success("Logged out");
    navigate("/login", { replace: true });
  };

  return (
    <div className="user-menu" ref={ref}>
      <button className="user-menu-trigger" onClick={() => setOpen((v) => !v)} type="button">
        <span className="user-avatar" style={{ background: user.avatarColor }}>
          {initials}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="user-menu-panel"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
          >
            <div className="user-menu-info">
              <span className="user-avatar" style={{ background: user.avatarColor }}>
                {initials}
              </span>
              <div>
                <strong>{user.name}</strong>
                <span>{user.email}</span>
              </div>
            </div>
            <button
              className="user-menu-item"
              onClick={() => {
                setOpen(false);
                navigate("/settings");
              }}
              type="button"
            >
              <Settings size={15} /> Settings
            </button>
            <button
              className="user-menu-item"
              onClick={() => {
                setOpen(false);
                navigate("/settings");
              }}
              type="button"
            >
              <User size={15} /> Profile
            </button>
            <button className="user-menu-item danger" onClick={logout} type="button">
              <LogOut size={15} /> Log out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
