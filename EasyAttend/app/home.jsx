import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useTheme } from "../context/ThemeContext";

const MENU = [
  {
    route: "/timetable",
    icon: "📅",
    label: "View Available Classes",
    desc: "Browse and initiate your scheduled sessions",
    accent: "#3b82f6",
    accentBg: "#1e3a5f",
  },
  {
    route: "/idattendance",
    icon: "🪪",
    label: "ID Attendance",
    desc: "Scan student ID barcodes with geofencing",
    accent: "#10b981",
    accentBg: "#0d3326",
  },
  {
    route: "/performance",
    icon: "📊",
    label: "Student Performance",
    desc: "Marks and attendance analytics per student",
    accent: "#a855f7",
    accentBg: "#2d1b4e",
  },
  {
    route: "/report",
    icon: "📄",
    label: "View Reports",
    desc: "Session summaries and PDF download",
    accent: "#f59e0b",
    accentBg: "#3d2a0a",
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { theme: t, toggleTheme } = useTheme();
  const email = auth.currentUser?.email || "Instructor";
  const displayName = email.split("@")[0].replace(/\./g, " ").replace(/\b\w/g, c => c.toUpperCase());

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/");
  };

  const isDark = t.mode === "dark";

  return (
    <View style={[s.root, { backgroundColor: isDark ? "#0d1117" : "#f1f5f9" }]}>

      {/* Scrollable content */}
      <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>

        {/* Top bar */}
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
          <TouchableOpacity style={[s.themeBtn, { backgroundColor: isDark ? "#21262d" : "#f1f5f9" }]} onPress={toggleTheme}>
            <Text style={{ fontSize: 18 }}>{t.toggleIcon}</Text>
          </TouchableOpacity>
        </View>

        {/* Profile card */}
        <View style={[s.profileCard, { backgroundColor: isDark ? "#161b22" : "#ffffff", borderColor: isDark ? "#21262d" : "#e2e8f0" }]}>
          <View style={s.avatarCircle}>
            <Text style={s.avatarText}>{displayName.charAt(0)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.profileName, { color: isDark ? "#ffffff" : "#0f172a" }]}>{displayName}</Text>
            <Text style={[s.profileEmail, { color: isDark ? "#8b949e" : "#64748b" }]}>{email}</Text>
            <View style={s.badgeRow}>
              <View style={s.roleBadge}>
                <Text style={s.roleBadgeText}>Instructor</Text>
              </View>
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
            onPress={() => router.push(item.route)}
            activeOpacity={0.75}
          >
            <View style={[s.cardIcon, { backgroundColor: item.accentBg }]}>
              <Text style={{ fontSize: 22 }}>{item.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.cardLabel, { color: isDark ? "#e6edf3" : "#0f172a" }]}>{item.label}</Text>
              <Text style={[s.cardDesc, { color: isDark ? "#8b949e" : "#64748b" }]}>{item.desc}</Text>
            </View>
            <Text style={[s.cardArrow, { color: item.accent }]}>›</Text>
          </TouchableOpacity>
        ))}

      </ScrollView>

      {/* Sign Out — pinned to bottom, never scrolls */}
      <View style={[s.logoutBar, { backgroundColor: isDark ? "#0d1117" : "#f1f5f9", borderTopColor: isDark ? "#21262d" : "#e2e8f0" }]}>
        <TouchableOpacity
          style={[s.logoutBtn, { backgroundColor: isDark ? "#1c0a0a" : "#fff0f0", borderColor: "#c0392b" }]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={s.logoutIcon}>🚪</Text>
          <Text style={s.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1 },

  // Top bar
  topBar:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 52, paddingBottom: 14, paddingHorizontal: 16, borderBottomWidth: 1 },
  logoRow:       { flexDirection: "row", alignItems: "center", gap: 10 },
  logoBadge:     { width: 38, height: 38, borderRadius: 10, backgroundColor: "#10b981", alignItems: "center", justifyContent: "center" },
  logoText:      { color: "#ffffff", fontWeight: "bold", fontSize: 15 },
  appName:       { fontSize: 17, fontWeight: "bold" },
  appSub:        { fontSize: 11, marginTop: 1 },
  themeBtn:      { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },

  // Profile
  profileCard:   { margin: 16, borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 1 },
  avatarCircle:  { width: 52, height: 52, borderRadius: 26, backgroundColor: "#10b981", alignItems: "center", justifyContent: "center" },
  avatarText:    { color: "#ffffff", fontSize: 22, fontWeight: "bold" },
  profileName:   { fontSize: 16, fontWeight: "bold" },
  profileEmail:  { fontSize: 12, marginTop: 2 },
  badgeRow:      { flexDirection: "row", marginTop: 6 },
  roleBadge:     { backgroundColor: "#0d3326", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, borderWidth: 1, borderColor: "#10b981" },
  roleBadgeText: { color: "#10b981", fontSize: 11, fontWeight: "bold" },

  // Section
  sectionHeading:{ fontSize: 11, fontWeight: "bold", letterSpacing: 1.2, paddingHorizontal: 16, marginBottom: 8, marginTop: 4 },

  // Cards
  card:          { marginHorizontal: 16, marginBottom: 10, borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 1 },
  cardIcon:      { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cardLabel:     { fontSize: 15, fontWeight: "600" },
  cardDesc:      { fontSize: 12, marginTop: 3, lineHeight: 16 },
  cardArrow:     { fontSize: 26, fontWeight: "bold" },

  // Logout bar pinned at bottom
  logoutBar:     { borderTopWidth: 1, padding: 12 },
  logoutBtn:     { borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1 },
  logoutIcon:    { fontSize: 20 },
  logoutText:    { color: "#c0392b", fontSize: 15, fontWeight: "600" },
});
