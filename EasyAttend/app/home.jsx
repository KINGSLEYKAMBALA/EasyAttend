import { useState, useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Modal, Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { useTheme } from "../context/ThemeContext";
import { collection, getDocs, query, limit } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LAST_READ_KEY = "@easyattend_notif_last_read";

const MENU = [
  { route: "/timetable",     icon: "📅", label: "View Available Classes",  desc: "Browse and initiate your scheduled sessions", accent: "#3b82f6", accentBg: "#1e3a5f" },
  { route: "/idattendance",  icon: "🪪", label: "ID Attendance",           desc: "Scan student ID barcodes with geofencing",   accent: "#10b981", accentBg: "#0d3326" },
  { route: "/performance",   icon: "📊", label: "Student Performance",     desc: "Marks and attendance analytics per student",  accent: "#a855f7", accentBg: "#2d1b4e" },
  { route: "/report",        icon: "📄", label: "View Reports",            desc: "Session summaries and PDF download",          accent: "#f59e0b", accentBg: "#3d2a0a" },
  { route: "/notifications", icon: "🔔", label: "Notifications",           desc: "New venues, sessions and system events",      accent: "#ef4444", accentBg: "#3a0a0a", notifKey: true },
];

export default function HomeScreen() {
  const router = useRouter();
  const { theme: t, toggleTheme } = useTheme();
  const email       = auth.currentUser?.email || "Instructor";
  const displayName = email.split("@")[0].replace(/\./g, " ").replace(/\b\w/g, c => c.toUpperCase());
  const initials    = displayName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const [unreadCount, setUnreadCount]   = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isDark = t.mode === "dark";

  useEffect(() => { loadUnreadCount(); }, []);

  const loadUnreadCount = async () => {
    try {
      const lastReadStr = await AsyncStorage.getItem(LAST_READ_KEY);
      const lastRead    = lastReadStr ? new Date(lastReadStr) : null;
      const COLS        = ["venues", "sessions", "timetable", "students", "attendance"];
      let count = 0;
      await Promise.all(COLS.map(async (col) => {
        try {
          const snap = await getDocs(query(collection(db, col), limit(20)));
          snap.docs.forEach(d => {
            const ts = d.data().createdAt || d.data().timestamp;
            if (ts && (!lastRead || new Date(ts) > lastRead)) count++;
          });
        } catch { /* skip */ }
      }));
      setUnreadCount(count);
    } catch { /* ignore */ }
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
    await signOut(auth);
    router.replace("/");
  };

  return (
    <View style={[s.root, { backgroundColor: isDark ? "#0d1117" : "#f1f5f9" }]}>

      {/* ── Top bar ── */}
      <View style={[s.topBar, { backgroundColor: isDark ? "#161b22" : "#ffffff", borderBottomColor: isDark ? "#21262d" : "#e2e8f0" }]}>
        <View style={s.logoRow}>
          <View style={s.logoBadge}>
            <Text style={s.logoText}>EA</Text>
          </View>
          <View>
            <Text style={[s.appName, { color: isDark ? "#ffffff" : "#0f172a" }]}>EasyAttend</Text>
            <Text style={[s.appSub, { color: isDark ? "#8b949e" : "#64748b" }]}>Mzuzu University</Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {/* Theme toggle */}
          <TouchableOpacity
            style={[s.themeBtn, { backgroundColor: isDark ? "#21262d" : "#f1f5f9" }]}
            onPress={toggleTheme}
          >
            <Text style={{ fontSize: 18 }}>{t.toggleIcon}</Text>
          </TouchableOpacity>

          {/* Avatar — opens dropdown */}
          <TouchableOpacity style={s.avatarBtn} onPress={() => setDropdownOpen(true)} activeOpacity={0.8}>
            <Text style={s.avatarBtnText}>{initials}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Avatar dropdown modal ── */}
      <Modal visible={dropdownOpen} transparent animationType="fade" onRequestClose={() => setDropdownOpen(false)}>
        <Pressable style={s.dropOverlay} onPress={() => setDropdownOpen(false)}>
          <View style={[s.dropdown, { backgroundColor: isDark ? "#161b22" : "#ffffff", borderColor: isDark ? "#21262d" : "#e2e8f0" }]}>
            {/* User info */}
            <View style={s.dropHeader}>
              <View style={s.dropAvatar}>
                <Text style={s.dropAvatarText}>{initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.dropName, { color: isDark ? "#ffffff" : "#0f172a" }]}>{displayName}</Text>
                <Text style={[s.dropEmail, { color: isDark ? "#8b949e" : "#64748b" }]}>{email}</Text>
              </View>
            </View>
            <View style={[s.dropDivider, { backgroundColor: isDark ? "#21262d" : "#e2e8f0" }]} />
            {/* Role badge */}
            <View style={s.dropBadgeRow}>
              <View style={s.roleBadge}><Text style={s.roleBadgeText}>Instructor</Text></View>
            </View>
            <View style={[s.dropDivider, { backgroundColor: isDark ? "#21262d" : "#e2e8f0" }]} />
            {/* Sign out */}
            <TouchableOpacity style={s.dropLogout} onPress={handleLogout} activeOpacity={0.8}>
              <Text style={s.dropLogoutIcon}>🚪</Text>
              <Text style={s.dropLogoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* ── Scrollable content ── */}
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>

        {/* Profile card */}
        <View style={[s.profileCard, { backgroundColor: isDark ? "#161b22" : "#ffffff", borderColor: isDark ? "#21262d" : "#e2e8f0" }]}>
          <View style={s.profileAvatar}>
            <Text style={s.profileAvatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.profileName, { color: isDark ? "#ffffff" : "#0f172a" }]}>{displayName}</Text>
            <Text style={[s.profileEmail, { color: isDark ? "#8b949e" : "#64748b" }]}>{email}</Text>
            <View style={s.badgeRow}>
              <View style={s.roleBadge}><Text style={s.roleBadgeText}>Instructor</Text></View>
            </View>
          </View>
        </View>

        {/* Section heading */}
        <Text style={[s.sectionHeading, { color: isDark ? "#8b949e" : "#64748b" }]}>QUICK ACTIONS</Text>

        {/* Menu cards */}
        {MENU.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={[s.card, { backgroundColor: isDark ? "#161b22" : "#ffffff", borderColor: isDark ? "#21262d" : "#e2e8f0" }]}
            onPress={() => {
              if (item.notifKey) setUnreadCount(0);
              router.push(item.route);
            }}
            activeOpacity={0.75}
          >
            <View style={[s.cardIcon, { backgroundColor: item.accentBg }]}>
              <Text style={{ fontSize: 22 }}>{item.icon}</Text>
              {item.notifKey && unreadCount > 0 && (
                <View style={s.notifDot}>
                  <Text style={s.notifDotText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
                </View>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.cardLabel, { color: isDark ? "#e6edf3" : "#0f172a" }]}>{item.label}</Text>
              <Text style={[s.cardDesc, { color: isDark ? "#8b949e" : "#64748b" }]}>{item.desc}</Text>
            </View>
            <Text style={[s.cardArrow, { color: item.accent }]}>›</Text>
          </TouchableOpacity>
        ))}

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  // Top bar
  topBar:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 52, paddingBottom: 14, paddingHorizontal: 16, borderBottomWidth: 1 },
  logoRow:      { flexDirection: "row", alignItems: "center", gap: 10 },
  logoBadge:    { width: 38, height: 38, borderRadius: 10, backgroundColor: "#10b981", alignItems: "center", justifyContent: "center" },
  logoText:     { color: "#ffffff", fontWeight: "bold", fontSize: 15 },
  appName:      { fontSize: 17, fontWeight: "bold" },
  appSub:       { fontSize: 11, marginTop: 1 },
  themeBtn:     { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },

  // Avatar button in topbar
  avatarBtn:     { width: 38, height: 38, borderRadius: 19, backgroundColor: "#10b981", alignItems: "center", justifyContent: "center" },
  avatarBtnText: { color: "#ffffff", fontWeight: "bold", fontSize: 14 },

  // Dropdown
  dropOverlay:   { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-start", alignItems: "flex-end", paddingTop: 100, paddingRight: 16 },
  dropdown:      { width: 260, borderRadius: 16, borderWidth: 1, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 },
  dropHeader:    { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  dropAvatar:    { width: 44, height: 44, borderRadius: 22, backgroundColor: "#10b981", alignItems: "center", justifyContent: "center" },
  dropAvatarText:{ color: "#ffffff", fontWeight: "bold", fontSize: 16 },
  dropName:      { fontSize: 14, fontWeight: "bold" },
  dropEmail:     { fontSize: 11, marginTop: 2 },
  dropDivider:   { height: 1 },
  dropBadgeRow:  { paddingHorizontal: 16, paddingVertical: 10 },
  dropLogout:    { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  dropLogoutIcon:{ fontSize: 18 },
  dropLogoutText:{ color: "#c0392b", fontSize: 15, fontWeight: "600" },

  // Profile card
  profileCard:    { margin: 16, borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 1 },
  profileAvatar:  { width: 52, height: 52, borderRadius: 26, backgroundColor: "#10b981", alignItems: "center", justifyContent: "center" },
  profileAvatarText: { color: "#ffffff", fontSize: 22, fontWeight: "bold" },
  profileName:    { fontSize: 16, fontWeight: "bold" },
  profileEmail:   { fontSize: 12, marginTop: 2 },
  badgeRow:       { flexDirection: "row", marginTop: 6 },
  roleBadge:      { backgroundColor: "#0d3326", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, borderWidth: 1, borderColor: "#10b981" },
  roleBadgeText:  { color: "#10b981", fontSize: 11, fontWeight: "bold" },

  // Section
  sectionHeading: { fontSize: 11, fontWeight: "bold", letterSpacing: 1.2, paddingHorizontal: 16, marginBottom: 8, marginTop: 4 },

  // Cards
  card:          { marginHorizontal: 16, marginBottom: 10, borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 1 },
  cardIcon:      { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cardLabel:     { fontSize: 15, fontWeight: "600" },
  cardDesc:      { fontSize: 12, marginTop: 3, lineHeight: 16 },
  cardArrow:     { fontSize: 26, fontWeight: "bold" },
  notifDot:      { position: "absolute", top: -4, right: -4, backgroundColor: "#ef4444", borderRadius: 10, minWidth: 18, height: 18, alignItems: "center", justifyContent: "center", paddingHorizontal: 4, borderWidth: 2, borderColor: "#0d1117" },
  notifDotText:  { color: "#ffffff", fontSize: 9, fontWeight: "bold" },
});
