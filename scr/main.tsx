import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { AuthProvider } from "./auth/AuthProvider";
import ProfileHighlights from "./components/ProfileHighlights";
import Round2RuntimeEnhancements from "./components/Round2RuntimeEnhancements";
import Build1658Runtime from "./components/Build1658Runtime";
import RealtimeNotificationBridge from "./components/RealtimeNotificationBridge";
import ProfileTabsBridge from "./components/ProfileTabsBridge";
import RankingSocialBridge from "./components/RankingSocialBridge";
import { installInfrastructureToastGuard } from "./lib/staffErrors";
import { installStaffDestructiveActionGuard } from "./lib/staffDestructiveActions";
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
import "./styles/build-1.6.5.7-round2.css";
import "./styles/ranking-1.6.5.7.css";
import "./styles/profile-partners-1.6.5.7.css";
import "./styles/round2-runtime-1.6.5.7.css";
import "./styles/builder-menu-1.6.5.8.css";
import "./styles/build-1.6.5.9.css";
import "./styles/profile-ranking-1.6.5.9-r2.css";

installInfrastructureToastGuard();
installStaffDestructiveActionGuard();

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
          <ProfileHighlights />
          <Round2RuntimeEnhancements />
          <Build1658Runtime />
          <RealtimeNotificationBridge />
          <ProfileTabsBridge />
          <RankingSocialBridge />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);