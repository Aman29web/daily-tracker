import { NavLink } from "react-router-dom";
import { MOBILE_NAV_ITEMS } from "../constants/navigation";
import "./MobileNav.css";

export default function MobileNav() {
  return (
    <nav className="mobile-nav">
      <div className="mobile-nav-scroll">
        {MOBILE_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => "mobile-nav-link" + (isActive ? " active" : "")}
          >
            <item.icon size={20} strokeWidth={2.1} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
