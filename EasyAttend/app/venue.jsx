import { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert
} from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useRouter } from "expo-router";

export default function VenueScreen() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "venues"));
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setVenues(list);
    } catch (error) {
      Alert.alert("Error", "Failed to load venues. Check your connection.");
    }
    setLoading(false);
  };

  const handleProceed = () => {
    if (!selected) {
      Alert.alert("Select Venue", "Please select a venue before proceeding.");
      return;
    }
    // Pass selected venue to geofence screen
    router.push({
      pathname: "/geofence",
      params: {
        venueId: selected.id,
        venueName: selected.name,
        latitude: selected.latitude,
        longitude: selected.longitude,
        building: selected.building,
      }
    });
  };

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Venue</Text>
      </View>

      {/* Instruction */}
      <View style={styles.instruction}>
        <Text style={styles.instructionText}>
          📍 Select the venue where you are taking attendance
        </Text>
      </View>

      {/* Venue List */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#28a745" />
          <Text style={styles.loadingText}>Loading venues...</Text>
        </View>
      ) : (
        <ScrollView style={styles.list}>
          {venues.map((venue) => (
            <TouchableOpacity
              key={venue.id}
              style={[
                styles.venueCard,
                selected?.id === venue.id && styles.venueCardSelected
              ]}
              onPress={() => setSelected(venue)}>

              {/* Icon */}
              <View style={[
                styles.venueIcon,
                selected?.id === venue.id && styles.venueIconSelected
              ]}>
                <Text style={styles.venueIconText}>🏫</Text>
              </View>

              {/* Info */}
              <View style={styles.venueInfo}>
                <Text style={styles.venueName}>{venue.name}</Text>
                <Text style={styles.venueBuilding}>
                  {venue.building}
                </Text>
                <Text style={styles.venueCoords}>
                  📍 {venue.latitude?.toFixed(4)}, {venue.longitude?.toFixed(4)}
                </Text>
              </View>

              {/* Check mark if selected */}
              {selected?.id === venue.id && (
                <Text style={styles.checkmark}>✅</Text>
              )}

            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Proceed Button */}
      {selected && (
        <View style={styles.footer}>
          <Text style={styles.selectedText}>
            Selected: {selected.name}
          </Text>
          <TouchableOpacity
            style={styles.proceedButton}
            onPress={handleProceed}>
            <Text style={styles.proceedText}>
              Confirm & Check Location →
            </Text>
          </TouchableOpacity>
        </View>
      )}

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
  instruction: {
    backgroundColor: "#131c30",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2a3f5f",
  },
  instructionText: {
    color: "#8899bb",
    fontSize: 13,
    textAlign: "center",
  },
  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: {
    color: "#8899bb",
    fontSize: 15,
  },
  list: {
    flex: 1,
    padding: 16,
  },
  venueCard: {
    backgroundColor: "#131c30",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a3f5f",
    gap: 12,
  },
  venueCardSelected: {
    borderColor: "#28a745",
    backgroundColor: "#1a3a2a",
  },
  venueIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#1e2d4a",
    alignItems: "center",
    justifyContent: "center",
  },
  venueIconSelected: {
    backgroundColor: "#28a745",
  },
  venueIconText: {
    fontSize: 22,
  },
  venueInfo: {
    flex: 1,
  },
  venueName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 2,
  },
  venueBuilding: {
    fontSize: 12,
    color: "#8899bb",
    marginBottom: 2,
  },
  venueCoords: {
    fontSize: 11,
    color: "#445566",
  },
  checkmark: {
    fontSize: 20,
  },
  footer: {
    backgroundColor: "#0d1b3e",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#2a3f5f",
  },
  selectedText: {
    color: "#8899bb",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 10,
  },
  proceedButton: {
    backgroundColor: "#28a745",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    shadowColor: "#28a745",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  proceedText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "bold",
  },
});