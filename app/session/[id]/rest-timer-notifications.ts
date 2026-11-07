// Notification support is optional; failures must never interrupt a rest timer.
export async function prepareRestTimerNotifications() {
  try {
    if (typeof Notification === "undefined" || !navigator.serviceWorker) return;
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      await navigator.serviceWorker.register("/sw.js");
    }
  } catch {
    // Private browsing, unsupported workers, or registration failures are harmless.
  }
}

export async function requestRestTimerPermission() {
  try {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  } catch {
    // Permission prompts are best effort, including synchronous browser failures.
  }
}

export async function notifyRestTimer(title: string, body: string) {
  try {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const options = { body, icon: "/icons/icon-192.png", tag: "rest-timer" };
    // Look up the current registration at completion, including first-page activation.
    // Never await serviceWorker.ready: it may remain pending forever.
    const registration = await navigator.serviceWorker?.getRegistration();
    if (registration?.active && typeof registration.showNotification === "function") {
      await registration.showNotification(title, options);
    } else {
      // Desktop fallback; mobile constructors can throw even with permission granted.
      new Notification(title, options);
    }
  } catch {
    // Notification delivery (sync or async) must not affect the timer UI.
  }
}
