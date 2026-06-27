import { createContext, useContext, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const DARK = {
  mode: "dark",
  bg:          "#0d1117",
  card:        "#161b22",
  header:      "#161b22",
  border:      "#21262d",
  input:       "#0d1117",
  text:        "#e6edf3",
  subtext:     "#8b949e",
  accent:      "#10b981",
  danger:      "#f85149",
  toggleBg:    "#21262d",
  toggleIcon:  "🌙",
  toggleLabel: "Dark Mode",
};

export const LIGHT = {
  mode: "light",
  bg:          "#f1f5f9",
  card:        "#ffffff",
  header:      "#0f172a",
  border:      "#e2e8f0",
  input:       "#f8fafc",
  text:        "#0f172a",
  subtext:     "#64748b",
  accent:      "#10b981",
  danger:      "#f85149",
  toggleBg:    "#f1f5f9",
  toggleIcon:  "☀️",
  toggleLabel: "Light Mode",
};

const ThemeContext = createContext({ theme: DARK, toggleTheme: () => {} });

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(DARK);

  const toggleTheme = () => {
    setTheme((t) => {
      const next = t.mode === "dark" ? LIGHT : DARK;
      AsyncStorage.setItem("easyattend_theme", next.mode).catch(() => {});
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
