/* Tehnična risba PRO — service worker (P3): aplikacija deluje brez signala na terenu.
   Strategija: stale-while-revalidate — iz predpomnilnika takoj, osvežitev v ozadju;
   brez omrežja se uporabi predpomnjena različica. Različico cache povečaj ob večjih spremembah. */
var SW_CACHE = "risba-pro-v1";
var SW_ASSETS = ["./", "./tehnicka-risba-pro.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./vendor/jspdf.umd.min.js", "./vendor/svg2pdf.umd.min.js", "./vendor/LiberationSans-Regular.ttf"];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(SW_CACHE).then(function (cache) { return cache.addAll(SW_ASSETS); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== SW_CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  var url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return; /* zunanje vire ne prestrežemo */
  e.respondWith(
    caches.open(SW_CACHE).then(function (cache) {
      return cache.match(e.request).then(function (hit) {
        var net = fetch(e.request).then(function (res) {
          if (res && res.status === 200 && res.type === "basic") cache.put(e.request, res.clone());
          return res;
        }).catch(function () { return hit; });
        return hit || net;
      });
    })
  );
});
