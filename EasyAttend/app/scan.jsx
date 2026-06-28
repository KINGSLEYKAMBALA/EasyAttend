import { useState, useEffect } from "react";
import {
  View, Text, StyleSheet,
  TouchableOpacity, Alert
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter, useLocalSearchParams } from "expo-router";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

const getStudentName = (student) => student.name || student.fullName || "Unnamed student";
const getRegNumber = (student) => student.regNumber || student.studentId || "";
const getStudentProgram = (student) => student.programName || student.programme || "";

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleScanned = async ({ data }) => {
    if (scanned || scanning) return;
    setScanned(true);
    setScanning(true);

    try {
      const raw = data.trim();

      // Parse barcode: may encode "REG|Name|Programme" or just "REG"
      const DELIMITERS = ["|", ";", ",", "\t"];
      let parts = null;
      for (const sep of DELIMITERS) {
        if (raw.includes(sep)) { parts = raw.split(sep).map(p => p.trim()); break; }
      }
      const barcodeReg  = parts ? parts[0] : raw;
      const barcodeName = parts && parts[1] ? parts[1] : null;
      const barcodeProg = parts && parts[2] ? parts[2] : null;

      // Normalize for Firestore lookup
      const normalize = (str) => str.replace(/[\s\/\-\.]/g, "").toUpperCase();
      const code = normalize(barcodeReg);

      // Try Firestore (best-effort)
      let snapshot = await getDocs(query(collection(db, "students"), where("barcode", "==", raw)));
      if (snapshot.empty) snapshot = await getDocs(query(collection(db, "students"), where("regNumber", "==", barcodeReg)));
      if (snapshot.empty) snapshot = await getDocs(query(collection(db, "students"), where("regNumber", "==", code)));
      if (snapshot.empty) {
        const allSnap = await getDocs(collection(db, "students"));
        const match = allSnap.docs.find(d => {
          const reg = normalize(d.data().regNumber || "");
          const bar = normalize(d.data().barcode   || "");
          return reg === code || bar === code;
        });
        if (match) snapshot = { empty: false, docs: [match] };
      }

      // Build record — Firestore takes priority, barcode data as fallback
      const firestoreStudent = snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
      const studentName = firestoreStudent
        ? getStudentName(firestoreStudent)
        : (barcodeName || "Unknown");
      const regNumber  = firestoreStudent ? getRegNumber(firestoreStudent) : barcodeReg;
      const programme  = firestoreStudent ? getStudentProgram(firestoreStudent) : (barcodeProg || "");

      await addDoc(collection(db, "attendance"), {
        studentId: firestoreStudent?.id || regNumber,
        name: studentName,
        studentName,
        regNumber,
        programme,
        sessionId: params.sessionId || "",
        courseCode: params.courseCode || "",
        courseName: params.courseName || "",
        checkInTime: new Date().toLocaleTimeString(),
        timestamp: new Date().toISOString(),
        method: "barcode",
        status: "present",
        scannedFromBarcode: !firestoreStudent,
        createdAt: new Date().toISOString(),
      });

      Alert.alert(
        "Attendance Recorded ✅",
        `Name: ${studentName}\nReg No: ${regNumber}${programme ? `\nProgramme: ${programme}` : ""}`,
        [
          { text: "Scan Next", onPress: () => { setScanned(false); setScanning(false); } },
          { text: "Done", onPress: () => router.back() }
        ]
      );

    } catch (error) {
      Alert.alert("Error", "Failed to record attendance. Try again.");
      setScanned(false);
      setScanning(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Requesting camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>
          Camera access is needed to scan barcodes.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={requestPermission}>
          <Text style={styles.buttonText}>Allow Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Student ID</Text>
      </View>

      {/* Session Info */}
      {params.courseCode && (
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionText}>
            {params.courseCode} - {params.courseName}
          </Text>
        </View>
      )}

      {/* Camera */}
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleScanned}
        barcodeScannerSettings={{
          barcodeTypes: [
            "code128",
            "code39",
            "code93",
            "ean13",
            "ean8",
            "upc_a",
            "upc_e",
            "qr",
          ],
        }}
      />

      {/* Scan Frame Overlay */}
      <View style={styles.overlay}>
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Point camera at barcode on student ID card
        </Text>
        {scanned && (
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              setScanned(false);
              setScanning(false);
            }}>
            <Text style={styles.buttonText}>Tap to Scan Again</Text>
          </TouchableOpacity>
        )}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    backgroundColor: "#0d1b3e",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    zIndex: 10,
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
  sessionInfo: {
    backgroundColor: "#1a3a2a",
    padding: 10,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#28a745",
    zIndex: 10,
  },
  sessionText: {
    color: "#28a745",
    fontSize: 13,
    fontWeight: "bold",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
  },
  scanFrame: {
    width: 280,
    height: 120,
    position: "relative",
    marginTop: 80,
  },
  corner: {
    position: "absolute",
    width: 24,
    height: 24,
    borderColor: "#28a745",
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  footer: {
    backgroundColor: "#0d1b3e",
    padding: 24,
    alignItems: "center",
    zIndex: 10,
  },
  footerText: {
    color: "#a0c4ff",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 12,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#0d1b3e",
  },
  message: {
    color: "#ffffff",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#28a745",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
