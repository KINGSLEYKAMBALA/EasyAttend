import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert,
  ActivityIndicator
} from "react-native";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useRouter, useLocalSearchParams } from "expo-router";

const getStudentName = (student) => student.name || student.fullName || "Unnamed student";
const getRegNumber = (student) => student.regNumber || student.studentId || student.id;
const getStudentProgram = (student) => student.programName || student.programme || "";

export default function ManualScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [query, setQuery] = useState("");
  const [allStudents, setAllStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [results, setResults] = useState([]);
  const [marked, setMarked] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const studentsSnap = await getDocs(collection(db, "students"));
      const studentsList = studentsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAllStudents(studentsList);

      const coursesSnap = await getDocs(collection(db, "courses"));
      const coursesList = coursesSnap.docs.map((d) => d.data());
      setCourses(coursesList);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load student data.");
    }
    setLoading(false);
  };

  const handleSearch = (text) => {
    setQuery(text);
    if (text.length < 2) {
      setResults([]);
      return;
    }
    const lower = text.toLowerCase();
    const filtered = allStudents.filter(
      (s) =>
        getStudentName(s).toLowerCase().includes(lower) ||
        getRegNumber(s)?.toLowerCase().includes(lower) ||
        s.courseCode?.toLowerCase().includes(lower)
    );
    setResults(filtered);
  };

  const getCourseInfo = (courseCode) => {
    return courses.find((c) => c.courseCode === courseCode);
  };

  const toggleMark = (studentId) => {
    setMarked((prev) => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  const markedCount = Object.values(marked).filter(Boolean).length;

  const handleSubmitAttendance = async () => {
    const markedStudentIds = Object.keys(marked).filter((id) => marked[id]);
    if (markedStudentIds.length === 0) {
      Alert.alert("Nothing to submit", "Mark at least one student as present first.");
      return;
    }

    setSubmitting(true);
    try {
      const now = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

      for (const studentId of markedStudentIds) {
        const student = allStudents.find((s) => s.id === studentId);
        if (!student) continue;
        const studentName = getStudentName(student);
        const regNumber = getRegNumber(student);
        const courseCode = params.courseCode || student.courseCode || "";

        await addDoc(collection(db, "attendance"), {
          sessionId: params.sessionId || null,
          studentId: student.id,
          name: studentName,
          studentName,
          regNumber,
          courseCode,
          courseName: params.courseName || getCourseInfo(courseCode)?.courseName || "",
          status: "present",
          checkInTime: now,
          method: "manual",
          createdAt: new Date().toISOString(),
          timestamp: new Date().toISOString(),
        });
      }

      Alert.alert(
        "Attendance Recorded",
        `${markedStudentIds.length} student(s) marked present`,
        [{ text: "Done", onPress: () => { setMarked({}); setQuery(""); setResults([]); } }]
      );
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save attendance.");
    }
    setSubmitting(false);
  };

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manual Search</Text>
      </View>

      {/* Search Box */}
      <View style={styles.searchBox}>
        <TextInput
          style={styles.input}
          placeholder="Search by name, reg number, or course code..."
          placeholderTextColor="#999"
          value={query}
          onChangeText={handleSearch}
        />
      </View>

      {/* Results */}
      {loading ? (
        <ActivityIndicator color="#28a745" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView style={styles.results}>
          {query.length < 2 && (
            <Text style={styles.hint}>
              Type at least 2 characters to search students...
            </Text>
          )}

          {query.length >= 2 && results.length === 0 && (
            <Text style={styles.hint}>No students found.</Text>
          )}

          {results.map((student) => {
            const courseInfo = getCourseInfo(student.courseCode);
            const isMarked = marked[student.id];
            return (
              <View key={student.id} style={styles.studentCard}>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{getStudentName(student)}</Text>
                  <Text style={styles.studentId}>Reg No: {getRegNumber(student)}</Text>
                  <Text style={styles.studentCourse}>
                    {student.courseCode} - {courseInfo?.courseName || "Unknown Course"}
                  </Text>
                  <Text style={styles.studentProgram}>
                    {getStudentProgram(student)} - Level {student.classLevel || "N/A"}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.markButton, isMarked && styles.markedButton]}
                  onPress={() => toggleMark(student.id)}
                >
                  <Text style={styles.markButtonText}>
                    {isMarked ? "Present" : "Mark Present"}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Footer submit */}
      {markedCount > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmitAttendance}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>
                Submit Attendance ({markedCount} marked)
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f4f8",
  },
  header: {
    backgroundColor: "#003366",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  backBtn: {
    color: "#a0c4ff",
    fontSize: 16,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  searchBox: {
    padding: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  input: {
    backgroundColor: "#f0f4f8",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: "#000",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  results: {
    flex: 1,
    padding: 16,
  },
  hint: {
    color: "#999",
    textAlign: "center",
    marginTop: 40,
    fontSize: 14,
  },
  studentCard: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#003366",
  },
  studentId: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  studentCourse: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  studentProgram: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  markButton: {
    backgroundColor: "#003366",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  markedButton: {
    backgroundColor: "#28a745",
  },
  markButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "bold",
  },
  footer: {
    backgroundColor: "#0a0f1e",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#2a3f5f",
  },
  submitButton: {
    backgroundColor: "#28a745",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "bold",
  },
});
