import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import MobileNav from "./MobileNav";
import QuickAddModal from "../features/quickadd/QuickAddModal";
import SearchModal from "../features/search/SearchModal";
import { useUiStore } from "../stores/uiStore";
import "./AppShell.css";

export default function AppShell() {
  const location = useLocation();
  const setSearchOpen = useUiStore((s) => s.setSearchOpen);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setSearchOpen]);

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-shell-main">
        <Topbar />
        <main className="app-shell-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <MobileNav />
      <QuickAddModal />
      <SearchModal />
    </div>
  );
}
