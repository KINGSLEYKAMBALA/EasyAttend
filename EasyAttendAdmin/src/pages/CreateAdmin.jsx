import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";

export default function CreateAdmin() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [message, setMessage]   = useState(null); // { type: "success"|"error", text }

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (!email || !password) { setMessage({ type: "error", text: "Fill in all fields." }); return; }
    if (password !== confirm)  { setMessage({ type: "error", text: "Passwords do not match." }); return; }
    if (password.length < 6)   { setMessage({ type: "error", text: "Password must be at least 6 characters." }); return; }

    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setMessage({ type: "success", text: `✅ Admin account created for ${email}` });
      setEmail(""); setPassword(""); setConfirm("");
    } catch (err) {
      const code = err.code || "";
      if (code === "auth/email-already-in-use") setMessage({ type: "error", text: "That email is already registered." });
      else if (code === "auth/invalid-email")   setMessage({ type: "error", text: "Invalid email address." });
      else setMessage({ type: "error", text: "Failed to create account: " + err.message });
    }
    setLoading(false);
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h2 style={s.title}>Create Admin Account</h2>
        <p style={s.sub}>New admin will be able to log in to this dashboard immediately.</p>

        <form onSubmit={handleCreate}>
          <label style={s.label}>EMAIL ADDRESS</label>
          <input style={s.input} type="email" placeholder="admin@mzuni.ac.mw" value={email} onChange={e => setEmail(e.target.value)} required />

          <label style={s.label}>PASSWORD</label>
          <input style={s.input} type="password" placeholder="Minimum 6 characters" value={password} onChange={e => setPassword(e.target.value)} required />

          <label style={s.label}>CONFIRM PASSWORD</label>
          <input style={s.input} type="password" placeholder="Repeat password" value={confirm} onChange={e => setConfirm(e.target.value)} required />

          {message && (
            <div style={{ ...s.msg, ...(message.type === "success" ? s.msgSuccess : s.msgError) }}>
              {message.text}
            </div>
          )}

          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? "Creating…" : "Create Admin Account"}
          </button>
        </form>
      </div>
    </div>
  );
}

const s = {
  page:       { padding: "32px" },
  card:       { backgroundColor: "#fff", borderRadius: "16px", padding: "32px", maxWidth: "480px", border: "1px solid #e2e8f0" },
  title:      { fontSize: "20px", fontWeight: "bold", color: "#0f172a", marginBottom: "6px" },
  sub:        { fontSize: "13px", color: "#64748b", marginBottom: "24px" },
  label:      { display: "block", fontSize: "11px", fontWeight: "bold", color: "#64748b", letterSpacing: "1px", marginBottom: "6px", marginTop: "16px" },
  input:      { width: "100%", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px 14px", fontSize: "14px", color: "#0f172a", outline: "none", boxSizing: "border-box" },
  msg:        { borderRadius: "8px", padding: "12px", fontSize: "13px", margin: "16px 0", textAlign: "center" },
  msgSuccess: { backgroundColor: "#f0fdf4", border: "1px solid #10b981", color: "#065f46" },
  msgError:   { backgroundColor: "#fef2f2", border: "1px solid #f85149", color: "#991b1b" },
  btn:        { width: "100%", backgroundColor: "#10b981", color: "#fff", border: "none", borderRadius: "10px", padding: "14px", fontSize: "15px", fontWeight: "bold", cursor: "pointer", marginTop: "8px" },
};
