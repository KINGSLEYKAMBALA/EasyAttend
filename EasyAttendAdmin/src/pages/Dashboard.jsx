import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { CalendarDays, BookOpen, Building2, ClipboardCheck } from "lucide-react";

const getVenueName = (session) => session.venueName || session.venue?.name || "N/A";

export default function Dashboard() {
  const [stats, setStats] = useState({ timetable: 0, sessions: 0, venues: 0, attendance: 0 });
  const [loading, setLoading] = useState(true);
  const [recentSessions, setRecentSessions] = useState([]);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const [timetable, sessions, venues, attendance] = await Promise.all([
        getDocs(collection(db, "timetable")),
        getDocs(collection(db, "sessions")),
        getDocs(collection(db, "venues")),
        getDocs(collection(db, "attendance")),
      ]);
      setStats({ timetable: timetable.size, sessions: sessions.size, venues: venues.size, attendance: attendance.size });
      const sessionList = sessions.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
      setRecentSessions(sessionList);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
    setLoading(false);
  };

  const statCards = [
    { label: "Timetable Entries",   value: stats.timetable,  Icon: CalendarDays,    color: "#003366", bg: "#e8f0fe" },
    { label: "Sessions Created",    value: stats.sessions,   Icon: BookOpen,        color: "#6c3483", bg: "#f3e8ff" },
    { label: "Venues",              value: stats.venues,     Icon: Building2,       color: "#e67e22", bg: "#fef3e2" },
    { label: "Attendance Records",  value: stats.attendance, Icon: ClipboardCheck,  color: "#28a745", bg: "#d4edda" },
  ];

  return (
    <div style={styles.container}>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        {statCards.map((card) => (
          <div key={card.label} style={styles.statCard}>
            <div style={{ ...styles.statIcon, backgroundColor: card.bg }}>
              <card.Icon size={26} color={card.color} strokeWidth={2} />
            </div>
            <div>
              <div style={styles.statValue}>{loading ? "…" : card.value}</div>
              <div style={styles.statLabel}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Sessions */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Recent Sessions</h2>
        <div style={styles.table}>
          <div style={styles.tableHeader}>
            <span>Course</span>
            <span>Instructor</span>
            <span>Date</span>
            <span>Venue</span>
            <span>Status</span>
          </div>
          {loading ? (
            <div style={styles.tableEmpty}>Loading…</div>
          ) : recentSessions.length === 0 ? (
            <div style={styles.tableEmpty}>No sessions yet</div>
          ) : (
            recentSessions.map((session) => (
              <div key={session.id} style={styles.tableRow}>
                <span style={styles.boldText}>{session.courseCode}</span>
                <span>{session.instructorEmail?.split("@")[0]}</span>
                <span>{session.date}</span>
                <span>{getVenueName(session)}</span>
                <span style={{
                  ...styles.statusBadge,
                  backgroundColor: session.status === "active" ? "#d4edda" : "#f8d7da",
                  color: session.status === "active" ? "#28a745" : "#c0392b",
                }}>
                  {session.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}

const styles = {
  container:   { padding: "24px" },
  header:      { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" },
  title:       { fontSize: "24px", fontWeight: "bold", color: "#003366" },
  subtitle:    { color: "#666", fontSize: "14px", marginTop: "4px" },
  dateBadge:   { backgroundColor: "#003366", color: "#fff", padding: "8px 16px", borderRadius: "20px", fontSize: "13px" },
  statsGrid:   { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" },
  statCard:    { backgroundColor: "#fff", borderRadius: "12px", padding: "20px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  statIcon:    { width: "52px", height: "52px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  statValue:   { fontSize: "28px", fontWeight: "bold", color: "#003366" },
  statLabel:   { color: "#666", fontSize: "13px", marginTop: "2px" },
  section:     { backgroundColor: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  sectionTitle:{ fontSize: "16px", fontWeight: "bold", color: "#003366", marginBottom: "16px" },
  table:       { width: "100%" },
  tableHeader: { display: "grid", gridTemplateColumns: "2fr 2fr 1.5fr 1.5fr 1fr", padding: "10px 16px", backgroundColor: "#f0f4f8", borderRadius: "8px", fontSize: "12px", fontWeight: "bold", color: "#666", marginBottom: "8px" },
  tableRow:    { display: "grid", gridTemplateColumns: "2fr 2fr 1.5fr 1.5fr 1fr", padding: "12px 16px", borderBottom: "1px solid #f0f4f8", fontSize: "14px", alignItems: "center" },
  tableEmpty:  { textAlign: "center", padding: "40px", color: "#999" },
  boldText:    { fontWeight: "bold", color: "#003366" },
  statusBadge: { padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold", display: "inline-block" },
};
