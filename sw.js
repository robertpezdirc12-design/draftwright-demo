/* Tehnična risba PRO — service worker (P3): aplikacija deluje brez signala na terenu.
   Strategija:
   - navigacije (dokumenti): network-first → če splet pade, stalna različica;
   - ostalo: stale-while-revalidate — iz predpomnilnika takoj, osvežitev v ozadju.
   Različico cache dvigni ob večjih spremembah (stari cache se ob aktivaciji počisti). */
var SW_CACHE = "risba-pro-v2";
var SW_ASSETS = ["./", "./index.html", "./tehnicka-risba-pro.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./vendor/jspdf.umd.min.js", "./vendor/svg2pdf.umd.min.js", "./vendor/qr-core.js", "./vendor/LiberationSans-Regular.ttf"];

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

  /* navigacije: vedno sveže z omrežja; brez omrežja iz predpomnilnika */
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request).then(function (res) {
        if (res && res.status === 200) {
          var cp = res.clone();
          caches.open(SW_CACHE).then(function (cache) { cache.put(e.request, cp); });
        }
        return res;
      }).catch(function () {
        return caches.match(e.request).then(function (hit) { return hit || caches.match("./"); });
      })
    );
    return;
  }

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
