import { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity,
  StyleSheet, ScrollView, Alert,
  ActivityIndicator
} from "react-native";
import { collection, query, where, getDocs, doc, updateDoc, addDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "../context/ThemeContext";

const getStudentName = (student) => student.name || student.fullName || "Unnamed student";
const getRegNumber = (student) => student.regNumber || student.studentId || student.id;

export default function AttendanceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme: t } = useTheme();

  const [students, setStudents] = useState([]);
  const [checkedIn, setCheckedIn] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const studentsQuery = query(collection(db, "students"), where("courseCode", "==", params.courseCode));
      const snapshot = await getDocs(studentsQuery);
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setStudents(list);

      // Start with everyone unchecked (absent by default)
      const initialState = {};
      list.forEach((s) => { initialState[s.id] = false; });
      setCheckedIn(initialState);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load students.");
    }
    setLoading(false);
  };

  const toggleStudent = (studentId) => {
    setCheckedIn((prev) => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  const presentCount = Object.values(checkedIn).filter(Boolean).length;
  const absentCount = students.length - presentCount;

  const handleSubmitAttendance = async () => {
    setSaving(true);
    try {
      const now = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

      for (const student of students) {
        const isPresent = checkedIn[student.id];
        const studentName = getStudentName(student);
        const regNumber = getRegNumber(student);
        await addDoc(collection(db, "attendance"), {
          sessionId: params.sessionId,
          studentId: student.id,
          name: studentName,
          studentName,
          regNumber,
          courseCode: params.courseCode,
          courseName: params.courseName || "",
          status: isPresent ? "present" : "absent",
          checkInTime: isPresent ? now : null,
          method: "checklist",
          createdAt: new Date().toISOString(),
          timestamp: new Date().toISOString(),
        });
      }

      // Update session with final counts
      await updateDoc(doc(db, "sessions", params.sessionId), {
        attendanceCount: presentCount,
        status: "completed",
        completedAt: new Date().toISOString(),
      });

      Alert.alert(
        "✅ Attendance Submitted",
        `Attendance has been successfully submitted.\n\n${presentCount} Present  ·  ${absentCount} Absent  ·  ${students.length} Total`,
        [
          { text: "Done", style: "cancel" },
          {
            text: "View Report & Download PDF",
            onPress: () => router.replace({
              pathname: "/report",
              params: { sessionId: params.sessionId },
            }),
          },
        ]
      );
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save attendance.");
    }
    setSaving(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <View style={[styles.header, { backgroundColor: t.header }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Take Attendance</Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, styles.presentCard]}>
          <Text style={styles.summaryNumber}>{presentCount}</Text>
          <Text style={styles.summaryLabel}>Present</Text>
        </View>
        <View style={[styles.summaryCard, styles.absentCard]}>
          <Text style={styles.summaryNumber}>{absentCount}</Text>
          <Text style={styles.summaryLabel}>Absent</Text>
        </View>
        <View style={[styles.summaryCard, styles.totalCard]}>
          <Text style={styles.summaryNumber}>{students.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color="#28a745" style={{ marginTop: 40 }} />
      ) : students.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No students registered for this course.</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll}>
          <View style={styles.toolRow}>
            <TouchableOpacity
              style={styles.toolButton}
              onPress={() => router.push({
                pathname: "/scan",
                params: {
                  sessionId: params.sessionId,
                  courseCode: params.courseCode,
                  courseName: params.courseName,
                },
              })}
            >
              <Text style={styles.toolButtonText}>Scan ID</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.toolButton}
              onPress={() => router.push({
                pathname: "/manual",
                params: {
                  sessionId: params.sessionId,
                  courseCode: params.courseCode,
                  courseName: params.courseName,
                },
              })}
            >
              <Text style={styles.toolButtonText}>Manual Search</Text>
            </TouchableOpacity>
          </View>
          {students.map((student) => {
            const isChecked = checkedIn[student.id];
            return (
              <TouchableOpacity
                key={student.id}
                style={[styles.studentRow, { backgroundColor: t.card, borderColor: t.border }, isChecked && styles.studentRowChecked]}
                onPress={() => toggleStudent(student.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                  {isChecked && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={styles.studentInfo}>
                  <Text style={[styles.studentName, { color: t.text }]}>{getStudentName(student)}</Text>
                  <Text style={[styles.studentReg, { color: t.subtext }]}>{getRegNumber(student)}</Text>
                </View>
                <Text style={[styles.statusText, isChecked ? styles.presentText : styles.absentText]}>
                  {isChecked ? "Present" : "Absent"}
                </Text>
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {!loading && students.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmitAttendance}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Attendance</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: "#0d1117" },
  header:           { backgroundColor: "#161b22", paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 16, borderBottomWidth: 1, borderBottomColor: "#21262d" },
  backBtn:          { color: "#10b981", fontSize: 16 },
  headerTitle:      { color: "#e6edf3", fontSize: 18, fontWeight: "bold" },
  summaryRow:       { flexDirection: "row", padding: 16, gap: 10 },
  summaryCard:      { flex: 1, borderRadius: 12, padding: 16, alignItems: "center", borderWidth: 1 },
  presentCard:      { backgroundColor: "#0d3326", borderColor: "#10b981" },
  absentCard:       { backgroundColor: "#2a0d0d", borderColor: "#f85149" },
  totalCard:        { backgroundColor: "#161b22", borderColor: "#21262d" },
  summaryNumber:    { color: "#e6edf3", fontSize: 24, fontWeight: "bold" },
  summaryLabel:     { color: "#8b949e", fontSize: 12, marginTop: 4 },
  scroll:           { flex: 1, paddingHorizontal: 16 },
  toolRow:          { flexDirection: "row", gap: 10, marginBottom: 12 },
  toolButton:       { flex: 1, backgroundColor: "#161b22", borderRadius: 10, paddingVertical: 12, alignItems: "center", borderWidth: 1, borderColor: "#21262d" },
  toolButtonText:   { color: "#3b82f6", fontSize: 13, fontWeight: "bold" },
  emptyState:       { padding: 40, alignItems: "center" },
  emptyStateText:   { color: "#8b949e", fontSize: 14, textAlign: "center" },
  studentRow:       { flexDirection: "row", alignItems: "center", backgroundColor: "#161b22", borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#21262d" },
  studentRowChecked:{ borderColor: "#10b981", backgroundColor: "#0d2a1e" },
  checkbox:         { width: 26, height: 26, borderRadius: 6, borderWidth: 2, borderColor: "#30363d", justifyContent: "center", alignItems: "center", marginRight: 14 },
  checkboxChecked:  { backgroundColor: "#10b981", borderColor: "#10b981" },
  checkmark:        { color: "#ffffff", fontWeight: "bold", fontSize: 16 },
  studentInfo:      { flex: 1 },
  studentName:      { color: "#e6edf3", fontSize: 14, fontWeight: "600" },
  studentReg:       { color: "#8b949e", fontSize: 12, marginTop: 2 },
  statusText:       { fontSize: 12, fontWeight: "bold" },
  presentText:      { color: "#10b981" },
  absentText:       { color: "#f85149" },
  footer:           { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#0d1117", padding: 16, borderTopWidth: 1, borderTopColor: "#21262d" },
  submitButton:     { backgroundColor: "#10b981", borderRadius: 12, padding: 16, alignItems: "center",
  },
  submitButtonText: { color: "#ffffff", fontSize: 15, fontWeight: "bold" },
});
