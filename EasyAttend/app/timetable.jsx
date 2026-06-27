import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from "react-native";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { useRouter } from "expo-router";
import { useTheme } from "../context/ThemeContext";

const DAY_ORDER = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;
  let h = parseInt(match[1]), m = parseInt(match[2]);
  const ampm = match[3].toUpperCase();
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

function getTodayName() {
  return ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date().getDay()];
}
function isWeekend() {
  const d = new Date().getDay();
  return d === 0 || d === 6; // Sunday=0, Saturday=6
}
function getNowMinutes() { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); }

function getSessionStatus(entry, nowMinutes) {
  const today = getTodayName();
  if (entry.dayOfWeek !== today) return { label: entry.dayOfWeek, type: "other_day" };
  const start = parseTimeToMinutes(entry.startTime);
  const end   = parseTimeToMinutes(entry.endTime);
  if (nowMinutes < start) {
    const diff = start - nowMinutes;
    return { label: diff < 60 ? `Starts in ${diff} min` : `Starts in ${Math.floor(diff/60)}h ${diff%60}m`, type: "upcoming" };
  }
  if (nowMinutes <= end) {
    const rem = end - nowMinutes;
    return { label: rem < 60 ? `🔴 Live · ${rem} min left` : `🔴 Live · ${Math.floor(rem/60)}h ${rem%60}m left`, type: "live" };
  }
  return { label: "Ended", type: "ended" };
}

