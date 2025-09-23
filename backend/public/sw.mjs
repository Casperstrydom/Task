// public/sw.js
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    console.error("Push event data error:", e);
  }

  const options = {
    body: data.body || "You have a new notification",
    icon: data.icon || "/icon.png",
    badge: "/badge.png",
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || "New Notification",
      options
    )
  );
});
