import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useRouter, useLocalSearchParams } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

// Set this to your API server's local network IP and port.
// Example: "http://192.168.1.10:4000"
const API_BASE = "http://192.168.160.187:4000";

const getRecordName = (record) => record.name || record.studentName || "Unnamed student";
const getRecordId = (record) => record.regNumber || record.studentId || record.id;
const isPresent = (record) => String(record.status || "").toLowerCase() === "present";
const getVenueName = (session) => session.venueName || session.venue?.name || "N/A";
const getSessionTime = (session) => session.time || `${session.startTime || ""} - ${session.endTime || ""}`.trim();

export default function ReportScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (selectedSessionId) {
      loadAttendance(selectedSessionId);
    } else {
      setAttendance([]);
    }
  }, [selectedSessionId]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const email = auth.currentUser?.email;
      const sessionQuery = email
        ? query(collection(db, "sessions"), where("instructorEmail", "==", email))
        : collection(db, "sessions");
      const snapshot = await getDocs(sessionQuery);
      const list = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0));

      setSessions(list);
      // If navigated from attendance submit, pre-select that session
      setSelectedSessionId((current) => params.sessionId || current || list[0]?.id || null);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const loadAttendance = async (sessionId) => {
    try {
      const attendanceQuery = query(collection(db, "attendance"), where("sessionId", "==", sessionId));
      const snapshot = await getDocs(attendanceQuery);
      const list = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => getRecordName(a).localeCompare(getRecordName(b)));
      setAttendance(list);
    } catch (error) {
      console.error(error);
      setAttendance([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSessions();
    if (selectedSessionId) {
      await loadAttendance(selectedSessionId);
    }
    setRefreshing(false);
  };

  const selectedSession = sessions.find((session) => session.id === selectedSessionId);

  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    if (!selectedSessionId || downloading) return;
    setDownloading(true);
    try {
      const url = `${API_BASE}/api/sessions/${selectedSessionId}/report`;
      const fileName = `Attendance_${selectedSession?.courseCode || selectedSessionId}_${selectedSession?.date || "report"}.pdf`;
      const fileUri = FileSystem.documentDirectory + fileName;

      const result = await FileSystem.downloadAsync(url, fileUri);
      if (result.status !== 200) throw new Error(`Server returned ${result.status}`);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(result.uri, {
          mimeType: "application/pdf",
          dialogTitle: "Open or save attendance PDF",
        });
      } else {
        Alert.alert("Downloaded", `PDF saved to:\n${result.uri}`);
      }
    } catch (err) {
      Alert.alert("Download Failed", `Could not download the report.\n\nMake sure the API server is running on the same Wi-Fi network.\n\nError: ${err.message}`);
    }
    setDownloading(false);
  };

  const totals = useMemo(() => {
    const present = attendance.filter(isPresent).length;
    return {
      present,
      absent: attendance.length - present,
      total: attendance.length,
    };
  }, [attendance]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance Report</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#28a745" size="large" />
          <Text style={styles.centerText}>Loading reports...</Text>
        </View>
      ) : sessions.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.centerText}>No sessions found for this account.</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sessionTabs}>
            {sessions.map((session) => (
              <TouchableOpacity
                key={session.id}
                style={[
                  styles.sessionTab,
                  selectedSessionId === session.id && styles.sessionTabActive,
                ]}
                onPress={() => setSelectedSessionId(session.id)}
              >
                <Text
                  style={[
                    styles.sessionTabText,
                    selectedSessionId === session.id && styles.sessionTabTextActive,
                  ]}
                >
                  {session.courseCode} | {session.date}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {selectedSession && (
            <View style={styles.sessionBox}>
              <Text style={styles.sessionTitle}>{selectedSession.courseCode} - {selectedSession.courseName}</Text>
              <Text style={styles.sessionText}>Date: {selectedSession.date}</Text>
              <Text style={styles.sessionText}>Time: {getSessionTime(selectedSession)}</Text>
              <Text style={styles.sessionText}>Venue: {getVenueName(selectedSession)}</Text>
              <TouchableOpacity style={[styles.pdfBtn, downloading && { opacity: 0.6 }]} onPress={handleDownloadPDF} disabled={downloading}>
                <Text style={styles.pdfBtnText}>{downloading ? "Generating PDF…" : "⬇️ Download PDF Report"}</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.statsRow}>
            <View style={[styles.statCard, { borderTopColor: "#28a745" }]}>
              <Text style={styles.statNumber}>{totals.present}</Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            <View style={[styles.statCard, { borderTopColor: "#c0392b" }]}>
              <Text style={styles.statNumber}>{totals.absent}</Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
            <View style={[styles.statCard, { borderTopColor: "#003366" }]}>
              <Text style={styles.statNumber}>{totals.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>

          <Text style={styles.listTitle}>Student Records</Text>
          {attendance.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No attendance records found for this session.</Text>
            </View>
          ) : (
            attendance.map((student, index) => (
              <View key={student.id} style={styles.studentRow}>
                <Text style={styles.rowNumber}>{index + 1}</Text>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowName}>{getRecordName(student)}</Text>
                  <Text style={styles.rowId}>{getRecordId(student)}</Text>
                </View>
                <Text style={styles.rowTime}>{student.checkInTime || "-"}</Text>
                <View style={[styles.statusBadge, isPresent(student) ? styles.presentBadge : styles.absentBadge]}>
                  <Text style={styles.statusText}>{isPresent(student) ? "Present" : "Absent"}</Text>
                </View>
              </View>
            ))
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f4f8" },
  header: {
    backgroundColor: "#003366",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  backBtn: { color: "#a0c4ff", fontSize: 16 },
  headerTitle: { color: "#ffffff", fontSize: 18, fontWeight: "bold" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  centerText: { color: "#666", fontSize: 14, marginTop: 12, textAlign: "center" },
  content: { flex: 1 },
  sessionTabs: { paddingHorizontal: 16, paddingVertical: 12 },
  sessionTab: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#d8e0ea",
  },
  sessionTabActive: { backgroundColor: "#003366", borderColor: "#003366" },
  sessionTabText: { color: "#003366", fontSize: 12, fontWeight: "bold" },
  sessionTabTextActive: { color: "#ffffff" },
  sessionBox: {
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: "#d8e0ea",
  },
  sessionTitle: { fontSize: 15, color: "#003366", fontWeight: "bold", marginBottom: 6 },
  sessionText:  { fontSize: 13, color: "#444", marginTop: 2 },
  pdfBtn:       { backgroundColor: "#003366", borderRadius: 8, padding: 12, alignItems: "center", marginTop: 12 },
  pdfBtnText:   { color: "#ffffff", fontSize: 13, fontWeight: "bold" },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 16,
    backgroundColor: "#ffffff",
    marginBottom: 8,
  },
  statCard: {
    alignItems: "center",
    backgroundColor: "#f0f4f8",
    borderRadius: 8,
    padding: 14,
    width: "28%",
    borderTopWidth: 4,
  },
  statNumber: { fontSize: 26, fontWeight: "bold", color: "#003366" },
  statLabel: { fontSize: 12, color: "#666", marginTop: 4 },
  listTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
    marginVertical: 12,
    paddingHorizontal: 16,
  },
  emptyBox: { marginHorizontal: 16, backgroundColor: "#ffffff", borderRadius: 10, padding: 24 },
  emptyText: { textAlign: "center", color: "#777", fontSize: 13 },
  studentRow: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    elevation: 1,
  },
  rowNumber: { fontSize: 13, color: "#999", width: 20 },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 14, fontWeight: "bold", color: "#003366" },
  rowId: { fontSize: 12, color: "#888" },
  rowTime: { fontSize: 12, color: "#666", marginRight: 8 },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  presentBadge: { backgroundColor: "#d4edda" },
  absentBadge: { backgroundColor: "#f8d7da" },
  statusText: { fontSize: 11, fontWeight: "bold", color: "#333" },
});
