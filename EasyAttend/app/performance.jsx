import { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from "react-native";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { useRouter } from "expo-router";
import { useTheme } from "../context/ThemeContext";


export default function PerformanceScreen() {
  const router = useRouter();
  const { theme: t } = useTheme();
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [performance, setPerformance] = useState([]);
  const [totalSessions, setTotalSessions] = useState(0);

  useEffect(() => { loadPerformance(); }, []);

  const loadPerformance = async () => {
    setLoading(true);
    try {
      const email = auth.currentUser?.email;

      // 1. Get instructor's courses
      const instSnap = await getDocs(
        query(collection(db, "instructors"), where("email", "==", email))
      );
      if (instSnap.empty) { setLoading(false); return; }
      const instData = instSnap.docs[0].data();
      const courseCodes = instData.courseCodes || (instData.courseCode ? [instData.courseCode] : []);
      if (courseCodes.length === 0) { setLoading(false); return; }

      // 2. Get completed sessions for these courses
      const sessionsSnap = await getDocs(
        query(
          collection(db, "sessions"),
          where("instructorEmail", "==", email)
        )
      );
      const sessions = sessionsSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((s) => s.status === "completed");

      setTotalSessions(sessions.length);
      if (sessions.length === 0) { setLoading(false); return; }

      const sessionIds = sessions.map((s) => s.id);

      // 3. Get all attendance records for these sessions
      // Firestore 'in' supports up to 30 items; chunk if needed
      const chunkSize = 30;
      let allRecords = [];
      for (let i = 0; i < sessionIds.length; i += chunkSize) {
        const chunk = sessionIds.slice(i, i + chunkSize);
        const attSnap = await getDocs(
          query(collection(db, "attendance"), where("sessionId", "in", chunk))
        );
        allRecords = allRecords.concat(attSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }

      // 4. Group by student
      const studentMap = {};
      for (const record of allRecords) {
        const key = record.studentId || record.regNumber || record.name;
        if (!studentMap[key]) {
          studentMap[key] = {
            name: record.name || record.studentName || "Unknown",
            regNumber: record.regNumber || record.studentId || "",
            attended: 0,
            absences: 0,
          };
        }
        if (String(record.status).toLowerCase() === "present") {
          studentMap[key].attended += 1;
        } else {
          studentMap[key].absences += 1;
        }
      }

      // 5. Compute marks
      // Rule: flat 5 marks total for the whole course
      //       Miss 0 or 1 class → 5 marks
      //       Miss 2 or more classes → 0 marks
      const TOTAL_MARKS = 5;
      const results = Object.values(studentMap).map((s) => {
        const marks    = s.absences >= 2 ? 0 : TOTAL_MARKS;
        const pct      = marks > 0 ? 100 : 0;
        return { ...s, marks, possible: TOTAL_MARKS, pct, penalised: s.absences >= 2 };
      });

      results.sort((a, b) => b.marks - a.marks);
      setPerformance(results);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPerformance();
    setRefreshing(false);
  };

  const grade = (pct) => {
    if (pct >= 80) return { label: "A", color: "#28a745" };
    if (pct >= 65) return { label: "B", color: "#20a8d8" };
    if (pct >= 50) return { label: "C", color: "#e6a23c" };
    if (pct >= 40) return { label: "D", color: "#e67e22" };
    return { label: "F", color: "#c0392b" };
  };

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: t.header }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Student Performance</Text>
      </View>

      {/* Legend */}
      <View style={[styles.legend, { backgroundColor: t.card, borderBottomColor: t.border }]}>
        <Text style={[styles.legendText, { color: t.text }]}>
          ✅ Complete course (miss 0–1 class) = 5 marks  ·  ❌ Miss 2+ classes = 0 marks
        </Text>
        {totalSessions > 0 && (
          <Text style={[styles.legendSub, { color: t.subtext }]}>
            Based on {totalSessions} completed session{totalSessions !== 1 ? "s" : ""}
          </Text>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#28a745" />
          <Text style={[styles.centerText, { color: t.subtext }]}>Calculating performance…</Text>
        </View>
      ) : performance.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.centerText}>
            No completed sessions found yet.{"\n"}Submit attendance to see performance.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#28a745" />}
        >
          {performance.map((student, index) => {
            const g = grade(student.pct);
            return (
              <View key={student.regNumber + index} style={[styles.card, { backgroundColor: t.card }]}>
                {/* Rank + Name */}
                <View style={styles.cardTop}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>#{index + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.studentName, { color: t.text }]}>{student.name}</Text>
                    <Text style={[styles.studentReg, { color: t.subtext }]}>{student.regNumber}</Text>
                  </View>
                  {/* Grade circle */}
                  <View style={[styles.gradeCircle, { backgroundColor: g.color }]}>
                    <Text style={styles.gradeText}>{g.label}</Text>
                  </View>
                </View>

                {/* Progress bar */}
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, { width: `${student.pct}%`, backgroundColor: g.color }]} />
                </View>

                {/* Stats row */}
                <View style={styles.statsRow}>
                  <Text style={styles.statItem}>✅ {student.attended} present</Text>
                  <Text style={[styles.statItem, student.absences >= 2 && styles.penaltyText]}>
                    ❌ {student.absences} absent{student.absences >= 2 ? " (penalised)" : ""}
                  </Text>
                  <Text style={styles.statItem}>
                    {student.marks}/5 marks {student.marks === 5 ? "✅" : "❌"}
                  </Text>
                </View>

                {student.penalised && (
                  <View style={styles.penaltyBanner}>
                    <Text style={styles.penaltyBannerText}>
                      ⚠️ Score = 0 — missed 2 or more classes
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: "#0d1117" },
  header:           { backgroundColor: "#161b22", paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 16, borderBottomWidth: 1, borderBottomColor: "#21262d" },
  backBtn:          { color: "#10b981", fontSize: 16 },
  headerTitle:      { color: "#e6edf3", fontSize: 18, fontWeight: "bold" },
  legend:           { backgroundColor: "#161b22", padding: 12, borderBottomWidth: 1, borderBottomColor: "#21262d", alignItems: "center" },
  legendText:       { color: "#e6edf3", fontSize: 12, fontWeight: "600" },
  legendSub:        { color: "#8b949e", fontSize: 11, marginTop: 2 },
  center:           { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  centerText:       { color: "#8b949e", fontSize: 14, textAlign: "center", marginTop: 12, lineHeight: 22 },
  scroll:           { flex: 1, padding: 16 },

  card:             { backgroundColor: "#161b22", borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#21262d" },
  cardTop:          { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 10 },
  rankBadge:        { backgroundColor: "#10b981", borderRadius: 20, width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  rankText:         { color: "#ffffff", fontSize: 12, fontWeight: "bold" },
  studentName:      { color: "#e6edf3", fontSize: 15, fontWeight: "bold" },
  studentReg:       { color: "#8b949e", fontSize: 12, marginTop: 2 },
  gradeCircle:      { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  gradeText:        { color: "#ffffff", fontSize: 18, fontWeight: "bold" },

  progressBg:       { height: 8, backgroundColor: "#21262d", borderRadius: 4, marginBottom: 10, overflow: "hidden" },
  progressFill:     { height: "100%", borderRadius: 4 },

  statsRow:         { flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", gap: 4 },
  statItem:         { fontSize: 11, color: "#8b949e" },
  penaltyText:      { color: "#f85149", fontWeight: "bold" },
  penaltyBanner:    { backgroundColor: "#2a0d0d", borderRadius: 8, padding: 8, marginTop: 10, borderLeftWidth: 3, borderLeftColor: "#f85149" },
  penaltyBannerText:{ color: "#f85149", fontSize: 12, fontWeight: "600" },
});
