const CACHE_NAME = "signature-devices-pwa-v1";
const urlsToCache = [
  "assets/logo192.png",
  "assets/logo512.png",
  "assets/favicon.png",
  "assets/toggle-theme.png",
  "constants/devices.js",
  "controllers/base-controller.js",
  "controllers/main-controller.js",
  "drivers/base-driver.js",
  "drivers/signature-pad-driver.js",
  "signature-pad/controller.js",
  "signature-pad/view.js",
  "signature-pad/templates/main.html",
  "signature-pad/profiles/base-profile.js",
  "signature-pad/profiles/default-profile.js",
  "signature-pad/profiles/profile-list.js",
  "signature-pad/profiles/topaz-signature-pad-T-LBK460-profile.js",
  "styles/shared-style.css",
  "views/main-view.js",
  "index.html",
  "manifest.json",
  "service-worker.js",
  "topaz-display/controller.js",
  "topaz-display/view.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
