import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, CalendarDays, BookOpen,
  GraduationCap, Users, Building2, BarChart3,
  ShieldCheck, ChevronLeft, ChevronRight,
} from "lucide-react";

const menuItems = [
  { path: "/",             icon: LayoutDashboard, label: "Dashboard"    },
  { path: "/timetable",   icon: CalendarDays,     label: "Timetable"   },
  { path: "/sessions",    icon: BookOpen,          label: "Sessions"    },
  { path: "/instructors", icon: GraduationCap,     label: "Instructors" },
  { path: "/students",    icon: Users,             label: "Students"    },
  { path: "/venues",      icon: Building2,         label: "Venues"      },
  { path: "/reports",     icon: BarChart3,         label: "Reports"     },
  { path: "/create-admin",icon: ShieldCheck,       label: "Create Admin"},
];

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const w = collapsed ? "68px" : "240px";

  return (
    <div style={{ ...styles.sidebar, width: w, minWidth: w }}>

      {/* Logo + toggle */}
      <div style={{ ...styles.logoRow, justifyContent: collapsed ? "center" : "space-between" }}>
        {!collapsed && (
          <div style={styles.logoInner}>
            <div style={styles.logoCircle}>EA</div>
            <div>
              <div style={styles.logoText}>EasyAttend</div>
              <div style={styles.logoSub}>Admin Panel</div>
            </div>
          </div>
        )}
        <button
          style={styles.toggleBtn}
          onClick={onToggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed
            ? <ChevronRight size={16} color="#8899bb" />
            : <ChevronLeft  size={16} color="#8899bb" />
          }
        </button>
      </div>

      {/* Menu */}
      <nav style={styles.nav}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              style={{
                ...styles.menuItem,
                ...(isActive ? styles.menuItemActive : {}),
                justifyContent: collapsed ? "center" : "flex-start",
                padding: collapsed ? "12px" : "11px 16px",
              }}
            >
              <Icon size={18} strokeWidth={2} style={{ flexShrink: 0 }} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

    </div>
  );
}

const styles = {
  sidebar: {
    height: "100vh",
    position: "sticky",
    top: 0,
    flexShrink: 0,
    backgroundColor: "#0d1b3e",
    display: "flex",
    flexDirection: "column",
    padding: "0",
    overflowY: "auto",
    overflowX: "hidden",
    transition: "width 0.22s ease, min-width 0.22s ease",
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 12px",
    borderBottom: "1px solid #1e2d4a",
    marginBottom: "8px",
    gap: "8px",
  },
  logoInner: { display: "flex", alignItems: "center", gap: "10px", overflow: "hidden" },
  logoCircle: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: "#28a745",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontWeight: "bold",
    fontSize: "14px",
    flexShrink: 0,
  },
  logoText: { color: "#ffffff", fontWeight: "bold", fontSize: "14px", whiteSpace: "nowrap" },
  logoSub:  { color: "#8899bb", fontSize: "10px", whiteSpace: "nowrap" },
  toggleBtn: {
    background: "#1e2d4a",
    border: "none",
    borderRadius: "6px",
    padding: "6px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  nav: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    padding: "0 8px",
  },
  menuItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    borderRadius: "8px",
    color: "#8899bb",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "500",
    whiteSpace: "nowrap",
    overflow: "hidden",
  },
  menuItemActive: {
    backgroundColor: "#28a745",
    color: "#ffffff",
  },
};
