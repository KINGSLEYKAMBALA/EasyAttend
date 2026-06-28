import { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, RefreshControl,
} from "react-native";
import { collection, getDocs, orderBy, query, limit } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "../firebaseConfig";
import { useRouter } from "expo-router";
import { useTheme } from "../context/ThemeContext";

const LAST_READ_KEY = "@easyattend_notif_last_read";

// Map each source to an icon, colour and label
const SOURCE_META = {
  venue:     { icon: "🏫", color: "#e67e22", bg: "#3d2a0a", label: "New Venue" },
  session:   { icon: "📋", color: "#3b82f6", bg: "#1e3a5f", label: "New Session" },
  timetable: { icon: "📅", color: "#10b981", bg: "#0d3326", label: "Timetable Update" },
  student:   { icon: "🎓", color: "#a855f7", bg: "#2d1b4e", label: "New Student" },
  attendance:{ icon: "✅", color: "#28a745", bg: "#0d3326", label: "Attendance Recorded" },
};

function timeAgo(isoString) {
  if (!isoString) return "Unknown time";
  const diff = Date.now() - new Date(isoString).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "Just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(isoString).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function buildNotification(doc, source) {
  const d = doc.data();
  const meta = SOURCE_META[source];
  let title = "";
  let body  = "";

  switch (source) {
    case "venue":
      title = `New venue added: ${d.name || "Unnamed"}`;
      body  = d.building ? `Building: ${d.building}` : "A new exam/class venue is now available.";
      break;
    case "session":
      title = `Session started: ${d.courseCode || "Unknown course"}`;
      body  = `${d.courseName || ""}${d.date ? ` · ${d.date}` : ""}${d.venueName || d.venue?.name ? ` · ${d.venueName || d.venue?.name}` : ""}`.trim();
      break;
    case "timetable":
      title = `Timetable entry: ${d.courseCode || "Unknown"}`;
      body  = `${d.courseName || ""}${d.day ? ` · ${d.day}` : ""}${d.startTime ? ` ${d.startTime}–${d.endTime || ""}` : ""}`.trim();
      break;
    case "student":
      title = `New student registered: ${d.name || d.fullName || d.regNumber || "Unknown"}`;
      body  = `${d.programme || ""}${d.regNumber ? ` · ${d.regNumber}` : ""}`.trim();
      break;
    case "attendance":
      title = `Attendance recorded: ${d.courseCode || d.courseName || "Session"}`;
      body  = `${d.name || d.studentName || ""} · ${d.status || "present"} · ${d.venueName || ""}`.trim();
      break;
    default:
      title = "New event";
      body  = "";
  }

  return {
    id:        `${source}_${doc.id}`,
    source,
    icon:      meta.icon,
    color:     meta.color,
    bg:        meta.bg,
    label:     meta.label,
    title:     title || meta.label,
    body,
    timestamp: d.createdAt || d.timestamp || null,
  };
}

