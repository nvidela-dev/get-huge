// Notification-only worker. No fetch handler, caching, or application data access.
self.addEventListener("install", () => {
  self.skipWaiting();
});
