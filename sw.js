// Offline-first cache: geocache sites rarely have good signal, so once the
// QR code has loaded the game a single time, it keeps working with no bars.
const VERSION = "cache-crusader-v2";
const ASSETS = [
    "./",
    "./index.html",
    "./config.js",
    "./manifest.webmanifest",
    "./vendor/kaboom.mjs",
    "./src/main.js",
    "./src/sprites.js",
    "./src/coords.js",
    "./src/dialog.js",
    "./src/controls.js",
    "./src/hud.js",
    "./src/sfx.js",
    "./src/map.js",
    "./src/scenes/title.js",
    "./src/scenes/intro.js",
    "./src/scenes/game.js",
    "./src/scenes/win.js",
    "./assets/dungeon.png",
    "./assets/title.png",
    "./assets/tin.png",
    "./assets/unscii_8x8.png",
    "./assets/icon-192.png",
    "./assets/icon-512.png",
];

self.addEventListener("install", (e) => {
    e.waitUntil(
        caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", (e) => {
    e.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

// Network-first with cache fallback: online players always get the latest
// build (important when the CO updates config.js), offline players still
// get a fully working game from cache.
self.addEventListener("fetch", (e) => {
    if (e.request.method !== "GET") return;
    e.respondWith(
        fetch(e.request)
            .then((res) => {
                if (res.ok && new URL(e.request.url).origin === location.origin) {
                    const clone = res.clone();
                    caches.open(VERSION).then((c) => c.put(e.request, clone));
                }
                return res;
            })
            .catch(() => caches.match(e.request, { ignoreSearch: true }))
    );
});
