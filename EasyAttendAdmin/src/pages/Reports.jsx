import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";

const API_BASE = "http://localhost:4000/api";
const getVenueName = (session) => session.venueName || session.venue?.name || "N/A";

export default function Reports() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "sessions"));
      const list = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setSessions(list);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
    setLoading(false);
  };

  const handleDownload = async (sessionId) => {
    setDownloadingId(sessionId);
    try {
      const response = await fetch(`${API_BASE}/sessions/${sessionId}/report`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate report");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Attendance_${sessionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      alert(`Failed to download report: ${error.message}`);
    }
    setDownloadingId(null);
  };

  const filtered = sessions.filter(
    (s) =>
      s.courseCode?.toLowerCase().includes(search.toLowerCase()) ||
      s.instructorEmail?.toLowerCase().includes(search.toLowerCase()) ||
      s.date?.includes(search)
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Reports</h1>
          <p style={styles.subtitle}>
            Generate attendance reports for any session
          </p>
        </div>
      </div>

      <input
        style={styles.search}
        placeholder="Search by course, instructor or date..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div style={styles.tableCard}>
        <div style={styles.tableHeader}>
          <span>Course</span>
          <span>Instructor</span>
          <span>Date</span>
          <span>Venue</span>
          <span>Status</span>
          <span>Action</span>
        </div>
        {loading ? (
          <div style={styles.empty}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={styles.empty}>No sessions found</div>
        ) : (
          filtered.map((session) => (
            <div key={session.id} style={styles.tableRow}>
              <span style={styles.boldText}>{session.courseCode}</span>
              <span>{session.instructorEmail?.split("@")[0]}</span>
              <span>{session.date}</span>
              <span>{getVenueName(session)}</span>
              <span
                style={{
                  ...styles.badge,
                  backgroundColor:
                    session.status === "active" ? "#d4edda" : "#f8d7da",
                  color: session.status === "active" ? "#28a745" : "#c0392b",
                }}
              >
                {session.status}
              </span>
              <button
                style={styles.downloadBtn}
                disabled={downloadingId === session.id}
                onClick={() => handleDownload(session.id)}
              >
                {downloadingId === session.id ? "Generating..." : "Download PDF"}
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
    marginBottom: "20px",
  },
  title: { fontSize: "24px", fontWeight: "bold", color: "#003366" },
  subtitle: { color: "#666", fontSize: "14px", marginTop: "4px" },
  search: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "10px",
    border: "1px solid #ddd",
    fontSize: "14px",
    marginBottom: "16px",
    outline: "none",
  },
  tableCard: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  tableHeader: {
    display: "grid",
    gridTemplateColumns: "1.5fr 1.5fr 1fr 1.5fr 1fr 1.2fr",
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
    gridTemplateColumns: "1.5fr 1.5fr 1fr 1.5fr 1fr 1.2fr",
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
    textAlign: "center",
  },
  downloadBtn: {
    backgroundColor: "#003366",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: "bold",
    cursor: "pointer",
  },
};
