import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { AuthProvider } from "./auth/AuthProvider";
import { installInfrastructureToastGuard } from "./lib/staffErrors";
import "./index.css";
import "./styles/build-1.4.5-hardening.css";
import "./styles/build-1.4.6.css";
import "./styles/build-1.4.7.css";
import "./styles/build-1.4.8.css";
import "./styles/build-1.4.8.1.css";
import "./styles/build-1.4.8.2.css";
import "./styles/build-1.4.8.9.css";
import "./styles/build-1.4.8.10.css";
import "./styles/build-1.5.1.css";
import "./styles/build-1.5.3.css";
import "./styles/build-1.5.4.css";
import "./styles/build-1.5.5.css";
import "./styles/build-1.5.6.css";
import "./styles/build-1.5.7.css";
import "./styles/build-1.5.8.css";
import "./styles/build-1.5.9.css";
import "./styles/build-1.6.0.css";
import "./styles/build-1.6.2.css";
import "./styles/build-1.6.3.css";
import "./styles/login-1.6.5.3.css";
import "./styles/window-motion-1.6.5.6.css";

installInfrastructureToastGuard();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/accqua-notifications-sw.js");
  });
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
