import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Building2, MapPin, Trash2 } from "lucide-react";

export default function Venues() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "", building: "", latitude: "", longitude: ""
  });

  useEffect(() => { fetchVenues(); }, []);

  const fetchVenues = async () => {
    setLoading(true);
    const snapshot = await getDocs(collection(db, "venues"));
    setVenues(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!form.name || !form.building || !form.latitude || !form.longitude) {
      alert("Please fill all fields!");
      return;
    }
    await addDoc(collection(db, "venues"), {
      name: form.name,
      building: form.building,
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
      radius: 200,
    });
    setForm({ name: "", building: "", latitude: "", longitude: "" });
    setShowForm(false);
    fetchVenues();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this venue?")) {
      await deleteDoc(doc(db, "venues", id));
      fetchVenues();
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Venues</h1>
          <p style={styles.subtitle}>{venues.length} venues registered</p>
        </div>
        <button
          style={styles.addBtn}
          onClick={() => setShowForm(!showForm)}>
          + Add Venue
        </button>
      </div>

      {showForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>Add New Venue</h3>
          <div style={styles.formGrid}>
            <input style={styles.input} placeholder="Venue Name"
              value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            <input style={styles.input} placeholder="Building"
              value={form.building} onChange={e => setForm({...form, building: e.target.value})} />
            <input style={styles.input} placeholder="Latitude (e.g. -11.4209)"
              value={form.latitude} onChange={e => setForm({...form, latitude: e.target.value})} />
            <input style={styles.input} placeholder="Longitude (e.g. 33.9961)"
              value={form.longitude} onChange={e => setForm({...form, longitude: e.target.value})} />
          </div>
          <button style={styles.saveBtn} onClick={handleAdd}>
            Save Venue
          </button>
        </div>
      )}

      <div style={styles.grid}>
        {loading ? (
          <p>Loading...</p>
        ) : (
          venues.map(venue => (
            <div key={venue.id} style={styles.venueCard}>
              <div style={styles.venueIcon}><Building2 size={24} color="#003366" /></div>
              <div style={styles.venueInfo}>
                <div style={styles.venueName}>{venue.name}</div>
                <div style={styles.venueBuilding}>{venue.building}</div>
                <div style={styles.venueCoords}>
                  <MapPin size={11} style={{ marginRight: 3, verticalAlign: "middle" }} />
                  {venue.latitude?.toFixed(4)}, {venue.longitude?.toFixed(4)}
                </div>
                <div style={styles.venueRadius}>Radius: {venue.radius || 200}m</div>
              </div>
              <button style={styles.deleteBtn} onClick={() => handleDelete(venue.id)}>
                <Trash2 size={16} color="#c0392b" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: "24px" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  title: { fontSize: "24px", fontWeight: "bold", color: "#003366" },
  subtitle: { color: "#666", fontSize: "14px", marginTop: "4px" },
  addBtn: {
    backgroundColor: "#28a745",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 20px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  formTitle: {
    color: "#003366",
    marginBottom: "16px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginBottom: "16px",
  },
  input: {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "14px",
    outline: "none",
  },
  saveBtn: {
    backgroundColor: "#003366",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 24px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px",
  },
  venueCard: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "16px",
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  venueIcon: { width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#e8f0fe", borderRadius: "10px", flexShrink: 0 },
  venueInfo: { flex: 1 },
  venueName: { fontWeight: "bold", color: "#003366", fontSize: "15px" },
  venueBuilding: { color: "#666", fontSize: "13px", marginTop: "2px" },
  venueCoords: { color: "#999", fontSize: "12px", marginTop: "4px" },
  venueRadius: { color: "#28a745", fontSize: "12px", marginTop: "2px" },
  deleteBtn: {
    backgroundColor: "#f8d7da",
    border: "none",
    borderRadius: "6px",
    padding: "6px 8px",
    cursor: "pointer",
  },
};