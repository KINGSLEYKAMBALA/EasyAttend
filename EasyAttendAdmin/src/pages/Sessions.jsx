import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Search } from "lucide-react";

const getVenueName = (session) => session.venueName || session.venue?.name || "N/A";
const getSessionTime = (session) => session.time || `${session.startTime || ""} - ${session.endTime || ""}`.trim() || "N/A";

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "sessions"));
      const list = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setSessions(list);
    } catch (error) {
      console.error("Error:", error);
    }
    setLoading(false);
  };

  const filtered = sessions.filter(s =>
    s.courseCode?.toLowerCase().includes(search.toLowerCase()) ||
    s.instructorEmail?.toLowerCase().includes(search.toLowerCase()) ||
    s.date?.includes(search)
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Sessions</h1>
          <p style={styles.subtitle}>
            {sessions.length} total sessions created
          </p>
        </div>
      </div>

      <div style={styles.searchWrapper}>
        <Search size={16} color="#999" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        <input
          style={styles.search}
          placeholder="Search by course, instructor or date..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div style={styles.tableCard}>
        <div style={styles.tableHeader}>
          <span>Course</span>
          <span>Instructor</span>
          <span>Date</span>
          <span>Time</span>
          <span>Venue</span>
          <span>Students</span>
          <span>Status</span>
        </div>
        {loading ? (
          <div style={styles.empty}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={styles.empty}>No sessions found</div>
        ) : (
          filtered.map((session) => (
            <div key={session.id} style={styles.tableRow}>
              <span style={styles.boldText}>
                {session.courseCode}
              </span>
              <span>{session.instructorEmail?.split("@")[0]}</span>
              <span>{session.date}</span>
              <span>{getSessionTime(session)}</span>
              <span>{getVenueName(session)}</span>
              <span>{session.expectedStudents || 0}</span>
              <span style={{
                ...styles.badge,
                backgroundColor: session.status === "active"
                  ? "#d4edda" : "#f8d7da",
                color: session.status === "active"
                  ? "#28a745" : "#c0392b",
              }}>
                {session.status}
              </span>
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
  tableCard: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  tableHeader: {
    display: "grid",
    gridTemplateColumns: "1.5fr 1.5fr 1fr 1fr 1.5fr 1fr 1fr",
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
    gridTemplateColumns: "1.5fr 1.5fr 1fr 1fr 1.5fr 1fr 1fr",
    padding: "12px 16px",
    borderBottom: "1px solid #f0f4f8",
    fontSize: "13px",
    alignItems: "center",
  },
  boldText: { fontWeight: "bold", color: "#003366" },
  empty: { textAlign: "center", padding: "40px", color: "#999" },
  badge: {
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "bold",
    display: "inline-block",
  },
};
