self.addEventListener("push", (event) => {
  const payload = event.data ? event.data.json() : {};
  event.waitUntil(self.registration.showNotification(payload.title || "Planet Infinity", {
    body: payload.body || "There is new activity in your admin panel.",
    icon: "/icon?brand=20260829",
    badge: "/icon?brand=20260829",
    data: { url: payload.url || "/admin/notifications" },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || "/admin/notifications"));
});
