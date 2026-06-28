import { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, FlatList,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { collection, getDocs, query, where, addDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { useRouter } from "expo-router";

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

const getStudentName = (s) => s?.name || s?.fullName || null;
const getRegNumber  = (s) => s?.regNumber || s?.studentId || "";

export default function IdAttendanceScreen() {
  const router = useRouter();

  // Phase: "course" → "venue" → "locating" → "scanning"
  const [phase, setPhase] = useState("course");

  // Course selection
  const [courses, setCourses]         = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Venue selection
  const [venues, setVenues]           = useState([]);
  const [venuesLoading, setVenuesLoading] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [distanceToVenue, setDistanceToVenue] = useState(null);

  // Scanner
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [scanning, setScanning]       = useState(false);
  const [scannedStudents, setScannedStudents] = useState([]);
  const [submitting, setSubmitting]   = useState(false);
  const [lastScanned, setLastScanned] = useState(null);
  const locationSubRef = useRef(null);

  useEffect(() => {
    loadCourses();
    if (!cameraPermission?.granted) requestCameraPermission();
    return () => {
      // Clean up location watcher when leaving the screen
      if (locationSubRef.current) locationSubRef.current.remove();
    };
  }, []);

  const loadCourses = async () => {
    setCoursesLoading(true);
    try {
      const email = auth.currentUser?.email;
      const instSnap = await getDocs(
        query(collection(db, "instructors"), where("email", "==", email))
      );
      if (!instSnap.empty) {
        const inst = instSnap.docs[0].data();
        // Support both single courseCode and courseCodes array
        const timetableSnap = await getDocs(collection(db, "timetable"));
        const all = timetableSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const codes = inst.courseCodes || (inst.courseCode ? [inst.courseCode] : []);
        const filtered = codes.length > 0
          ? all.filter(t => codes.includes(t.courseCode))
          : all;
        // Deduplicate by courseCode
        const seen = new Set();
        const unique = filtered.filter(t => {
          if (seen.has(t.courseCode)) return false;
          seen.add(t.courseCode);
          return true;
        });
        setCourses(unique);
      } else {
        // Fallback: show all timetable entries
        const snap = await getDocs(collection(db, "timetable"));
        setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    } catch {
      Alert.alert("Error", "Failed to load courses.");
    }
    setCoursesLoading(false);
  };

  const handleSelectCourse = (course) => {
    setSelectedCourse(course);
    setPhase("venue");
    loadVenues();
  };

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
    setDistanceToVenue(null);
    setPhase("locating");

    // Always request permission — on every platform
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Location permission is required to verify you are at the venue.",
        [{ text: "Go Back", onPress: () => setPhase("venue") }]
      );
      return;
    }

    const venueLat = parseFloat(venue.latitude);
    const venueLon = parseFloat(venue.longitude);

    if (isNaN(venueLat) || isNaN(venueLon) || (venueLat === 0 && venueLon === 0)) {
      Alert.alert(
        "No Coordinates",
        `${venue.name} has no GPS coordinates saved. Please add them in the admin panel.`,
        [{ text: "Go Back", onPress: () => setPhase("venue") }]
      );
      return;
    }

    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      const dist = Math.round(
        getDistance(loc.coords.latitude, loc.coords.longitude, venueLat, venueLon)
      );
      setDistanceToVenue(dist);
    } catch (e) {
      Alert.alert("GPS Error", "Could not get your location. Make sure GPS is turned on.");
      setPhase("venue");
    }
  };

  const recheckLocation = async () => {
    if (!selectedVenue) return;
    setDistanceToVenue(null);
    try {
      const venueLat = parseFloat(selectedVenue.latitude);
      const venueLon = parseFloat(selectedVenue.longitude);
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      const dist = Math.round(
        getDistance(loc.coords.latitude, loc.coords.longitude, venueLat, venueLon)
      );
      setDistanceToVenue(dist);
    } catch {
      Alert.alert("GPS Error", "Could not get your location.");
    }
  };

  const insideZone = distanceToVenue !== null && distanceToVenue <= 200;

  const handleBarcodeScan = async ({ data }) => {
    if (scanning) return;

    if (!insideZone) {
      Alert.alert(
        "Out of Range",
        `You are ${distanceToVenue}m from the venue.\nYou must be within 200m to scan attendance.`,
        [{ text: "OK" }]
      );
      return;
    }

    setScanning(true);

    try {
      // Mzuzu University barcodes encode reg number only e.g. "BICT1725"
      const raw  = data.trim();
      const normalize = (str) => str.replace(/[\s\/\-\.]/g, "").toUpperCase();
      const code = normalize(raw);

      // Try Firestore lookup to enrich with name/programme (best-effort)
      let firestoreStudent = null;
      let snap = await getDocs(query(collection(db, "students"), where("barcode", "==", raw)));
      if (snap.empty) snap = await getDocs(query(collection(db, "students"), where("regNumber", "==", raw)));
      if (snap.empty) snap = await getDocs(query(collection(db, "students"), where("regNumber", "==", code)));
      if (snap.empty) {
        const allSnap = await getDocs(collection(db, "students"));
        const match = allSnap.docs.find(d => {
          const reg = normalize(d.data().regNumber || "");
          const bar = normalize(d.data().barcode   || "");
          return reg === code || bar === code;
        });
        if (match) snap = { empty: false, docs: [match] };
      }
      if (!snap.empty) firestoreStudent = { id: snap.docs[0].id, ...snap.docs[0].data() };

      // Stable key: Firestore id if found, else normalised reg code
      const uid = firestoreStudent?.id || code;

      const alreadyScanned = scannedStudents.some((s) => s.uid === uid);
      if (alreadyScanned) {
        const label = getStudentName(firestoreStudent) || raw;
        Alert.alert("Already Scanned", `${label} (${raw}) was already recorded.`,
          [{ text: "OK", onPress: () => setScanning(false) }]);
        return;
      }

      // Build record — Firestore enriches, barcode reg is always used as fallback
      const withinRange = distanceToVenue !== null && distanceToVenue <= 200;
      const name       = getStudentName(firestoreStudent) || raw; // use reg as name if unknown
      const regNumber  = firestoreStudent ? getRegNumber(firestoreStudent) : raw;
      const programme  = firestoreStudent?.programme || "";
      const checkInTime = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
      const fromBarcode = !firestoreStudent;

      setScannedStudents((prev) => [
        { uid, id: firestoreStudent?.id || null, name, regNumber, programme,
          distance: distanceToVenue, status: withinRange ? "present" : "absent",
          checkInTime, fromBarcode },
        ...prev,
      ]);

      setLastScanned({ name, regNumber, programme,
        status: withinRange ? "present" : "absent", checkInTime, fromBarcode });
      setTimeout(() => setLastScanned(null), 3000);
      setScanning(false);
    } catch {
      Alert.alert("Error", "Failed to process barcode.");
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
      const now = new Date().toISOString();
      for (const s of scannedStudents) {
        await addDoc(collection(db, "attendance"), {
          sessionId:          "",                         // ID scan has no session doc
          studentId:          s.id || s.regNumber,
          name:               s.name,
          studentName:        s.name,
          regNumber:          s.regNumber,
          programme:          s.programme || "",
          courseCode:         selectedCourse?.courseCode || "",
          courseName:         selectedCourse?.courseName || "",
          checkInTime:        s.checkInTime,
          distanceFromVenue:  s.distance,
          venueName:          selectedVenue?.name || "",
          method:             "id_scan",
          attendanceDate:     new Date().toLocaleDateString("en-GB"),
          status:             s.status || "present",
          scannedFromBarcode: s.fromBarcode || false,
          instructorEmail:    auth.currentUser?.email || "",
          timestamp:          now,
          createdAt:          now,
        });
      }
      Alert.alert(
        "Attendance Submitted",
        `${scannedStudents.length} student(s) recorded for ${selectedCourse?.courseCode}.`,
        [{ text: "Done", onPress: () => router.replace("/home") }]
      );
    } catch {
      Alert.alert("Error", "Failed to submit attendance.");
    }
    setSubmitting(false);
  };

  // ── Step 1: Course selection ───────────────────────────────────────────────
  if (phase === "course") {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ID Attendance</Text>
        </View>
        <View style={styles.phaseLabel}>
          <Text style={styles.stepNum}>Step 1 of 3</Text>
          <Text style={styles.phaseLabelText}>Select the course for this session</Text>
        </View>
        {coursesLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#28a745" size="large" />
          </View>
        ) : courses.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>No courses assigned to your account.</Text>
          </View>
        ) : (
          <FlatList
            data={courses}
            keyExtractor={(c) => c.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.courseCard} onPress={() => handleSelectCourse(item)}>
                <View style={styles.courseCodeBadge}>
                  <Text style={styles.courseCodeText}>{item.courseCode}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.courseName}>{item.courseName}</Text>
                  <Text style={styles.courseMeta}>
                    {item.programme || ""}{item.year ? ` · Year ${item.year}` : ""}
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

  // ── Step 2: Venue selection ────────────────────────────────────────────────
  if (phase === "venue") {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setPhase("course")}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ID Attendance</Text>
        </View>
        <View style={styles.selectedCourseBanner}>
          <Text style={styles.selectedCourseLabel}>Course: </Text>
          <Text style={styles.selectedCourseValue}>{selectedCourse?.courseCode} — {selectedCourse?.courseName}</Text>
        </View>
        <View style={styles.phaseLabel}>
          <Text style={styles.stepNum}>Step 2 of 3</Text>
          <Text style={styles.phaseLabelText}>Select the venue for this session</Text>
        </View>
        {venuesLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#28a745" size="large" />
          </View>
        ) : venues.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>No venues found.</Text>
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
                  {(item.latitude && item.longitude) ? (
                    <Text style={styles.venueCoords}>
                      📍 {parseFloat(item.latitude).toFixed(5)}, {parseFloat(item.longitude).toFixed(5)}
                    </Text>
                  ) : (
                    <Text style={[styles.venueCoords, { color: "#c0392b" }]}>⚠️ No coordinates set</Text>
                  )}
                </View>
                <Text style={{ color: "#a0c4ff", fontSize: 20 }}>›</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    );
  }

  // ── Location check screen ─────────────────────────────────────────────────
  if (phase === "locating") {
    const canProceed = distanceToVenue !== null && distanceToVenue <= 200;
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setPhase("venue")}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Location Check</Text>
        </View>

        <View style={styles.selectedCourseBanner}>
          <Text style={styles.selectedCourseLabel}>Venue: </Text>
          <Text style={styles.selectedCourseValue}>{selectedVenue?.name}</Text>
        </View>

        <View style={[styles.center, { flex: 1, padding: 24 }]}>
          {distanceToVenue === null ? (
            <>
              <ActivityIndicator color="#28a745" size="large" />
              <Text style={[styles.emptyText, { marginTop: 16 }]}>Getting your GPS location…</Text>
              <Text style={[styles.emptyText, { marginTop: 8, fontSize: 11 }]}>Make sure GPS is enabled on your device</Text>
            </>
          ) : (
            <>
              {/* Status circle */}
              <View style={[
                styles.geoCircle,
                canProceed ? styles.geoCircleIn : styles.geoCircleOut,
              ]}>
                <Text style={{ fontSize: 40, marginBottom: 6 }}>{canProceed ? "✅" : "❌"}</Text>
                <Text style={styles.geoCircleLabel}>{canProceed ? "Inside Zone" : "Outside Zone"}</Text>
              </View>

              {/* Distance card */}
              <View style={styles.geoInfoCard}>
                <Text style={styles.geoInfoLabel}>YOUR DISTANCE FROM {selectedVenue?.name?.toUpperCase()}</Text>
                <Text style={[styles.geoDistance, { color: canProceed ? "#28a745" : "#e74c3c" }]}>
                  {distanceToVenue} metres
                </Text>
                <Text style={styles.geoLimit}>Allowed radius: 200 metres</Text>
              </View>

              {/* Message */}
              <View style={[styles.geoMessage, canProceed ? styles.geoMessageIn : styles.geoMessageOut]}>
                <Text style={styles.geoMessageText}>
                  {canProceed
                    ? "✅ You are within range. You can now scan student IDs."
                    : `❌ You are ${distanceToVenue}m away. Move within 200m of ${selectedVenue?.name} to take attendance.`}
                </Text>
              </View>

              {/* Proceed button — only if inside */}
              {canProceed && (
                <TouchableOpacity style={styles.btn} onPress={() => setPhase("scanning")}>
                  <Text style={styles.btnText}>Proceed to Scan →</Text>
                </TouchableOpacity>
              )}

              {/* Check again button */}
              <TouchableOpacity style={[styles.btn, styles.btnSecondary, { marginTop: 12 }]} onPress={recheckLocation}>
                <Text style={styles.btnSecondaryText}>🔄 Check Again</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  }

  // ── Step 3: Scanning ───────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setPhase("venue")}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ID Attendance</Text>
      </View>

      {/* Course + venue info bar */}
      <View style={styles.infoBar}>
        <Text style={styles.infoBarCourse}>{selectedCourse?.courseCode}</Text>
        <Text style={styles.infoBarSep}>·</Text>
        <Text style={styles.infoBarVenue}>{selectedVenue?.name}</Text>
      </View>

      {/* Distance bar */}
      <View style={[styles.distanceBar, insideZone ? styles.distanceBarIn : styles.distanceBarOut]}>
        <Text style={styles.distanceBarVenue}>Step 3 of 3 — Scan student IDs</Text>
        <Text style={styles.distanceBarDist}>
          {distanceToVenue === null
            ? "📡 Getting location…"
            : `${insideZone ? "✅" : "⚠️"} ${distanceToVenue}m from venue`}
        </Text>
      </View>

      {/* Camera */}
      {!insideZone ? (
        <View style={styles.cameraBlockedBox}>
          <View style={styles.cameraBlockedCircle}>
            <Text style={styles.cameraBlockedCross}>✕</Text>
          </View>
          <Text style={styles.cameraBlockedTitle}>Scanning Blocked</Text>
          <View style={styles.cameraBlockedDistRow}>
            <Text style={styles.cameraBlockedDistNum}>{distanceToVenue}m</Text>
            <Text style={styles.cameraBlockedDistLabel}> from {selectedVenue?.name}</Text>
          </View>
          <Text style={styles.cameraBlockedSub}>Move within 200m to scan.</Text>
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
          {lastScanned && !scanning && (
            <View style={[styles.lastScannedBanner,
              lastScanned.status === "present" ? styles.bannerPresent : styles.bannerAbsent]}>
              <View style={styles.bannerIconCircle}>
                <Text style={styles.bannerIcon}>{lastScanned.status === "present" ? "✓" : "✗"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerName}>{lastScanned.name}</Text>
                <Text style={styles.bannerReg}>
                  {lastScanned.regNumber}{lastScanned.programme ? `  ·  ${lastScanned.programme}` : ""}
                  {lastScanned.fromBarcode ? "  ·  ID only" : ""}
                </Text>
                <Text style={styles.bannerStatus}>
                  {lastScanned.status === "present"
                    ? `✅ Present · ${lastScanned.checkInTime}`
                    : "⚠️ Marked Absent — out of range"}
                </Text>
              </View>
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
        <Text style={styles.listTitle}>Scanned ({scannedStudents.length})</Text>
        <ScrollView style={styles.listScroll}>
          {scannedStudents.length === 0 ? (
            <Text style={styles.emptyText}>Point camera at a student ID barcode…</Text>
          ) : (
            scannedStudents.map((s) => {
              const isPresent = s.status === "present";
              return (
                <View key={s.uid}
                  style={[styles.studentCard,
                    isPresent ? styles.studentCardPresent : styles.studentCardAbsent]}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <Text style={styles.studentName}>{s.name}</Text>
                      {s.fromBarcode && (
                        <View style={styles.idOnlyBadge}>
                          <Text style={styles.idOnlyText}>ID only</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.studentReg}>{s.regNumber}</Text>
                    <Text style={styles.studentTime}>Scanned at {s.checkInTime}</Text>
                    <Text style={[styles.studentStatus,
                      isPresent ? styles.statusPresent : styles.statusAbsent]}>
                      {isPresent ? "✅ Present" : `⚠️ Absent — ${s.distance}m (limit 200m)`}
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

      {scannedStudents.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> :
              <Text style={styles.btnText}>Submit {scannedStudents.length} Student(s)</Text>}
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
  stepNum:          { color: "#28a745", fontSize: 11, fontWeight: "bold", textAlign: "center", marginBottom: 2 },
  phaseLabelText:   { color: "#8899bb", fontSize: 13, textAlign: "center" },
  emptyText:        { color: "#8899bb", fontSize: 13, textAlign: "center", marginTop: 8 },

  // Selected course banner
  selectedCourseBanner: { backgroundColor: "#0d3326", paddingHorizontal: 16, paddingVertical: 10, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#1a5c3a" },
  selectedCourseLabel:  { color: "#8899bb", fontSize: 12 },
  selectedCourseValue:  { color: "#28a745", fontSize: 12, fontWeight: "bold", flex: 1 },

  // Course cards
  courseCard:       { backgroundColor: "#131c30", borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#2a3f5f", gap: 12 },
  courseCodeBadge:  { backgroundColor: "#0d3326", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: "#28a745" },
  courseCodeText:   { color: "#28a745", fontSize: 13, fontWeight: "bold" },
  courseName:       { color: "#ffffff", fontSize: 14, fontWeight: "bold" },
  courseMeta:       { color: "#8899bb", fontSize: 12, marginTop: 2 },

  // Venue cards
  venueCard:        { backgroundColor: "#131c30", borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#2a3f5f", gap: 12 },
  venueIcon:        { width: 48, height: 48, borderRadius: 24, backgroundColor: "#1e2d4a", alignItems: "center", justifyContent: "center" },
  venueName:        { color: "#ffffff", fontSize: 15, fontWeight: "bold" },
  venueBuilding:    { color: "#8899bb", fontSize: 12 },
  venueCoords:      { color: "#445566", fontSize: 11 },

  // Info bar (scanning phase)
  infoBar:          { backgroundColor: "#0d3326", flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8, gap: 8, borderBottomWidth: 1, borderBottomColor: "#1a5c3a" },
  infoBarCourse:    { color: "#28a745", fontSize: 13, fontWeight: "bold" },
  infoBarSep:       { color: "#445566", fontSize: 13 },
  infoBarVenue:     { color: "#8899bb", fontSize: 13, flex: 1 },

  // Distance bar
  distanceBar:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  distanceBarIn:    { backgroundColor: "#1a3a2a", borderBottomColor: "#28a745" },
  distanceBarOut:   { backgroundColor: "#3a1a1a", borderBottomColor: "#c0392b" },
  distanceBarVenue: { color: "#ffffff", fontSize: 12 },
  distanceBarDist:  { color: "#ffffff", fontSize: 12 },

  // Camera blocked
  cameraBlockedBox:      { height: 200, backgroundColor: "#2a1a1a", borderWidth: 2, borderColor: "#c0392b", alignItems: "center", justifyContent: "center", padding: 20 },
  cameraBlockedCircle:   { width: 52, height: 52, borderRadius: 26, backgroundColor: "#c0392b", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  cameraBlockedCross:    { color: "#ffffff", fontSize: 24, fontWeight: "bold" },
  cameraBlockedTitle:    { color: "#ff6b6b", fontSize: 16, fontWeight: "bold", marginBottom: 6 },
  cameraBlockedDistRow:  { flexDirection: "row", alignItems: "baseline", marginBottom: 6 },
  cameraBlockedDistNum:  { color: "#ff4444", fontSize: 26, fontWeight: "bold" },
  cameraBlockedDistLabel:{ color: "#cc8888", fontSize: 13 },
  cameraBlockedSub:      { color: "#cc8888", fontSize: 12, textAlign: "center" },

  // Camera
  cameraBox:        { height: 200, position: "relative" },
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

  // Last scanned banner
  lastScannedBanner: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  bannerPresent:     { backgroundColor: "rgba(16,185,129,0.95)" },
  bannerAbsent:      { backgroundColor: "rgba(192,57,43,0.95)" },
  bannerIconCircle:  { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center" },
  bannerIcon:        { color: "#fff", fontSize: 22, fontWeight: "bold" },
  bannerName:        { color: "#fff", fontSize: 16, fontWeight: "bold" },
  bannerReg:         { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 1 },
  bannerStatus:      { color: "rgba(255,255,255,0.9)", fontSize: 12, marginTop: 3 },

  // "ID only" badge
  idOnlyBadge:      { backgroundColor: "#f59e0b22", borderWidth: 1, borderColor: "#f59e0b", borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  idOnlyText:       { color: "#f59e0b", fontSize: 10, fontWeight: "bold" },

  // Student list
  listSection:      { flex: 1, paddingHorizontal: 16, paddingTop: 10 },
  listTitle:        { color: "#ffffff", fontSize: 14, fontWeight: "bold", marginBottom: 8 },
  listScroll:       { flex: 1 },
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
  btn:              { backgroundColor: "#28a745", borderRadius: 10, padding: 16, alignItems: "center", width: "100%" },
  btnText:          { color: "#ffffff", fontSize: 15, fontWeight: "bold" },
  btnSecondary:     { backgroundColor: "#131c30", borderWidth: 1, borderColor: "#2a3f5f" },
  btnSecondaryText: { color: "#8899bb", fontSize: 14, fontWeight: "bold" },

  // Geofence check screen
  geoCircle:        { width: 160, height: 160, borderRadius: 80, alignItems: "center", justifyContent: "center", marginBottom: 24, elevation: 6 },
  geoCircleIn:      { backgroundColor: "#1a3a2a", borderWidth: 3, borderColor: "#28a745" },
  geoCircleOut:     { backgroundColor: "#3a1a1a", borderWidth: 3, borderColor: "#e74c3c" },
  geoCircleLabel:   { color: "#ffffff", fontSize: 15, fontWeight: "bold" },
  geoInfoCard:      { backgroundColor: "#131c30", borderRadius: 16, padding: 20, alignItems: "center", width: "100%", marginBottom: 16, borderWidth: 1, borderColor: "#2a3f5f" },
  geoInfoLabel:     { fontSize: 11, color: "#8899bb", marginBottom: 8, letterSpacing: 1, textAlign: "center" },
  geoDistance:      { fontSize: 40, fontWeight: "bold", marginBottom: 4 },
  geoLimit:         { fontSize: 12, color: "#8899bb" },
  geoMessage:       { borderRadius: 12, padding: 16, width: "100%", marginBottom: 20 },
  geoMessageIn:     { backgroundColor: "#1a3a2a", borderWidth: 1, borderColor: "#28a745" },
  geoMessageOut:    { backgroundColor: "#3a1a1a", borderWidth: 1, borderColor: "#e74c3c" },
  geoMessageText:   { color: "#ffffff", fontSize: 14, textAlign: "center", lineHeight: 22 },
});
