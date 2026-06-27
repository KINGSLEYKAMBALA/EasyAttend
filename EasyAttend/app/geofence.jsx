import { useState, useEffect } from "react";
import {
  View, Text, StyleSheet,
  TouchableOpacity, Alert, ActivityIndicator
} from "react-native";
import * as Location from "expo-location";
import { useRouter, useLocalSearchParams } from "expo-router";

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function GeofenceScreen() {
  const [distance, setDistance] = useState(null);
  const [status, setStatus] = useState("checking");
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState(null);
  const router = useRouter();
  const RADIUS = 200;

  const { venueName, latitude, longitude } = useLocalSearchParams();

  useEffect(() => {
    checkLocation();
  }, []);

  const checkLocation = async () => {
    setLoading(true);

    const { status: permStatus } =
      await Location.requestForegroundPermissionsAsync();

    if (permStatus !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Location access is required to verify your presence."
      );
      setLoading(false);
      return;
    }

    const currentLocation = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 5000,
      distanceInterval: 0,
    });

    const { latitude: currLat, longitude: currLon } = currentLocation.coords;
    setLocation({ latitude: currLat, longitude: currLon });

    const dist = getDistance(
      currLat, currLon,
      parseFloat(latitude),
      parseFloat(longitude)
    );

    setDistance(Math.round(dist));
    setStatus(dist <= RADIUS ? "inside" : "outside");
    setLoading(false);
  };

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Location Check</Text>
      </View>

      <View style={styles.body}>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#28a745" />
            <Text style={styles.loadingText}>
              Checking your location...
            </Text>
          </View>
        ) : (
          <>
            {/* Venue Name */}
            <View style={styles.venueTag}>
              <Text style={styles.venueTagText}>📍 {venueName}</Text>
            </View>

            {/* Status Circle */}
            <View style={[
              styles.statusCircle,
              status === "inside"
                ? styles.circleInside
                : styles.circleOutside
            ]}>
              <Text style={styles.statusEmoji}>
                {status === "inside" ? "✅" : "❌"}
              </Text>
              <Text style={styles.statusText}>
                {status === "inside" ? "Inside Zone" : "Outside Zone"}
              </Text>
            </View>

            {/* Distance Info */}
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>
                YOUR DISTANCE FROM {venueName?.toUpperCase()}
              </Text>
              <Text style={styles.infoDistance}>
                {distance} metres
              </Text>
              <Text style={styles.infoLimit}>
                Allowed radius: {RADIUS} metres
              </Text>
              <Text style={styles.coordsText}>
                Your GPS:{"\n"}
                Lat: {location?.latitude?.toFixed(8)}{"\n"}
                Lon: {location?.longitude?.toFixed(8)}
              </Text>
            </View>

            {/* Message */}
            <View style={[
              styles.messageBox,
              status === "inside"
                ? styles.messageInside
                : styles.messageOutside
            ]}>
              <Text style={styles.messageText}>
                {status === "inside"
                  ? "✅ You are within the allowed zone. You can now take attendance."
                  : "❌ You are too far from the venue. Please move closer to take attendance."}
              </Text>
            </View>

            {/* Proceed Button */}
            {status === "inside" && (
              <TouchableOpacity
                style={styles.proceedButton}
                onPress={() => router.push("/scan")}>
                <Text style={styles.proceedText}>
                  Proceed to Scan →
                </Text>
              </TouchableOpacity>
            )}

            {/* Retry Button */}
            <TouchableOpacity
              style={styles.retryButton}
              onPress={checkLocation}>
              <Text style={styles.retryText}>🔄 Check Again</Text>
            </TouchableOpacity>

          </>
        )}

      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0f1e",
  },
  header: {
    backgroundColor: "#0d1b3e",
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
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingBox: {
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    color: "#8899bb",
    fontSize: 16,
  },
  venueTag: {
    backgroundColor: "#131c30",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#2a3f5f",
  },
  venueTagText: {
    color: "#a0c4ff",
    fontSize: 13,
    fontWeight: "bold",
  },
  statusCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  circleInside: {
    backgroundColor: "#1a3a2a",
    borderWidth: 3,
    borderColor: "#28a745",
    shadowColor: "#28a745",
  },
  circleOutside: {
    backgroundColor: "#3a1a1a",
    borderWidth: 3,
    borderColor: "#c0392b",
    shadowColor: "#c0392b",
  },
  statusEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
  },
  infoCard: {
    backgroundColor: "#131c30",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    width: "100%",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2a3f5f",
  },
  infoLabel: {
    fontSize: 11,
    color: "#8899bb",
    marginBottom: 8,
    letterSpacing: 1,
    textAlign: "center",
  },
  infoDistance: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  infoLimit: {
    fontSize: 12,
    color: "#8899bb",
    marginBottom: 8,
  },
  coordsText: {
    fontSize: 11,
    color: "#445566",
    textAlign: "center",
    lineHeight: 18,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#2a3f5f",
    paddingTop: 8,
    width: "100%",
  },
  messageBox: {
    borderRadius: 12,
    padding: 16,
    width: "100%",
    marginBottom: 20,
  },
  messageInside: {
    backgroundColor: "#1a3a2a",
    borderWidth: 1,
    borderColor: "#28a745",
  },
  messageOutside: {
    backgroundColor: "#3a1a1a",
    borderWidth: 1,
    borderColor: "#c0392b",
  },
  messageText: {
    color: "#ffffff",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  proceedButton: {
    backgroundColor: "#28a745",
    borderRadius: 10,
    padding: 16,
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#28a745",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  proceedText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  retryButton: {
    backgroundColor: "#131c30",
    borderRadius: 10,
    padding: 14,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a3f5f",
  },
  retryText: {
    color: "#8899bb",
    fontSize: 14,
    fontWeight: "bold",
  },
});