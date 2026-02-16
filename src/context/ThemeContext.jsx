import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  useEffect(() => {
    localStorage.setItem("theme", theme);

    // opcional: coloca um atributo no <html> pra facilitar CSS global
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const value = useMemo(() => {
    function toggleTheme() {
      setTheme((t) => (t === "dark" ? "light" : "dark"));
    }
    return { theme, setTheme, toggleTheme };
  }, [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme precisa estar dentro de <ThemeProvider />");
  return ctx;
}
