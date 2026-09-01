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

  const targetUrl = event.notification?.data?.url || "/menu-teste";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          if ("navigate" in client) client.navigate(targetUrl);
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }

      return undefined;
    }),
  );
});