export default function TimetableScreen() {
  const router = useRouter();
  const { theme: t } = useTheme();
  const isDark = t.mode === "dark";
  const bg      = isDark ? "#0d1117" : "#f1f5f9";
  const surface = isDark ? "#161b22" : "#ffffff";
  const border  = isDark ? "#21262d" : "#e2e8f0";
  const text    = isDark ? "#e6edf3" : "#0f172a";
  const sub     = isDark ? "#8b949e" : "#64748b";
  const accent  = "#10b981";

  const [instructor, setInstructor] = useState(null);
  const [sessions, setSessions]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState(null);
  const [nowMinutes, setNowMinutes] = useState(getNowMinutes());

  useEffect(() => {
    const timer = setInterval(() => setNowMinutes(getNowMinutes()), 60000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true); setError(null);
    try {
      const email = auth.currentUser?.email;
      if (!email) { setError("Not logged in."); setLoading(false); return; }
      const instSnap = await getDocs(query(collection(db, "instructors"), where("email", "==", email)));
      if (instSnap.empty) { setError("No instructor profile found."); setLoading(false); return; }
      const instructorData = instSnap.docs[0].data();
      setInstructor(instructorData);
      const courseCodes = instructorData.courseCodes || (instructorData.courseCode ? [instructorData.courseCode] : []);
      if (!courseCodes.length) { setError("No courses assigned yet. Contact the administrator."); setLoading(false); return; }
      const ttSnap = await getDocs(query(collection(db, "timetable"), where("courseCode", "in", courseCodes)));
      const list = ttSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => {
        const dd = DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek);
        return dd !== 0 ? dd : parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime);
      });
      setSessions(list);
    } catch (err) { setError("Failed to load your classes."); }
    setLoading(false);
  };

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const handleSelectClass = (entry, forceMakeUp = false) => {
    const status = getSessionStatus(entry, nowMinutes);
    // On weekends, only make-up is allowed — skip "Not Today's Class" alert
    if (!forceMakeUp && status.type === "other_day" && !isWeekend()) {
      Alert.alert("Not Today's Class", `${entry.courseCode} is scheduled for ${entry.dayOfWeek}, not today (${getTodayName()}).\n\nYou can only initiate attendance for today's classes.`, [{ text: "OK" }]);
      return;
    }
    router.push({
      pathname: "/session",
      params: {
        timetableId: entry.id, courseCode: entry.courseCode,
        courseName: entry.courseName || entry.courseCode,
        venueName: entry.venueName, dayOfWeek: entry.dayOfWeek,
        startTime: entry.startTime, endTime: entry.endTime,
        programName: entry.programme || "", classLevel: "", semester: "",
        statusType: status.type, statusLabel: status.label,
        isMakeUp: forceMakeUp || isWeekend() ? "true" : "false",
      },
    });
  };

  if (loading) return (
    <View style={[s.center, { backgroundColor: bg }]}>
      <ActivityIndicator size="large" color={accent} />
      <Text style={[s.centerText, { color: sub }]}>Loading your classes…</Text>
    </View>
  );
  if (error) return (
    <View style={[s.center, { backgroundColor: bg }]}>
      <Text style={[s.centerText, { color: "#f85149" }]}>{error}</Text>
      <TouchableOpacity style={[s.retryBtn, { backgroundColor: accent }]} onPress={loadData}>
        <Text style={{ color: "#fff", fontWeight: "bold" }}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  const today = getTodayName();
  const todaySessions = sessions.filter(s => s.dayOfWeek === today);
  const otherSessions = sessions.filter(s => s.dayOfWeek !== today);

  const renderCard = (entry) => {
    const status = getSessionStatus(entry, nowMinutes);
    const isLive   = status.type === "live";
    const isEnded  = status.type === "ended";
    const isToday  = entry.dayOfWeek === today;
    const isOther  = status.type === "other_day";

    const cardBorder = isLive ? accent : isEnded ? "#30363d" : isToday ? "#3b82f6" : border;
    const badgeBg    = isLive ? "#0d3326" : status.type === "upcoming" ? "#1c1a0d" : isEnded ? "#1c1010" : isDark ? "#1c2433" : "#e8f0fe";
    const badgeColor = isLive ? accent : status.type === "upcoming" ? "#f59e0b" : isEnded ? "#8b949e" : "#3b82f6";

    return (
      <View key={entry.id} style={[s.card, { backgroundColor: surface, borderColor: cardBorder }]}>
        <View style={s.cardHead}>
          <View>
            <Text style={[s.courseCode, { color: isLive ? accent : text }]}>{entry.courseCode}</Text>
            <Text style={[s.programme, { color: sub }]}>{entry.programme}</Text>
          </View>
          <View style={[s.statusBadge, { backgroundColor: badgeBg, borderColor: badgeColor }]}>
            <Text style={[s.statusText, { color: badgeColor }]}>{status.label}</Text>
          </View>
        </View>

        {isLive && (() => {
          const pct = Math.min(100, Math.round(((nowMinutes - parseTimeToMinutes(entry.startTime)) / (parseTimeToMinutes(entry.endTime) - parseTimeToMinutes(entry.startTime))) * 100));
          return <View style={s.progressBg}><View style={[s.progressFill, { width: `${pct}%` }]} /></View>;
        })()}

        <View style={s.detailRow}>
          <Text style={[s.detail, { color: sub }]}>📅 {entry.dayOfWeek}</Text>
          <Text style={[s.detail, { color: sub }]}>🕐 {entry.startTime} – {entry.endTime}</Text>
        </View>
        <View style={s.detailRow}>
          <Text style={[s.detail, { color: sub }]}>🏫 {entry.venueName}</Text>
        </View>

        {/* Weekend: make-up only button */}
        {isWeekend() ? (
          <TouchableOpacity
            style={[s.initiateBtn, { backgroundColor: "#7c3aed" }]}
            onPress={() => handleSelectClass(entry, true)}
          >
            <Text style={[s.initiateBtnText, { color: "#fff" }]}>📋 Schedule Make-Up Class</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[s.initiateBtn, { backgroundColor: isLive ? accent : isEnded ? "#21262d" : isOther ? "#21262d" : "#3b82f6" }]}
            onPress={() => handleSelectClass(entry)}
          >
            <Text style={[s.initiateBtnText, { color: isEnded || isOther ? sub : "#fff" }]}>
              {isLive ? "▶ Take Attendance Now" : "Initiate / Start Class"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={[s.root, { backgroundColor: bg }]}>
      <View style={[s.header, { backgroundColor: isDark ? "#161b22" : "#0f172a", borderBottomColor: border }]}>
        <Text style={s.headerTitle}>My Classes</Text>
        <Text style={s.headerSub}>{auth.currentUser?.email}</Text>
        {instructor && <Text style={[s.headerCodes, { color: accent }]} numberOfLines={2}>{(instructor.courseCodes || [instructor.courseCode]).join(" · ")}</Text>}
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />}>

        {/* Weekend banner */}
        {isWeekend() && (
          <View style={[s.weekendBanner, { backgroundColor: isDark ? "#1e1040" : "#ede9fe", borderColor: "#7c3aed" }]}>
            <Text style={[s.weekendBannerTitle, { color: "#7c3aed" }]}>📋 Weekend — Make-Up Classes Only</Text>
            <Text style={[s.weekendBannerSub, { color: isDark ? "#c4b5fd" : "#6d28d9" }]}>
              Today is {today}. Regular attendance is not available. You may schedule a make-up class for any of your courses below.
            </Text>
          </View>
        )}

        {!isWeekend() && todaySessions.length > 0 && (
          <>
            <View style={s.sectionRow}>
              <Text style={[s.sectionLabel, { color: text }]}>📅 Today — {today}</Text>
              <View style={[s.pill, { backgroundColor: accent }]}><Text style={s.pillText}>{todaySessions.length} class{todaySessions.length !== 1 ? "es" : ""}</Text></View>
            </View>
            {todaySessions.map(renderCard)}
          </>
        )}
        {!isWeekend() && todaySessions.length === 0 && (
          <View style={[s.emptyBox, { backgroundColor: surface, borderColor: border }]}>
            <Text style={[s.emptyText, { color: sub }]}>📭 No classes today ({today})</Text>
          </View>
        )}

        {/* On weekends show all courses; on weekdays show other-day sessions */}
        {sessions.length > 0 && (
          <>
            <Text style={[s.sectionLabel, { marginTop: isWeekend() ? 0 : 20, color: isWeekend() ? "#7c3aed" : sub }]}>
              {isWeekend() ? "Your Courses" : "Other Days"}
            </Text>
            {(isWeekend() ? sessions : otherSessions).map(renderCard)}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1 },
  center:       { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  centerText:   { marginTop: 12, fontSize: 14, textAlign: "center" },
  retryBtn:     { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  header:       { paddingTop: 52, paddingBottom: 18, paddingHorizontal: 16, borderBottomWidth: 1 },
  headerTitle:  { color: "#ffffff", fontSize: 20, fontWeight: "bold" },
  headerSub:    { color: "#8b949e", fontSize: 12, marginTop: 2 },
  headerCodes:  { fontSize: 11, fontWeight: "600", marginTop: 6 },
  sectionRow:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionLabel: { fontSize: 14, fontWeight: "bold" },
  pill:         { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  pillText:     { color: "#fff", fontSize: 11, fontWeight: "bold" },
  emptyBox:          { borderRadius: 14, padding: 20, alignItems: "center", marginBottom: 20, borderWidth: 1 },
  emptyText:         { fontSize: 13 },
  weekendBanner:     { borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderLeftWidth: 4 },
  weekendBannerTitle:{ fontSize: 14, fontWeight: "bold", marginBottom: 4 },
  weekendBannerSub:  { fontSize: 12, lineHeight: 17 },
  card:         { borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderLeftWidth: 3 },
  cardHead:     { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  courseCode:   { fontSize: 15, fontWeight: "bold" },
  programme:    { fontSize: 11, marginTop: 2 },
  statusBadge:  { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, maxWidth: 200 },
  statusText:   { fontSize: 11, fontWeight: "bold" },
  progressBg:   { height: 4, backgroundColor: "#21262d", borderRadius: 2, marginBottom: 10, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#10b981", borderRadius: 2 },
  detailRow:    { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  detail:       { fontSize: 12 },
  initiateBtn:  { borderRadius: 10, paddingVertical: 11, alignItems: "center", marginTop: 12 },
  initiateBtnText: { fontSize: 13, fontWeight: "bold" },
});