async function fetchNotifications() {
  const sources = [
    { col: "venues",     source: "venue",      field: "createdAt" },
    { col: "sessions",   source: "session",    field: "createdAt" },
    { col: "timetable",  source: "timetable",  field: "createdAt" },
    { col: "students",   source: "student",    field: "createdAt" },
    { col: "attendance", source: "attendance", field: "createdAt" },
  ];

  const all = [];
  await Promise.all(
    sources.map(async ({ col, source }) => {
      try {
        const snap = await getDocs(
          query(collection(db, col), limit(20))
        );
        snap.docs.forEach(doc => {
          const n = buildNotification(doc, source);
          if (n.timestamp) all.push(n);
        });
      } catch {
        // silently skip failed collections
      }
    })
  );

  // Sort newest first
  all.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return all.slice(0, 50);
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { theme: t } = useTheme();
  const isDark = t.mode === "dark";

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [lastRead, setLastRead]           = useState(null);

  const load = useCallback(async () => {
    try {
      const [notifs, storedLastRead] = await Promise.all([
        fetchNotifications(),
        AsyncStorage.getItem(LAST_READ_KEY),
      ]);
      setNotifications(notifs);
      setLastRead(storedLastRead ? new Date(storedLastRead) : null);
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    // Mark all as read when screen opens
    AsyncStorage.setItem(LAST_READ_KEY, new Date().toISOString());
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const isUnread = (n) =>
    lastRead === null || (n.timestamp && new Date(n.timestamp) > lastRead);

  const unreadCount = notifications.filter(isUnread).length;

  return (
    <View style={[s.container, { backgroundColor: isDark ? "#0d1117" : "#f1f5f9" }]}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: isDark ? "#161b22" : "#003366", borderBottomColor: isDark ? "#21262d" : "#002244" }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <View style={s.headerBadge}>
            <Text style={s.headerBadgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={[s.centerText, { color: isDark ? "#8b949e" : "#64748b" }]}>Loading notifications…</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={s.center}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🔔</Text>
          <Text style={[s.centerText, { color: isDark ? "#8b949e" : "#64748b" }]}>
            No notifications yet.{"\n"}New events will appear here.
          </Text>
        </View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
          contentContainerStyle={{ paddingVertical: 12 }}
        >
          {unreadCount > 0 && (
            <Text style={[s.sectionHeading, { color: isDark ? "#8b949e" : "#64748b" }]}>
              NEW  ({unreadCount})
            </Text>
          )}
          {notifications.map((n) => {
            const unread = isUnread(n);
            return (
              <View
                key={n.id}
                style={[
                  s.card,
                  {
                    backgroundColor: isDark ? "#161b22" : "#ffffff",
                    borderColor: unread
                      ? n.color
                      : (isDark ? "#21262d" : "#e2e8f0"),
                    borderLeftWidth: unread ? 3 : 1,
                  },
                ]}
              >
                {/* Icon */}
                <View style={[s.iconCircle, { backgroundColor: n.bg }]}>
                  <Text style={{ fontSize: 20 }}>{n.icon}</Text>
                </View>

                {/* Content */}
                <View style={{ flex: 1 }}>
                  <View style={s.titleRow}>
                    <View style={[s.labelBadge, { backgroundColor: n.bg, borderColor: n.color }]}>
                      <Text style={[s.labelText, { color: n.color }]}>{n.label}</Text>
                    </View>
                    {unread && <View style={[s.dot, { backgroundColor: n.color }]} />}
                  </View>
                  <Text style={[s.cardTitle, { color: isDark ? "#e6edf3" : "#0f172a" }]}>{n.title}</Text>
                  {!!n.body && (
                    <Text style={[s.cardBody, { color: isDark ? "#8b949e" : "#64748b" }]} numberOfLines={2}>{n.body}</Text>
                  )}
                  <Text style={[s.cardTime, { color: isDark ? "#445566" : "#94a3b8" }]}>{timeAgo(n.timestamp)}</Text>
                </View>
              </View>
            );
          })}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1 },
  header:         { paddingTop: 52, paddingBottom: 14, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1 },
  backBtn:        { color: "#a0c4ff", fontSize: 16 },
  headerTitle:    { color: "#ffffff", fontSize: 18, fontWeight: "bold", flex: 1 },
  headerBadge:    { backgroundColor: "#ef4444", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  headerBadgeText:{ color: "#ffffff", fontSize: 12, fontWeight: "bold" },
  center:         { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  centerText:     { fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 22 },
  sectionHeading: { fontSize: 11, fontWeight: "bold", letterSpacing: 1.2, paddingHorizontal: 16, marginBottom: 6, marginTop: 4 },

  card:           { marginHorizontal: 16, marginBottom: 10, borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "flex-start", gap: 12, borderWidth: 1 },
  iconCircle:     { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  titleRow:       { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  labelBadge:     { borderRadius: 10, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  labelText:      { fontSize: 10, fontWeight: "bold" },
  dot:            { width: 8, height: 8, borderRadius: 4 },
  cardTitle:      { fontSize: 14, fontWeight: "600", lineHeight: 20 },
  cardBody:       { fontSize: 12, marginTop: 3, lineHeight: 17 },
  cardTime:       { fontSize: 11, marginTop: 5 },
});
