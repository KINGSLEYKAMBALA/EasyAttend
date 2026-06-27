import { useState, useEffect } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, getDocs, addDoc, doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { Pencil } from "lucide-react";

// Handles both old schema (fullName, courseCodes[]) and new schema (name, courseCode)
const getDisplayName   = (i) => i.name || i.fullName || "—";
const getDisplayCourse = (i) => {
  if (i.courseCode && i.courseName) return `${i.courseCode} - ${i.courseName}`;
  if (i.courseCode) return i.courseCode;
  if (Array.isArray(i.courseCodes) && i.courseCodes.length) return i.courseCodes.join(", ");
  return null;
};
const getDisplayDate = (i) => {
  const raw = i.createdAt;
  if (!raw) return null;
  const d = new Date(raw?.seconds ? raw.seconds * 1000 : raw);
  return isNaN(d.getTime()) ? null : d.toLocaleDateString();
};

export default function Instructors() {
  const [instructors, setInstructors] = useState([]);
  const [timetable,   setTimetable]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [editInst,    setEditInst]    = useState(null); // instructor being edited
  const [form, setForm] = useState({ name: "", email: "", password: "", courseCode: "", courseName: "" });
  const [editCourseCode, setEditCourseCode] = useState("");
  const [editCourseName, setEditCourseName] = useState("");
  const [message, setMessage] = useState("");
  const [saving,  setSaving]  = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [instSnap, ttSnap] = await Promise.all([
        getDocs(collection(db, "instructors")),
        getDocs(collection(db, "timetable")),
      ]);
      setInstructors(instSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      // unique courses from timetable
      const seen = new Set();
      const courses = [];
      ttSnap.docs.forEach((d) => {
        const { courseCode, courseName } = d.data();
        if (courseCode && !seen.has(courseCode)) {
          seen.add(courseCode);
          courses.push({ code: courseCode, name: courseName || courseCode });
        }
      });
      courses.sort((a, b) => a.code.localeCompare(b.code));
      setTimetable(courses);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!form.name || !form.email || !form.password || !form.courseCode) {
      setMessage("Please fill all fields."); return;
    }
    setSaving(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const selectedCourse = timetable.find((c) => c.code === form.courseCode);
      await addDoc(collection(db, "instructors"), {
        uid:        cred.user.uid,
        name:       form.name,
        fullName:   form.name,
        email:      form.email,
        courseCode: form.courseCode,
        courseName: selectedCourse?.name || "",
        createdAt:  new Date().toISOString(),
        role:       "instructor",
      });
      setMessage(`✅ ${form.name} added successfully.`);
      setForm({ name: "", email: "", password: "", courseCode: "", courseName: "" });
      setShowForm(false);
      fetchAll();
    } catch (err) {
      if (err.code === "auth/email-already-in-use") setMessage("❌ That email already has a login account.");
      else setMessage("❌ " + err.message);
    }
    setSaving(false);
  };

  const openEdit = (inst) => {
    setEditInst(inst);
    const code = inst.courseCode || (Array.isArray(inst.courseCodes) ? inst.courseCodes[0] : "") || "";
    const name = inst.courseName || "";
    setEditCourseCode(code);
    setEditCourseName(name);
    setMessage("");
  };

  const handleSaveEdit = async () => {
    if (!editCourseCode) { setMessage("Select a course."); return; }
    setSaving(true);
    try {
      const selected = timetable.find((c) => c.code === editCourseCode);
      const courseName = selected?.name || editCourseName || editCourseCode;
      await updateDoc(doc(db, "instructors", editInst.id), {
        courseCode:  editCourseCode,
        courseName:  courseName,
        courseCodes: [editCourseCode],
        // if createdAt was missing or invalid, set it now
        ...(getDisplayDate(editInst) ? {} : { createdAt: new Date().toISOString() }),
      });
      setMessage("✅ Updated successfully.");
      setEditInst(null);
      fetchAll();
    } catch (err) {
      setMessage("❌ " + err.message);
    }
    setSaving(false);
  };

  return (
    <div style={s.container}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Instructors</h1>
          <p style={s.subtitle}>{instructors.length} registered instructors</p>
        </div>
        <button style={s.addBtn} onClick={() => { setShowForm(!showForm); setMessage(""); }}>
          {showForm ? "Cancel" : "+ Add Instructor"}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div style={s.formCard}>
          <h3 style={s.formTitle}>New Instructor</h3>
          <input style={s.input} placeholder="Full Name" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input style={s.input} placeholder="Email" type="email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input style={s.input} placeholder="Password (min 6 chars)" type="password" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <select style={s.input} value={form.courseCode}
            onChange={(e) => setForm({ ...form, courseCode: e.target.value })}>
            <option value="">— Select Course —</option>
            {timetable.map((c) => (
              <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
            ))}
          </select>
          {message && <div style={s.msg}>{message}</div>}
          <button style={s.saveBtn} onClick={handleAdd} disabled={saving}>
            {saving ? "Saving…" : "Save Instructor"}
          </button>
        </div>
      )}

      {/* Edit / Assign course modal */}
      {editInst && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={s.formTitle}>Assign Course — {getDisplayName(editInst)}</h3>
            <p style={s.modalSub}>{editInst.email}</p>
            <select style={s.input} value={editCourseCode}
              onChange={(e) => {
                setEditCourseCode(e.target.value);
                const c = timetable.find((x) => x.code === e.target.value);
                setEditCourseName(c?.name || "");
              }}>
              <option value="">— Select Course —</option>
              {timetable.map((c) => (
                <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
              ))}
            </select>
            {message && <div style={s.msg}>{message}</div>}
            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
              <button style={s.saveBtn} onClick={handleSaveEdit} disabled={saving}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
              <button style={s.cancelBtn} onClick={() => setEditInst(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={s.tableCard}>
        <div style={s.tableHeader}>
          <span>Name</span>
          <span>Email</span>
          <span>Course</span>
          <span>Added</span>
          <span>Action</span>
        </div>
        {loading ? (
          <div style={s.empty}>Loading…</div>
        ) : instructors.length === 0 ? (
          <div style={s.empty}>No instructors yet</div>
        ) : (
          instructors.map((inst) => {
            const course = getDisplayCourse(inst);
            const date   = getDisplayDate(inst);
            return (
              <div key={inst.id} style={s.tableRow}>
                <span style={s.boldText}>{getDisplayName(inst)}</span>
                <span style={s.dimText}>{inst.email}</span>
                <span style={course ? {} : s.missing}>{course || "Not assigned"}</span>
                <span style={date ? {} : s.missing}>{date || "Not set"}</span>
                <button style={s.editBtn} onClick={() => openEdit(inst)}>
                  <Pencil size={13} style={{ marginRight: 4, verticalAlign: "middle" }} />Edit
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const s = {
  container: { padding: "24px" },
  header:    { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  title:     { fontSize: "24px", fontWeight: "bold", color: "#003366" },
  subtitle:  { color: "#666", fontSize: "14px", marginTop: "4px" },
  addBtn:    { backgroundColor: "#003366", color: "#fff", border: "none", borderRadius: "8px", padding: "10px 18px", fontSize: "14px", fontWeight: "bold", cursor: "pointer" },
  formCard:  { backgroundColor: "#fff", borderRadius: "12px", padding: "20px", marginBottom: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", gap: "10px", maxWidth: "420px" },
  formTitle: { fontSize: "16px", fontWeight: "bold", color: "#003366", marginBottom: "4px" },
  input:     { padding: "10px 14px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px", outline: "none", width: "100%", boxSizing: "border-box" },
  saveBtn:   { backgroundColor: "#28a745", color: "#fff", border: "none", borderRadius: "8px", padding: "10px 20px", fontWeight: "bold", cursor: "pointer" },
  cancelBtn: { backgroundColor: "#e2e8f0", color: "#333", border: "none", borderRadius: "8px", padding: "10px 20px", fontWeight: "bold", cursor: "pointer" },
  msg:       { fontSize: "13px", padding: "8px 12px", backgroundColor: "#f0f4f8", borderRadius: "6px" },
  tableCard: { backgroundColor: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  tableHeader: { display: "grid", gridTemplateColumns: "1.5fr 2fr 2.5fr 1fr 0.8fr", padding: "10px 16px", backgroundColor: "#f0f4f8", borderRadius: "8px", fontSize: "12px", fontWeight: "bold", color: "#666", marginBottom: "8px" },
  tableRow:    { display: "grid", gridTemplateColumns: "1.5fr 2fr 2.5fr 1fr 0.8fr", padding: "12px 16px", borderBottom: "1px solid #f0f4f8", fontSize: "13px", alignItems: "center" },
  boldText:  { fontWeight: "bold", color: "#003366" },
  dimText:   { color: "#888" },
  missing:   { color: "#c0392b", fontStyle: "italic" },
  empty:     { textAlign: "center", padding: "40px", color: "#999" },
  editBtn:   { backgroundColor: "#e8f0fe", color: "#003366", border: "none", borderRadius: "6px", padding: "6px 10px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" },
  overlay:   { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal:     { backgroundColor: "#fff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "400px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" },
  modalSub:  { color: "#666", fontSize: "13px", marginBottom: "16px", marginTop: "2px" },
};
