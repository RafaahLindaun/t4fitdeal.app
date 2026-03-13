import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

let lastTouchEnd = 0;
document.addEventListener(
  "touchend",
  (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  },
  { passive: false }
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <App />
);
