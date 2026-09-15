self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "ACCQUA Sports";
  const notificationId = payload?.data?.notificationId || "";
  const options = {
    body: payload.body || "Você recebeu uma nova notificação.",
    icon: payload.icon || "/logo/logo_app_4k.png",
    badge: payload.badge || "/logo/logo_app_4k.png",
    data: {
      ...(payload.data || {}),
      url: payload?.data?.url || "/menu-teste",
    },
    tag: notificationId ? `accqua-${notificationId}` : "accqua-notification",
    renotify: Boolean(notificationId),
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetPath = event.notification?.data?.url || "/menu-teste";
  const targetUrl = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (windows) => {
      const exactWindow = windows.find((client) => client.url === targetUrl);
      if (exactWindow && "focus" in exactWindow) return exactWindow.focus();

      const sameOriginWindow = windows.find((client) => {
        try {
          return new URL(client.url).origin === self.location.origin;
        } catch {
          return false;
        }
      });

      if (sameOriginWindow && "focus" in sameOriginWindow) {
        if ("navigate" in sameOriginWindow) await sameOriginWindow.navigate(targetUrl);
        return sameOriginWindow.focus();
      }

      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
      return undefined;
    }),
  );
});
