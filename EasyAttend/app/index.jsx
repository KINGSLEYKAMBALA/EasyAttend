import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView
} from "react-native";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useTheme } from "../context/ThemeContext";

export default function LoginScreen() {
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [loading, setLoading]       = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg]         = useState("");
  const router = useRouter();
  const { theme: t, toggleTheme } = useTheme();
  const isDark = t.mode === "dark";

  const bg      = isDark ? "#0d1117" : "#f1f5f9";
  const surface = isDark ? "#161b22" : "#ffffff";
  const border  = isDark ? "#21262d" : "#e2e8f0";
  const text    = isDark ? "#e6edf3" : "#0f172a";
  const subtext = isDark ? "#8b949e" : "#64748b";
  const input   = isDark ? "#0d1117" : "#f8fafc";

  const handleLogin = async () => {
    setErrorMsg("");
    if (!email || !password) { setErrorMsg("Please fill in your email and password."); return; }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/home");
    } catch (err) {
      const code = err.code || "";
      if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setErrorMsg("Invalid email or password. Please try again.");
      } else if (code === "auth/invalid-email") {
        setErrorMsg("Please enter a valid email address.");
      } else if (code === "auth/too-many-requests") {
        setErrorMsg("Too many failed attempts. Please wait and try again.");
      } else {
        setErrorMsg("Login failed. Please check your credentials.");
      }
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={[s.root, { backgroundColor: bg }]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={[s.header, { backgroundColor: isDark ? "#161b22" : "#0f172a" }]}>
          <TouchableOpacity style={[s.themeBtn, { backgroundColor: isDark ? "#21262d" : "rgba(255,255,255,0.15)" }]} onPress={toggleTheme}>
            <Text style={{ fontSize: 16 }}>{t.toggleIcon}</Text>
          </TouchableOpacity>
          <View style={s.logoWrap}>
            <View style={s.logoBadge}>
              <Text style={s.logoText}>EA</Text>
            </View>
            <Text style={s.appName}>EasyAttend</Text>
            <Text style={s.appSub}>Mzuzu University · Attendance Management</Text>
          </View>
        </View>

        {/* Card */}
        <View style={[s.card, { backgroundColor: surface, borderColor: border }]}>
          <Text style={[s.cardTitle, { color: text }]}>Instructor Sign In</Text>
          <Text style={[s.cardSub, { color: subtext }]}>Enter your university credentials to continue</Text>

          <Text style={[s.label, { color: subtext }]}>EMAIL ADDRESS</Text>
          <View style={[s.inputWrap, { backgroundColor: input, borderColor: border }]}>
            <Text style={s.inputIcon}>✉️</Text>
            <TextInput
              style={[s.input, { color: text }]}
              placeholder="you@mzuni.ac.mw"
              placeholderTextColor={subtext}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <Text style={[s.label, { color: subtext }]}>PASSWORD</Text>
          <View style={[s.inputWrap, { backgroundColor: input, borderColor: border }]}>
            <Text style={s.inputIcon}>🔒</Text>
            <TextInput
              style={[s.input, { color: text }]}
              placeholder="••••••••"
              placeholderTextColor={subtext}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Text style={{ fontSize: 16, padding: 4 }}>{showPassword ? "🙈" : "👁️"}</Text>
            </TouchableOpacity>
          </View>

          {errorMsg ? (
            <View style={s.errorBox}>
              <Text style={s.errorText}>⚠️ {errorMsg}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Sign In →</Text>}
          </TouchableOpacity>

          <Text style={[s.hint, { color: subtext }]}>Only authorized instructors can access this system.</Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1 },
  scroll:    { flexGrow: 1, alignItems: "center", paddingBottom: 40 },
  header:    { width: "100%", alignItems: "center", paddingTop: 60, paddingBottom: 44, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, marginBottom: 28, position: "relative" },
  themeBtn:  { position: "absolute", top: 56, right: 20, width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  logoWrap:  { alignItems: "center" },
  logoBadge: { width: 64, height: 64, borderRadius: 16, backgroundColor: "#10b981", alignItems: "center", justifyContent: "center", marginBottom: 14, shadowColor: "#10b981", shadowOpacity: 0.5, shadowRadius: 12, elevation: 8 },
  logoText:  { color: "#ffffff", fontSize: 24, fontWeight: "bold" },
  appName:   { color: "#ffffff", fontSize: 30, fontWeight: "bold", letterSpacing: 0.5 },
  appSub:    { color: "#8b949e", fontSize: 12, marginTop: 6, textAlign: "center" },
  card:      { width: "91%", borderRadius: 18, padding: 24, borderWidth: 1, marginBottom: 24 },
  cardTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 4 },
  cardSub:   { fontSize: 13, marginBottom: 24 },
  label:     { fontSize: 11, fontWeight: "bold", letterSpacing: 1.1, marginBottom: 8 },
  inputWrap: { flexDirection: "row", alignItems: "center", borderRadius: 12, paddingHorizontal: 14, marginBottom: 18, borderWidth: 1 },
  inputIcon: { fontSize: 16, marginRight: 10 },
  input:     { flex: 1, paddingVertical: 14, fontSize: 15 },
  errorBox:  { backgroundColor: "#2a0d0d", borderWidth: 1, borderColor: "#f85149", borderRadius: 10, padding: 12, marginBottom: 14 },
  errorText: { color: "#f85149", fontSize: 13, textAlign: "center" },
  btn:       { backgroundColor: "#10b981", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 4, marginBottom: 16, shadowColor: "#10b981", shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 },
  btnText:   { color: "#ffffff", fontSize: 15, fontWeight: "bold", letterSpacing: 0.5 },
  hint:      { fontSize: 12, textAlign: "center" },
});
