import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, addDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Pencil, Search } from "lucide-react";

export default function Students() {
  const [students,  setStudents]  = useState([]);
  const [sessions,  setSessions]  = useState([]); // for attendance lookup
  const [records,   setRecords]   = useState([]); // attendance records
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [filterProg, setFilterProg] = useState("All");
  const [filterYear, setFilterYear] = useState("All");
  const [showAdd,   setShowAdd]   = useState(false);
  const [editStu,   setEditStu]   = useState(null);
  const [form, setForm] = useState({ regNumber: "", fullName: "", programme: "", year: "", gender: "" });
  const [msg,  setMsg]  = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [stuSnap, sesSnap, recSnap] = await Promise.all([
        getDocs(collection(db, "students")),
        getDocs(collection(db, "sessions")),
        getDocs(collection(db, "attendanceRecords")),
      ]);
      setStudents(stuSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setSessions(sesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setRecords(recSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  // Compute attendance stats per student
  const getStats = (regNumber) => {
    const studentRecs = records.filter(r => r.regNumber === regNumber || r.studentId === regNumber);
    const present = studentRecs.filter(r => r.status === "present").length;
    const absent  = studentRecs.filter(r => r.status === "absent").length;
    return { present, absent, total: present + absent };
  };

  const programmes = ["All", ...new Set(students.map(s => s.programme).filter(Boolean))];
  const years      = ["All", ...new Set(students.map(s => String(s.year)).filter(Boolean)).values()].sort();

  const filtered = students.filter(s => {
    const name = (s.fullName || s.name || "").toLowerCase();
    const reg  = (s.regNumber || "").toLowerCase();
    const q    = search.toLowerCase();
    return (
      (filterProg === "All" || s.programme === filterProg) &&
      (filterYear === "All" || String(s.year) === filterYear) &&
      (name.includes(q) || reg.includes(q))
    );
  });

  const handleAdd = async () => {
    if (!form.regNumber || !form.fullName || !form.programme || !form.year) {
      setMsg("Fill in all required fields."); return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, "students"), {
        regNumber:  form.regNumber.trim().toUpperCase(),
        fullName:   form.fullName.trim(),
        programme:  form.programme.trim().toUpperCase(),
        year:       parseInt(form.year),
        gender:     form.gender || "",
        createdAt:  new Date().toISOString(),
      });
      setMsg("✅ Student added.");
      setForm({ regNumber: "", fullName: "", programme: "", year: "", gender: "" });
      setShowAdd(false);
      fetchAll();
    } catch (err) {
      setMsg("❌ " + err.message);
    }
    setSaving(false);
  };

  const handleSaveEdit = async () => {
    if (!editStu.fullName || !editStu.programme || !editStu.year) {
      setMsg("Fill in required fields."); return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, "students", editStu.id), {
        fullName:  editStu.fullName,
        programme: editStu.programme,
        year:      parseInt(editStu.year),
        gender:    editStu.gender || "",
      });
      setMsg("✅ Updated.");
      setEditStu(null);
      fetchAll();
    } catch (err) {
      setMsg("❌ " + err.message);
    }
    setSaving(false);
  };

  const presentAll  = records.filter(r => r.status === "present").length;
  const absentAll   = records.filter(r => r.status === "absent").length;

  return (
    <div style={s.container}>

      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Students</h1>
          <p style={s.subtitle}>{students.length} registered · {sessions.length} sessions · {presentAll} attendances recorded</p>
        </div>
        <button style={s.addBtn} onClick={() => { setShowAdd(!showAdd); setMsg(""); }}>
          {showAdd ? "Cancel" : "+ Add Student"}
        </button>
      </div>

      {/* Stats bar */}
      <div style={s.statsRow}>
        <div style={s.statCard}>
          <div style={s.statNum}>{students.length}</div>
          <div style={s.statLabel}>Total Students</div>
        </div>
        <div style={s.statCard}>
          <div style={{ ...s.statNum, color: "#10b981" }}>{presentAll}</div>
          <div style={s.statLabel}>Present Records</div>
        </div>
        <div style={s.statCard}>
          <div style={{ ...s.statNum, color: "#c0392b" }}>{absentAll}</div>
          <div style={s.statLabel}>Absent Records</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statNum}>{sessions.length}</div>
          <div style={s.statLabel}>Sessions Held</div>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div style={s.formCard}>
          <h3 style={s.formTitle}>Add New Student</h3>
          <div style={s.formGrid}>
            <div>
              <label style={s.lbl}>REG NUMBER *</label>
              <input style={s.inp} placeholder="e.g. BEDA2501" value={form.regNumber}
                onChange={e => setForm({ ...form, regNumber: e.target.value })} />
            </div>
            <div>
              <label style={s.lbl}>FULL NAME *</label>
              <input style={s.inp} placeholder="Full name" value={form.fullName}
                onChange={e => setForm({ ...form, fullName: e.target.value })} />
            </div>
            <div>
              <label style={s.lbl}>PROGRAMME *</label>
              <input style={s.inp} placeholder="e.g. BEDA" value={form.programme}
                onChange={e => setForm({ ...form, programme: e.target.value })} />
            </div>
            <div>
              <label style={s.lbl}>YEAR *</label>
              <select style={s.inp} value={form.year}
                onChange={e => setForm({ ...form, year: e.target.value })}>
                <option value="">— Select —</option>
                {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
            <div>
              <label style={s.lbl}>GENDER</label>
              <select style={s.inp} value={form.gender}
                onChange={e => setForm({ ...form, gender: e.target.value })}>
                <option value="">— Select —</option>
                <option>Male</option>
                <option>Female</option>
              </select>
            </div>
          </div>
          {msg && <div style={s.msg}>{msg}</div>}
          <button style={s.saveBtn} onClick={handleAdd} disabled={saving}>
            {saving ? "Saving…" : "Save Student"}
          </button>
        </div>
      )}

      {/* Filters */}
      <div style={s.filterRow}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={16} color="#999" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <input style={{ ...s.search, paddingLeft: "36px" }} placeholder="Search by name or reg number…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select style={s.select} value={filterProg}
          onChange={e => setFilterProg(e.target.value)}>
          {programmes.map(p => <option key={p}>{p}</option>)}
        </select>
        <select style={s.select} value={filterYear}
          onChange={e => setFilterYear(e.target.value)}>
          {years.map(y => <option key={y} value={y}>{y === "All" ? "All Years" : `Year ${y}`}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={s.tableCard}>
        <div style={s.tableHeader}>
          <span>Reg Number</span>
          <span>Full Name</span>
          <span>Programme</span>
          <span>Year</span>
          <span>Gender</span>
          <span>Present</span>
          <span>Absent</span>
          <span>Action</span>
        </div>

        {loading ? (
          <div style={s.empty}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={s.empty}>No students found</div>
        ) : (
          filtered.map(stu => {
            const st = getStats(stu.regNumber);
            return (
              <div key={stu.id} style={s.tableRow}>
                <span style={s.reg}>{stu.regNumber}</span>
                <span style={s.bold}>{stu.fullName || stu.name || "—"}</span>
                <span><span style={s.progBadge}>{stu.programme || "—"}</span></span>
                <span>Year {stu.year || "—"}</span>
                <span style={{ color: stu.gender === "Female" ? "#a855f7" : "#3b82f6", fontWeight: 600 }}>
                  {stu.gender || "—"}
                </span>
                <span style={{ color: "#10b981", fontWeight: 700 }}>{st.present}</span>
                <span style={{ color: st.absent > 0 ? "#c0392b" : "#999", fontWeight: 700 }}>{st.absent}</span>
                <button style={s.editBtn} onClick={() => { setEditStu({ ...stu }); setMsg(""); }}>
                  <Pencil size={13} style={{ marginRight: 4, verticalAlign: "middle" }} />Edit
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Edit modal */}
      {editStu && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={s.formTitle}>Edit Student</h3>
            <p style={s.modalSub}>{editStu.regNumber}</p>
            <label style={s.lbl}>FULL NAME</label>
            <input style={s.inp} value={editStu.fullName || ""}
              onChange={e => setEditStu({ ...editStu, fullName: e.target.value })} />
            <label style={s.lbl}>PROGRAMME</label>
            <input style={s.inp} value={editStu.programme || ""}
              onChange={e => setEditStu({ ...editStu, programme: e.target.value })} />
            <label style={s.lbl}>YEAR</label>
            <select style={s.inp} value={editStu.year || ""}
              onChange={e => setEditStu({ ...editStu, year: e.target.value })}>
              {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
            </select>
            <label style={s.lbl}>GENDER</label>
            <select style={s.inp} value={editStu.gender || ""}
              onChange={e => setEditStu({ ...editStu, gender: e.target.value })}>
              <option value="">—</option>
              <option>Male</option>
              <option>Female</option>
            </select>
            {msg && <div style={s.msg}>{msg}</div>}
            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              <button style={s.saveBtn} onClick={handleSaveEdit} disabled={saving}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
              <button style={s.cancelBtn} onClick={() => setEditStu(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const s = {
  container:  { padding: "24px" },
  header:     { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  title:      { fontSize: "24px", fontWeight: "bold", color: "#003366" },
  subtitle:   { color: "#666", fontSize: "13px", marginTop: "4px" },
  addBtn:     { backgroundColor: "#003366", color: "#fff", border: "none", borderRadius: "8px", padding: "10px 18px", fontSize: "14px", fontWeight: "bold", cursor: "pointer" },

  statsRow:   { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "20px" },
  statCard:   { backgroundColor: "#fff", borderRadius: "12px", padding: "16px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", textAlign: "center" },
  statNum:    { fontSize: "28px", fontWeight: "bold", color: "#003366" },
  statLabel:  { fontSize: "12px", color: "#888", marginTop: "4px" },

  formCard:   { backgroundColor: "#fff", borderRadius: "12px", padding: "20px", marginBottom: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  formTitle:  { fontSize: "16px", fontWeight: "bold", color: "#003366", marginBottom: "12px" },
  formGrid:   { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "12px" },
  lbl:        { display: "block", fontSize: "11px", fontWeight: "bold", color: "#64748b", letterSpacing: "1px", marginBottom: "5px" },
  inp:        { width: "100%", padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" },
  saveBtn:    { backgroundColor: "#28a745", color: "#fff", border: "none", borderRadius: "8px", padding: "10px 24px", fontWeight: "bold", cursor: "pointer" },
  cancelBtn:  { backgroundColor: "#e2e8f0", color: "#333", border: "none", borderRadius: "8px", padding: "10px 24px", fontWeight: "bold", cursor: "pointer" },
  msg:        { fontSize: "13px", padding: "8px 12px", borderRadius: "6px", backgroundColor: "#f0f4f8", marginBottom: "10px" },

  filterRow:  { display: "flex", gap: "12px", marginBottom: "16px" },
  search:     { flex: 1, padding: "10px 14px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px", outline: "none" },
  select:     { padding: "10px 14px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px", outline: "none", backgroundColor: "#fff" },

  tableCard:   { backgroundColor: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  tableHeader: { display: "grid", gridTemplateColumns: "1.2fr 1.8fr 1fr 0.7fr 0.7fr 0.6fr 0.6fr 0.7fr", padding: "10px 16px", backgroundColor: "#f0f4f8", borderRadius: "8px", fontSize: "12px", fontWeight: "bold", color: "#666", marginBottom: "8px" },
  tableRow:    { display: "grid", gridTemplateColumns: "1.2fr 1.8fr 1fr 0.7fr 0.7fr 0.6fr 0.6fr 0.7fr", padding: "11px 16px", borderBottom: "1px solid #f0f4f8", fontSize: "13px", alignItems: "center" },
  reg:         { fontFamily: "monospace", color: "#003366", fontWeight: 600 },
  bold:        { fontWeight: "bold", color: "#0f172a" },
  progBadge:   { backgroundColor: "#e8f0fe", color: "#003366", padding: "2px 8px", borderRadius: "10px", fontSize: "12px", fontWeight: "bold" },
  editBtn:     { backgroundColor: "#e8f0fe", color: "#003366", border: "none", borderRadius: "6px", padding: "5px 10px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" },
  empty:       { textAlign: "center", padding: "40px", color: "#999" },

  overlay:    { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal:      { backgroundColor: "#fff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "400px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column", gap: "8px" },
  modalSub:   { color: "#666", fontSize: "13px", marginBottom: "4px" },
};
