import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig";
import Login        from "./pages/Login";
import Dashboard    from "./pages/Dashboard";
import Timetable    from "./pages/Timetable";
import Instructors  from "./pages/Instructors";
import Students     from "./pages/Students";
import Venues       from "./pages/Venues";
import Sessions     from "./pages/Sessions";
import Reports      from "./pages/Reports";
import CreateAdmin  from "./pages/CreateAdmin";
import Sidebar      from "./components/Sidebar";
import TopBar       from "./components/TopBar";
import "./App.css";

function App() {
  const [user,      setUser]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
    return unsub;
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#0a0f1e", color: "#fff", fontSize: "18px" }}>
        Loading EasyAttend Admin…
      </div>
    );
  }

  if (!user) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<Login />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <div style={{ display: "flex", minHeight: "100vh", alignItems: "flex-start" }}>

        {/* Collapsible sidebar */}
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

        {/* Main area */}
        <div style={{ flex: 1, height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", background: "#f0f4f8" }}>
          <TopBar />
          <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
            <Routes>
              <Route path="/"             element={<Dashboard   />} />
              <Route path="/timetable"    element={<Timetable   />} />
              <Route path="/instructors"  element={<Instructors />} />
              <Route path="/students"     element={<Students    />} />
              <Route path="/venues"       element={<Venues      />} />
              <Route path="/sessions"     element={<Sessions    />} />
              <Route path="/reports"      element={<Reports     />} />
              <Route path="/create-admin" element={<CreateAdmin />} />
              <Route path="*"             element={<Navigate to="/" />} />
            </Routes>
          </div>
        </div>

      </div>
    </BrowserRouter>
  );
}

export default App;
