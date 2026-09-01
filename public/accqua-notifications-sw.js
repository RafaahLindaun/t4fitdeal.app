self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { title: "ACCQUA Sports", body: event.data?.text?.() || "Você tem uma nova notificação." }; }
  const title = data.title || "ACCQUA Sports";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "Você tem uma nova notificação.",
      icon: data.icon || "/accqua-logo-header.png",
      badge: data.badge || "/accqua-logo-header.png",
      data: data.data || { url: "/menu-teste" },
      tag: data.data?.notificationId ? `accqua-${data.data.notificationId}` : undefined,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || "/menu-teste";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
      return undefined;
    }),
  );
});
