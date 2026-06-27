import { useState, useEffect } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Search, Trash2 } from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const getVenueName = (item) => item.venueName || item.venue || "N/A";
const getProgramme = (item) => item.programme || item.program || "—";
const getDuration  = (item) => {
  if (item.duration) return item.duration;
  // compute from startTime / endTime e.g. "07:45 AM" → "09:45 AM" = 2 hours
  try {
    const parse = (t) => {
      const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!m) return 0;
      let h = parseInt(m[1]), min = parseInt(m[2]);
      if (m[3].toUpperCase() === "PM" && h !== 12) h += 12;
      if (m[3].toUpperCase() === "AM" && h === 12) h = 0;
      return h * 60 + min;
    };
    const diff = parse(item.endTime) - parse(item.startTime);
    if (diff <= 0) return "—";
    const hrs = Math.floor(diff / 60), mins = diff % 60;
    return mins === 0 ? `${hrs} hr${hrs !== 1 ? "s" : ""}` : `${hrs}h ${mins}m`;
  } catch { return "—"; }
};

export default function Timetable() {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "timetable"));
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTimetable(list);
    } catch (error) {
      console.error("Error:", error);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this timetable entry?")) {
      await deleteDoc(doc(db, "timetable", id));
      fetchTimetable();
    }
  };

  const filtered = timetable.filter(item =>
    item.dayOfWeek?.toLowerCase() === selectedDay.toLowerCase() &&
    (item.courseCode?.toLowerCase().includes(search.toLowerCase()) ||
     item.programme?.toLowerCase().includes(search.toLowerCase()) ||
     getVenueName(item).toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={styles.container}>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Timetable Management</h1>
          <p style={styles.subtitle}>
            {timetable.length} total entries in database
          </p>
        </div>
      </div>

      {/* Search */}
      <div style={styles.searchWrapper}>
        <Search size={16} color="#999" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        <input
          style={styles.search}
          placeholder="Search by course, programme or venue..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Day Tabs */}
      <div style={styles.dayTabs}>
        {DAYS.map(day => (
          <button
            key={day}
            style={{
              ...styles.dayTab,
              ...(selectedDay === day ? styles.dayTabActive : {})
            }}
            onClick={() => setSelectedDay(day)}>
            {day}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={styles.tableCard}>
        <div style={styles.tableHeader}>
          <span>Course Code</span>
          <span>Programme</span>
          <span>Start Time</span>
          <span>End Time</span>
          <span>Venue</span>
          <span>Duration</span>
          <span>Action</span>
        </div>

        {loading ? (
          <div style={styles.empty}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={styles.empty}>
            No entries for {selectedDay}
          </div>
        ) : (
          filtered.map((item) => (
            <div key={item.id} style={styles.tableRow}>
              <span style={styles.boldText}>{item.courseCode}</span>
              <span>{getProgramme(item)}</span>
              <span>{item.startTime}</span>
              <span>{item.endTime}</span>
              <span>{getVenueName(item)}</span>
              <span>{getDuration(item)}</span>
              <button
                style={styles.deleteBtn}
                onClick={() => handleDelete(item.id)}>
                <Trash2 size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />
                Delete
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
  searchWrapper: { position: "relative", marginBottom: "16px" },
  search: {
    width: "100%",
    padding: "12px 16px 12px 40px",
    borderRadius: "10px",
    border: "1px solid #ddd",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  },
  dayTabs: {
    display: "flex",
    gap: "8px",
    marginBottom: "16px",
  },
  dayTab: {
    padding: "8px 20px",
    borderRadius: "20px",
    border: "1px solid #ddd",
    backgroundColor: "#fff",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "bold",
    color: "#666",
  },
  dayTabActive: {
    backgroundColor: "#003366",
    color: "#fff",
    border: "1px solid #003366",
  },
  tableCard: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  tableHeader: {
    display: "grid",
    gridTemplateColumns: "1.5fr 2fr 1fr 1fr 1fr 1fr 1fr",
    padding: "10px 16px",
    backgroundColor: "#f0f4f8",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "bold",
    color: "#666",
    marginBottom: "8px",
  },
  tableRow: {
    display: "grid",
    gridTemplateColumns: "1.5fr 2fr 1fr 1fr 1fr 1fr 1fr",
    padding: "12px 16px",
    borderBottom: "1px solid #f0f4f8",
    fontSize: "13px",
    alignItems: "center",
  },
  boldText: { fontWeight: "bold", color: "#003366" },
  empty: { textAlign: "center", padding: "40px", color: "#999" },
  deleteBtn: {
    backgroundColor: "#f8d7da",
    color: "#c0392b",
    border: "none",
    borderRadius: "6px",
    padding: "6px 10px",
    cursor: "pointer",
    fontSize: "12px",
  },
};
