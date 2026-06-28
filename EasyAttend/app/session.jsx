import { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity,
  StyleSheet, ScrollView, Alert,
  ActivityIndicator, Modal, TextInput
} from "react-native";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { useRouter, useLocalSearchParams } from "expo-router";

const getStudentName = (student) => student.name || student.fullName || "Unnamed student";

export default function SessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [registeredStudents, setRegisteredStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [starting, setStarting] = useState(false);
  const [makeUpModalVisible, setMakeUpModalVisible] = useState(false);
  const [makeUpDate, setMakeUpDate] = useState("");
  const [dateError, setDateError]   = useState("");
  const [makeUpReason, setMakeUpReason] = useState("");

  useEffect(() => {
    fetchRegisteredStudents();
    // If arriving from weekend timetable, auto-open make-up modal
    if (params.isMakeUp === "true") {
      setMakeUpModalVisible(true);
    }
  }, []);

  const fetchRegisteredStudents = async () => {
    setLoadingStudents(true);
    try {
      const studentsQuery = query(collection(db, "students"), where("courseCode", "==", params.courseCode));
      const snapshot = await getDocs(studentsQuery);
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setRegisteredStudents(list);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load registered students.");
    }
    setLoadingStudents(false);
  };

  const startSession = async (isMakeUp = false, extra = {}) => {
    setStarting(true);
    try {
      const sessionData = {
        timetableId: params.timetableId,
        courseCode: params.courseCode,
        courseName: params.courseName,
        venueName: params.venueName,
        venue: {
          name: params.venueName,
        },
        dayOfWeek: params.dayOfWeek,
        startTime: params.startTime,
        endTime: params.endTime,
        time: `${params.startTime || ""} - ${params.endTime || ""}`,
        programName: params.programName,
        classLevel: params.classLevel,
        semester: params.semester,
        date: extra.date || new Date().toISOString().split("T")[0],
        isMakeUp,
        makeUpReason: extra.reason || null,
        instructorEmail: auth.currentUser?.email,
        expectedStudents: registeredStudents.length,
        status: "active",
        attendanceCount: 0,
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, "sessions"), sessionData);

      router.push({
        pathname: "/attendance",
        params: {
          sessionId: docRef.id,
          courseCode: params.courseCode,
          courseName: params.courseName,
          venueName: params.venueName,
        },
      });
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to start attendance. Try again.");
    }
    setStarting(false);
  };

  const handleInitiateSession = () => startSession(false);

  // Auto-format input as YYYY-MM-DD while typing
  const handleDateChange = (text) => {
    // Strip non-digits
    const digits = text.replace(/\D/g, "").slice(0, 8);
    let formatted = digits;
    if (digits.length > 4) formatted = digits.slice(0, 4) + "-" + digits.slice(4);
    if (digits.length > 6) formatted = digits.slice(0, 4) + "-" + digits.slice(4, 6) + "-" + digits.slice(6);
    setMakeUpDate(formatted);

    // Validate when full date entered
    if (formatted.length === 10) {
      const d = new Date(formatted);
      const [y, m, day] = formatted.split("-").map(Number);
      if (isNaN(d.getTime()) || d.getFullYear() !== y || d.getMonth() + 1 !== m || d.getDate() !== day) {
        setDateError("Invalid date. Please check the day/month.");
      } else if (d < new Date(new Date().setHours(0,0,0,0))) {
        setDateError("Date cannot be in the past.");
      } else {
        setDateError("");
      }
    } else {
      setDateError("");
    }
  };

  const handleConfirmMakeUp = () => {
    if (!makeUpDate || makeUpDate.length < 10) {
      Alert.alert("Missing Date", "Please enter a valid date (YYYY-MM-DD).");
      return;
    }
    if (dateError) {
      Alert.alert("Invalid Date", dateError);
      return;
    }
    setMakeUpModalVisible(false);
    startSession(true, { date: makeUpDate, reason: makeUpReason });
  };

  const isLive = params.statusType === "live";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Class Details</Text>
      </View>

      <ScrollView style={styles.scroll}>
        <View style={styles.infoCard}>
          <View style={styles.infoCardTopRow}>
            <Text style={styles.courseCode}>{params.courseCode}</Text>
            <View style={[
              styles.statusBadge,
              params.statusType === "live" && styles.statusLive,
              params.statusType === "upcoming" && styles.statusUpcoming,
              params.statusType === "ended" && styles.statusEnded,
            ]}>
              <Text style={styles.statusBadgeText}>{params.statusLabel}</Text>
            </View>
          </View>

          <Text style={styles.courseName}>{params.courseName}</Text>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>🎓 Program</Text>
            <Text style={styles.detailValue}>{params.programName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📊 Level / Semester</Text>
            <Text style={styles.detailValue}>Level {params.classLevel}, Semester {params.semester}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📅 Day</Text>
            <Text style={styles.detailValue}>{params.dayOfWeek}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>🕐 Time</Text>
            <Text style={styles.detailValue}>{params.startTime} - {params.endTime}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>🏫 Venue</Text>
            <Text style={styles.detailValue}>{params.venueName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>👥 Registered Students</Text>
            <Text style={styles.detailValue}>{loadingStudents ? "..." : registeredStudents.length}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Registered Students</Text>

        {loadingStudents ? (
          <ActivityIndicator color="#28a745" style={{ marginTop: 20 }} />
        ) : registeredStudents.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No students registered for this course yet.</Text>
          </View>
        ) : (
          <View style={styles.studentsListCard}>
            {registeredStudents.map((student) => (
              <View key={student.id} style={styles.studentRow}>
                <Text style={styles.studentName}>{getStudentName(student)}</Text>
                <Text style={styles.studentReg}>{student.regNumber}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.startButton, !isLive && styles.startButtonSecondary]}
          onPress={() => {
            if (params.statusType === "ended") {
              Alert.alert(
                "Class Has Ended",
                "This class session has already ended. You cannot start a regular session.\n\nPlease use the Make-Up Class option below.",
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Schedule Make-Up", onPress: () => setMakeUpModalVisible(true) },
                ]
              );
            } else {
              handleInitiateSession();
            }
          }}
          disabled={starting || loadingStudents}
        >
          {starting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.startButtonText}>
              {isLive ? "✅ Initiate / Start Session" : "▶️ Start Session Anyway"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.makeUpButton}
          onPress={() => setMakeUpModalVisible(true)}
          disabled={starting}
        >
          <Text style={styles.makeUpButtonText}>🔁 Make Up Class</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={makeUpModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Schedule Make-Up Class</Text>

            <Text style={styles.modalLabel}>DATE</Text>
            <TextInput
              style={[styles.modalInput, dateError ? { borderColor: "#e74c3c", borderWidth: 1 } : {}]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#555"
              value={makeUpDate}
              onChangeText={handleDateChange}
              keyboardType="numeric"
              maxLength={10}
            />
            {dateError ? (
              <Text style={{ color: "#e74c3c", fontSize: 11, marginBottom: 8, marginTop: -4 }}>{dateError}</Text>
            ) : makeUpDate.length === 10 && !dateError ? (
              <Text style={{ color: "#28a745", fontSize: 11, marginBottom: 8, marginTop: -4 }}>✓ Valid date</Text>
            ) : null}

            <Text style={styles.modalLabel}>REASON (OPTIONAL)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Public holiday missed"
              placeholderTextColor="#555"
              value={makeUpReason}
              onChangeText={setMakeUpReason}
            />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setMakeUpModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleConfirmMakeUp}>
                <Text style={styles.modalConfirmText}>Start Make-Up Session</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0f1e" },
  header: {
    backgroundColor: "#0d1b3e", paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16,
    flexDirection: "row", alignItems: "center", gap: 16,
  },
  backBtn: { color: "#a0c4ff", fontSize: 16 },
  headerTitle: { color: "#ffffff", fontSize: 18, fontWeight: "bold" },
  scroll: { flex: 1, padding: 16 },
  infoCard: {
    backgroundColor: "#131c30", borderRadius: 14, padding: 18, marginBottom: 24,
    borderWidth: 1, borderColor: "#28a745",
  },
  infoCardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  courseCode: { color: "#a0c4ff", fontSize: 13, fontWeight: "bold", letterSpacing: 0.5 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: "#2a3f5f" },
  statusLive: { backgroundColor: "#1a3a2a", borderWidth: 1, borderColor: "#28a745" },
  statusUpcoming: { backgroundColor: "#3a2f1a", borderWidth: 1, borderColor: "#e6a23c" },
  statusEnded: { backgroundColor: "#3a1a1a", borderWidth: 1, borderColor: "#8b4444" },
  statusBadgeText: { color: "#ffffff", fontSize: 11, fontWeight: "bold" },
  courseName: { color: "#ffffff", fontSize: 20, fontWeight: "bold", marginTop: 4, marginBottom: 12 },
  divider: { height: 1, backgroundColor: "#2a3f5f", marginBottom: 12 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  detailLabel: { color: "#8899bb", fontSize: 13 },
  detailValue: { color: "#ffffff", fontSize: 13, fontWeight: "600", flexShrink: 1, textAlign: "right", marginLeft: 10 },
  sectionTitle: { color: "#ffffff", fontSize: 15, fontWeight: "bold", marginBottom: 12 },
  emptyState: { padding: 30, alignItems: "center", backgroundColor: "#131c30", borderRadius: 12 },
  emptyStateText: { color: "#8899bb", fontSize: 13, textAlign: "center" },
  studentsListCard: { backgroundColor: "#131c30", borderRadius: 12, padding: 8, marginBottom: 10 },
  studentRow: {
    flexDirection: "row", justifyContent: "space-between", paddingVertical: 10,
    paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: "#1a2540",
  },
  studentName: { color: "#ffffff", fontSize: 13 },
  studentReg: { color: "#8899bb", fontSize: 12 },
  startButton: {
    backgroundColor: "#28a745", borderRadius: 10, padding: 18, alignItems: "center",
    marginTop: 16, shadowColor: "#28a745", shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
  },
  startButtonSecondary: { backgroundColor: "#3a5f8f" },
  startButtonText: { color: "#ffffff", fontSize: 15, fontWeight: "bold" },
  makeUpButton: {
    backgroundColor: "#131c30", borderRadius: 10, padding: 16, alignItems: "center",
    marginTop: 12, borderWidth: 1, borderColor: "#e6a23c",
  },
  makeUpButtonText: { color: "#e6a23c", fontSize: 14, fontWeight: "bold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 24 },
  modalCard: { backgroundColor: "#131c30", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#2a3f5f" },
  modalTitle: { color: "#ffffff", fontSize: 17, fontWeight: "bold", marginBottom: 16 },
  modalLabel: { fontSize: 11, fontWeight: "bold", color: "#8899bb", letterSpacing: 1, marginBottom: 6, marginTop: 10 },
  modalInput: {
    backgroundColor: "#0d1b3e", borderRadius: 10, padding: 12, fontSize: 14,
    color: "#ffffff", borderWidth: 1, borderColor: "#2a3f5f",
  },
  modalButtonRow: { flexDirection: "row", gap: 10, marginTop: 20 },
  modalCancelBtn: { flex: 1, padding: 14, borderRadius: 10, alignItems: "center", backgroundColor: "#2a3f5f" },
  modalCancelText: { color: "#ffffff", fontWeight: "bold" },
  modalConfirmBtn: { flex: 1.5, padding: 14, borderRadius: 10, alignItems: "center", backgroundColor: "#e6a23c" },
  modalConfirmText: { color: "#0a0f1e", fontWeight: "bold" },
});
