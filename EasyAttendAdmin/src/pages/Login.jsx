import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      const code = err.code || "";
      if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setError("❌ Invalid email or password. Please try again.");
      } else if (code === "auth/invalid-email") {
        setError("❌ Please enter a valid email address.");
      } else if (code === "auth/too-many-requests") {
        setError("❌ Too many failed attempts. Please wait a few minutes.");
      } else {
        setError("❌ Login failed. Check your credentials and try again.");
      }
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        {/* Logo */}
        <div style={styles.logoCircle}>EA</div>
        <div style={styles.badge}>MZUZU UNIVERSITY</div>
        <h1 style={styles.title}>EasyAttend</h1>
        <p style={styles.subtitle}>Admin Dashboard</p>

        {/* Form */}
        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>EMAIL ADDRESS</label>
            <input
              style={styles.input}
              type="email"
              placeholder="admin@mzuni.ac.mw"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>PASSWORD</label>
            <div style={styles.inputWrapper}>
              <input
                style={styles.inputInner}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                style={styles.eyeBtn}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} color="#8899bb" /> : <Eye size={18} color="#8899bb" />}
              </button>
            </div>
          </div>

          {error && (
            <div style={styles.errorBox}>
              {error}
            </div>
          )}

          <button
            style={styles.button}
            type="submit"
            disabled={loading}>
            {loading ? "Signing in..." : "Sign In →"}
          </button>
        </form>

        <p style={styles.footer}>
          Only authorized administrators can sign in.
        </p>

      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#0a0f1e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
  card: {
    backgroundColor: "#131c30",
    borderRadius: "20px",
    padding: "40px",
    width: "100%",
    maxWidth: "420px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    border: "1px solid #2a3f5f",
  },
  logoCircle: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    backgroundColor: "#28a745",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontWeight: "bold",
    fontSize: "24px",
    marginBottom: "12px",
  },
  badge: {
    backgroundColor: "#28a745",
    color: "#fff",
    fontSize: "11px",
    fontWeight: "bold",
    letterSpacing: "1px",
    padding: "4px 14px",
    borderRadius: "20px",
    marginBottom: "12px",
  },
  title: {
    color: "#ffffff",
    fontSize: "28px",
    fontWeight: "bold",
    marginBottom: "4px",
  },
  subtitle: {
    color: "#8899bb",
    fontSize: "14px",
    marginBottom: "32px",
  },
  form: {
    width: "100%",
  },
  fieldGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    color: "#8899bb",
    fontSize: "11px",
    fontWeight: "bold",
    letterSpacing: "1px",
    marginBottom: "8px",
  },
  input: {
    width: "100%",
    backgroundColor: "#1e2d4a",
    border: "1px solid #2a3f5f",
    borderRadius: "10px",
    padding: "14px",
    fontSize: "15px",
    color: "#ffffff",
    outline: "none",
    boxSizing: "border-box",
  },
  inputWrapper: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#1e2d4a",
    border: "1px solid #2a3f5f",
    borderRadius: "10px",
    overflow: "hidden",
  },
  inputInner: {
    flex: 1,
    backgroundColor: "transparent",
    border: "none",
    padding: "14px",
    fontSize: "15px",
    color: "#ffffff",
    outline: "none",
  },
  eyeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "0 14px",
    fontSize: "18px",
    lineHeight: 1,
  },
  errorBox: {
    backgroundColor: "#3a1a1a",
    border: "1px solid #c0392b",
    borderRadius: "8px",
    padding: "12px",
    color: "#ff6b6b",
    fontSize: "13px",
    marginBottom: "16px",
    textAlign: "center",
  },
  button: {
    width: "100%",
    backgroundColor: "#28a745",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "16px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "8px",
  },
  footer: {
    color: "#445566",
    fontSize: "12px",
    marginTop: "20px",
    textAlign: "center",
  },
};