import { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, FlatList,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { collection, getDocs, query, where, addDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { useRouter, useLocalSearchParams } from "expo-router";

// Haversine formula — returns metres
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const getStudentName = (s) => s.name || s.fullName || "Unnamed student";
const getRegNumber  = (s) => s.regNumber || s.studentId || "";

export default function IdAttendanceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Phase: "venue" → "locating" → "scanning"
  const [phase, setPhase]           = useState("venue");
  const [venues, setVenues]         = useState([]);
  const [venuesLoading, setVenuesLoading] = useState(true);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [deviceLocation, setDeviceLocation] = useState(null);
  const [distanceToVenue, setDistanceToVenue] = useState(null);

  // Scanner
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [scanning, setScanning]     = useState(false);
  const [scannedStudents, setScannedStudents] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadVenues();
    if (!cameraPermission?.granted) requestCameraPermission();
  }, []);

  const loadVenues = async () => {
    setVenuesLoading(true);
    try {
      const snap = await getDocs(collection(db, "venues"));
      setVenues(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {
      Alert.alert("Error", "Failed to load venues.");
    }
    setVenuesLoading(false);
  };

  const handleSelectVenue = async (venue) => {
    setSelectedVenue(venue);
    setPhase("locating");

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Location access is required.");
      setPhase("venue");
      return;
    }

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.BestForNavigation,
    });

    const { latitude, longitude } = loc.coords;
    setDeviceLocation({ latitude, longitude });

    const dist = Math.round(
      getDistance(latitude, longitude, parseFloat(venue.latitude), parseFloat(venue.longitude))
    );
    setDistanceToVenue(dist);
    setPhase("scanning");
  };

  const insideZone = distanceToVenue !== null && distanceToVenue <= 200;

  const handleBarcodeScan = async ({ data }) => {
    if (scanning) return;

    // Block scan if outside allowed range
    if (!insideZone) {
      Alert.alert(
        "⚠️ Out of Range",
        `You are ${distanceToVenue}m from the venue.\nYou must be within 200m to scan attendance.`,
        [{ text: "OK" }]
      );
      return;
    }

    setScanning(true);

    try {
      const code = data.trim();
      let snap = await getDocs(query(collection(db, "students"), where("barcode", "==", code)));
      if (snap.empty) {
        snap = await getDocs(query(collection(db, "students"), where("regNumber", "==", code)));
      }

      if (snap.empty) {
        Alert.alert("Not Found", `No student found for: ${data}`, [
          { text: "Scan Again", onPress: () => setScanning(false) },
        ]);
        return;
      }

      const student = { id: snap.docs[0].id, ...snap.docs[0].data() };

      const alreadyScanned = scannedStudents.some((s) => s.id === student.id);
      if (alreadyScanned) {
        Alert.alert("Already Scanned", `${getStudentName(student)} was already recorded.`, [
          { text: "OK", onPress: () => setScanning(false) },
        ]);
        return;
      }

      const withinRange = distanceToVenue !== null && distanceToVenue <= 200;
      setScannedStudents((prev) => [
        {
          id: student.id,
          name: getStudentName(student),
          regNumber: getRegNumber(student),
          programme: student.programme || "",
          distance: distanceToVenue,
          status: withinRange ? "present" : "absent",
          checkInTime: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        },
        ...prev,
      ]);
      setScanning(false);
    } catch {
      Alert.alert("Error", "Failed to look up student.");
      setScanning(false);
    }
  };

  const handleSubmit = async () => {
    if (scannedStudents.length === 0) {
      Alert.alert("No Students", "Scan at least one student before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      for (const s of scannedStudents) {
        await addDoc(collection(db, "attendance"), {
          sessionId: params.sessionId || "",
          studentId: s.id,
          name: s.name,
          studentName: s.name,
          regNumber: s.regNumber,
          courseCode: params.courseCode || "",
          courseName: params.courseName || "",
          checkInTime: s.checkInTime,
          distanceFromVenue: s.distance,
          venueName: selectedVenue?.name || "",
          method: "id_scan",
          status: s.status || "present",
          instructorEmail: auth.currentUser?.email || "",
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        });
      }
      Alert.alert(
        "Attendance Submitted",
        `${scannedStudents.length} student(s) recorded.`,
        [{ text: "Done", onPress: () => router.replace("/home") }]
      );
    } catch {
      Alert.alert("Error", "Failed to submit attendance.");
    }
    setSubmitting(false);
  };

  // ── Venue selection phase ──────────────────────────────────────────────────
  if (phase === "venue") {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ID Attendance</Text>
        </View>

        <View style={styles.phaseLabel}>
          <Text style={styles.phaseLabelText}>Step 1 — Select the venue for this session</Text>
        </View>

        {venuesLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#28a745" size="large" />
          </View>
        ) : venues.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>No venues found. Add venues via the admin dashboard.</Text>
          </View>
        ) : (
          <FlatList
            data={venues}
            keyExtractor={(v) => v.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.venueCard} onPress={() => handleSelectVenue(item)}>
                <View style={styles.venueIcon}>
                  <Text style={{ fontSize: 22 }}>🏫</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.venueName}>{item.name}</Text>
                  <Text style={styles.venueBuilding}>{item.building}</Text>
                  <Text style={styles.venueCoords}>
                    📍 {parseFloat(item.latitude)?.toFixed(5)}, {parseFloat(item.longitude)?.toFixed(5)}
                  </Text>
                </View>
                <Text style={{ color: "#a0c4ff", fontSize: 20 }}>›</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    );
  }

  // ── Locating GPS phase ─────────────────────────────────────────────────────
  if (phase === "locating") {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color="#28a745" size="large" />
        <Text style={[styles.emptyText, { marginTop: 16 }]}>Getting your location…</Text>
      </View>
    );
  }

  // ── Scanning phase ─────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setPhase("venue")}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ID Attendance</Text>
      </View>

      {/* Venue + distance bar */}
      <View style={[styles.distanceBar, insideZone ? styles.distanceBarIn : styles.distanceBarOut]}>
        <Text style={styles.distanceBarVenue}>📍 {selectedVenue?.name}</Text>
        <Text style={styles.distanceBarDist}>
          {insideZone ? "✅" : "⚠️"} {distanceToVenue}m from venue
        </Text>
      </View>

      {/* Camera — blocked if out of range */}
      {!insideZone ? (
        <View style={styles.cameraBlockedBox}>
          <View style={styles.cameraBlockedCircle}>
            <Text style={styles.cameraBlockedCross}>✕</Text>
          </View>
          <Text style={styles.cameraBlockedTitle}>Scanning Blocked</Text>
          <View style={styles.cameraBlockedDistRow}>
            <Text style={styles.cameraBlockedDistNum}>{distanceToVenue}m</Text>
            <Text style={styles.cameraBlockedDistLabel}> away from {selectedVenue?.name}</Text>
          </View>
          <Text style={styles.cameraBlockedSub}>
            📍 Allowed limit is 200m.{"\n"}Move closer to {selectedVenue?.name} to scan.
          </Text>
        </View>
      ) : cameraPermission?.granted ? (
        <View style={styles.cameraBox}>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={scanning ? undefined : handleBarcodeScan}
            barcodeScannerSettings={{
              barcodeTypes: ["code128", "code39", "code93", "ean13", "ean8", "upc_a", "upc_e", "qr"],
            }}
          />
          {/* Scan frame */}
          <View style={styles.scanOverlay}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.tl]} />
              <View style={[styles.corner, styles.tr]} />
              <View style={[styles.corner, styles.bl]} />
              <View style={[styles.corner, styles.br]} />
            </View>
          </View>
          {scanning && (
            <View style={styles.scanningBadge}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.scanningBadgeText}> Looking up student…</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={[styles.cameraBox, styles.center]}>
          <Text style={styles.emptyText}>Camera permission required.</Text>
          <TouchableOpacity style={styles.btn} onPress={requestCameraPermission}>
            <Text style={styles.btnText}>Allow Camera</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Scanned list */}
      <View style={styles.listSection}>
        <Text style={styles.listTitle}>
          Scanned Students ({scannedStudents.length})
        </Text>
        <ScrollView style={styles.listScroll} keyboardShouldPersistTaps="handled">
          {scannedStudents.length === 0 ? (
            <Text style={styles.emptyText}>Point camera at a student ID barcode…</Text>
          ) : (
            scannedStudents.map((s) => {
              const isPresent = s.status === "present";
              return (
                <View
                  key={s.id}
                  style={[
                    styles.studentCard,
                    isPresent ? styles.studentCardPresent : styles.studentCardAbsent,
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.studentName}>{s.name}</Text>
                    <Text style={styles.studentReg}>{s.regNumber}</Text>
                    <Text style={styles.studentTime}>Scanned at {s.checkInTime}</Text>
                    <Text style={[styles.studentStatus, isPresent ? styles.statusPresent : styles.statusAbsent]}>
                      {isPresent ? "✅ Present" : `⚠️ Absent — ${s.distance}m away (limit: 200m)`}
                    </Text>
                  </View>
                  <View style={[styles.distBadge, isPresent ? styles.distBadgeIn : styles.distBadgeOut]}>
                    <Text style={styles.distBadgeText}>{s.distance}m</Text>
                    <Text style={styles.distBadgeLabel}>from venue</Text>
                  </View>
                </View>
              );
            })
          )}
          <View style={{ height: 80 }} />
        </ScrollView>
      </View>

      {/* Submit */}
      {scannedStudents.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Submit {scannedStudents.length} Student(s)</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: "#0a0f1e" },
  header:           { backgroundColor: "#0d1b3e", paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 16 },
  backBtn:          { color: "#a0c4ff", fontSize: 16 },
  headerTitle:      { color: "#ffffff", fontSize: 18, fontWeight: "bold" },
  center:           { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  phaseLabel:       { backgroundColor: "#131c30", padding: 14, borderBottomWidth: 1, borderBottomColor: "#2a3f5f" },
  phaseLabelText:   { color: "#8899bb", fontSize: 13, textAlign: "center" },

  // Venue cards
  venueCard:        { backgroundColor: "#131c30", borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#2a3f5f", gap: 12 },
  venueIcon:        { width: 48, height: 48, borderRadius: 24, backgroundColor: "#1e2d4a", alignItems: "center", justifyContent: "center" },
  venueName:        { color: "#ffffff", fontSize: 15, fontWeight: "bold" },
  venueBuilding:    { color: "#8899bb", fontSize: 12 },
  venueCoords:      { color: "#445566", fontSize: 11 },

  // Distance bar
  distanceBar:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  distanceBarIn:    { backgroundColor: "#1a3a2a", borderBottomColor: "#28a745" },
  distanceBarOut:   { backgroundColor: "#3a1a1a", borderBottomColor: "#c0392b" },
  distanceBarVenue: { color: "#ffffff", fontSize: 13, fontWeight: "bold" },
  distanceBarDist:  { color: "#ffffff", fontSize: 13 },

  // Camera blocked
  cameraBlockedBox:      { height: 220, backgroundColor: "#2a1a1a", borderWidth: 2, borderColor: "#c0392b", alignItems: "center", justifyContent: "center", padding: 20 },
  cameraBlockedCircle:   { width: 56, height: 56, borderRadius: 28, backgroundColor: "#c0392b", alignItems: "center", justifyContent: "center", marginBottom: 8, borderWidth: 3, borderColor: "#ff6b6b" },
  cameraBlockedCross:    { color: "#ffffff", fontSize: 26, fontWeight: "bold", lineHeight: 30 },
  cameraBlockedTitle:    { color: "#ff6b6b", fontSize: 16, fontWeight: "bold", marginBottom: 8 },
  cameraBlockedDistRow:  { flexDirection: "row", alignItems: "baseline", marginBottom: 8 },
  cameraBlockedDistNum:  { color: "#ff4444", fontSize: 28, fontWeight: "bold" },
  cameraBlockedDistLabel:{ color: "#cc8888", fontSize: 14, fontWeight: "600" },
  cameraBlockedSub:      { color: "#cc8888", fontSize: 12, textAlign: "center", lineHeight: 18 },

  // Camera
  cameraBox:        { height: 220, position: "relative" },
  camera:           { flex: 1 },
  scanOverlay:      { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  scanFrame:        { width: 220, height: 80, position: "relative" },
  corner:           { position: "absolute", width: 20, height: 20, borderColor: "#28a745", borderWidth: 3 },
  tl:               { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  tr:               { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bl:               { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  br:               { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  scanningBadge:    { position: "absolute", bottom: 8, alignSelf: "center", flexDirection: "row", backgroundColor: "rgba(0,0,0,0.7)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  scanningBadgeText:{ color: "#fff", fontSize: 13 },

  // Student list
  listSection:      { flex: 1, paddingHorizontal: 16, paddingTop: 10 },
  listTitle:        { color: "#ffffff", fontSize: 14, fontWeight: "bold", marginBottom: 8 },
  listScroll:       { flex: 1 },
  emptyText:        { color: "#8899bb", fontSize: 13, textAlign: "center", marginTop: 8 },
  studentCard:         { backgroundColor: "#131c30", borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: "row", alignItems: "center", borderWidth: 1 },
  studentCardPresent:  { borderColor: "#28a745", backgroundColor: "#0f2018" },
  studentCardAbsent:   { borderColor: "#c0392b", backgroundColor: "#200f0f" },
  studentName:         { color: "#ffffff", fontSize: 14, fontWeight: "bold" },
  studentReg:          { color: "#a0c4ff", fontSize: 12, marginTop: 2 },
  studentTime:         { color: "#445566", fontSize: 11, marginTop: 2 },
  studentStatus:       { fontSize: 12, fontWeight: "bold", marginTop: 4 },
  statusPresent:       { color: "#28a745" },
  statusAbsent:        { color: "#ff6b6b" },
  distBadge:        { alignItems: "center", borderRadius: 10, padding: 10, minWidth: 64 },
  distBadgeIn:      { backgroundColor: "#1a3a2a", borderWidth: 1, borderColor: "#28a745" },
  distBadgeOut:     { backgroundColor: "#3a1a1a", borderWidth: 1, borderColor: "#c0392b" },
  distBadgeText:    { color: "#ffffff", fontSize: 15, fontWeight: "bold" },
  distBadgeLabel:   { color: "#8899bb", fontSize: 10, marginTop: 2 },

  // Footer
  footer:           { padding: 16, borderTopWidth: 1, borderTopColor: "#2a3f5f", backgroundColor: "#0a0f1e" },
  btn:              { backgroundColor: "#28a745", borderRadius: 10, padding: 16, alignItems: "center" },
  btnText:          { color: "#ffffff", fontSize: 15, fontWeight: "bold" },
});
