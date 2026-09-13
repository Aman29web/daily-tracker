import { NavLink } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { NAV_ITEMS } from "../constants/navigation";
import "./Sidebar.css";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">
          <Sparkles size={18} />
        </div>
        <span>Momentum</span>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}
          >
            <item.icon size={18} strokeWidth={2.1} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <p>Plan → Execute → Track → Reflect</p>
      </div>
    </aside>
  );
}
