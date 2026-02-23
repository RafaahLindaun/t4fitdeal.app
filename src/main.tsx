import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "./context/ThemeContext";

ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
).render(
  <React.StrictMode>
      <App />
  </React.StrictMode>
);
useEffect(() => {
  let lastTouchEnd = 0;

  const onTouchEnd = (e: TouchEvent) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault(); // evita double-tap zoom
    }
    lastTouchEnd = now;
  };

  document.addEventListener("touchend", onTouchEnd, { passive: false });
  return () => document.removeEventListener("touchend", onTouchEnd as any);
}, []);


