import { useState, useEffect, useRef } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useLocation } from "react-router-dom";
import { LogOut, User, ChevronDown } from "lucide-react";

const PAGE_TITLES = {
  "/":             "Dashboard",
  "/timetable":    "Timetable",
  "/sessions":     "Sessions",
  "/instructors":  "Instructors",
  "/students":     "Students",
  "/venues":       "Venues",
  "/reports":      "Reports",
  "/create-admin": "Create Admin",
};

export default function TopBar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const dropRef = useRef(null);

  const email       = auth.currentUser?.email || "";
  const initials    = email.slice(0, 2).toUpperCase();
  const displayName = email.split("@")[0].replace(/\./g, " ").replace(/\b\w/g, c => c.toUpperCase());
  const pageTitle   = PAGE_TITLES[location.pathname] || "EasyAttend";

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    await signOut(auth);
  };

  return (
    <div style={s.bar}>
      {/* Page title */}
      <div>
        <h2 style={s.title}>{pageTitle}</h2>
        <p style={s.date}>{new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      {/* Avatar + dropdown */}
      <div style={s.avatarWrapper} ref={dropRef}>
        <button style={s.avatarBtn} onClick={() => setOpen(!open)}>
          <div style={s.avatar}>{initials}</div>
          <div style={s.nameBlock}>
            <span style={s.name}>{displayName}</span>
            <span style={s.role}>Administrator</span>
          </div>
          <ChevronDown size={16} color="#64748b" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
        </button>

        {open && (
          <div style={s.dropdown}>
            {/* User info */}
            <div style={s.dropHeader}>
              <div style={s.dropAvatar}>{initials}</div>
              <div>
                <div style={s.dropName}>{displayName}</div>
                <div style={s.dropEmail}>{email}</div>
                <span style={s.adminBadge}>Admin</span>
              </div>
            </div>
            <div style={s.dropDivider} />
            <div style={s.dropItem}>
              <User size={15} color="#64748b" />
              <span>My Profile</span>
            </div>
            <div style={s.dropDivider} />
            <button style={s.logoutItem} onClick={handleLogout}>
              <LogOut size={15} color="#c0392b" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  bar: {
    height: "64px",
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
    zIndex: 100,
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  title:  { fontSize: "18px", fontWeight: "700", color: "#0f172a", margin: 0 },
  date:   { fontSize: "12px", color: "#94a3b8", margin: 0, marginTop: "2px" },

  avatarWrapper: { position: "relative" },
  avatarBtn: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "none",
    border: "1px solid #e2e8f0",
    borderRadius: "40px",
    padding: "6px 14px 6px 6px",
    cursor: "pointer",
    transition: "background 0.15s",
  },
  avatar: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    backgroundColor: "#003366",
    color: "#fff",
    fontWeight: "bold",
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  nameBlock: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
  name:  { fontSize: "13px", fontWeight: "600", color: "#0f172a", lineHeight: 1.2 },
  role:  { fontSize: "11px", color: "#94a3b8", lineHeight: 1.2 },

  dropdown: {
    position: "absolute",
    top: "calc(100% + 8px)",
    right: 0,
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    minWidth: "220px",
    overflow: "hidden",
    zIndex: 200,
  },
  dropHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "16px",
  },
  dropAvatar: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    backgroundColor: "#003366",
    color: "#fff",
    fontWeight: "bold",
    fontSize: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  dropName:  { fontSize: "14px", fontWeight: "600", color: "#0f172a" },
  dropEmail: { fontSize: "12px", color: "#94a3b8", marginTop: "2px" },
  adminBadge: {
    display: "inline-block",
    marginTop: "4px",
    backgroundColor: "#e8f0fe",
    color: "#003366",
    fontSize: "10px",
    fontWeight: "700",
    padding: "2px 8px",
    borderRadius: "10px",
    letterSpacing: "0.5px",
  },
  dropDivider: { height: "1px", backgroundColor: "#f1f5f9" },
  dropItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 16px",
    fontSize: "13px",
    color: "#374151",
    cursor: "pointer",
  },
  logoutItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 16px",
    fontSize: "13px",
    color: "#c0392b",
    fontWeight: "600",
    cursor: "pointer",
    width: "100%",
    background: "none",
    border: "none",
    textAlign: "left",
  },
};
