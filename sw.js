/* Tehnična risba PRO — service worker (P3): aplikacija deluje brez signala na terenu.
   Strategija: navigacije network-first (z offline fallbackom), ostali isti izvori
   stale-while-revalidate. Različico SW_CACHE povečaj ob vsaki spremembi datotek. */
var SW_VERSION = "3";
var SW_CACHE_PREFIX = "risba-pro-";
var SW_CACHE = SW_CACHE_PREFIX + SW_VERSION;
var SW_MAX_ENTRIES = 80;
var SW_ASSETS = ["./", "./index.html", "./tehnicka-risba-pro.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./vendor/jspdf.umd.min.js", "./vendor/svg2pdf.umd.min.js", "./vendor/LiberationSans-Regular.ttf", "./js/00-core.js", "./js/01-input-calibration.js", "./js/02-detection.js", "./js/03-validation.js", "./js/04-svg-lib.js", "./js/05-sheets.js", "./js/06-exports-dxf-step.js", "./js/07-project.js", "./js/08-roksal.js", "./js/09-production.js", "./js/10-pdf.js", "./js/11-export-dialog.js", "./js/12-tloris.js", "./js/13-skica.js", "./js/14-ui-fields.js", "./js/15-ui-misc.js", "./js/16-boot.js"];

function trimCache(cache) {
  return cache.keys().then(function (keys) {
    if (keys.length <= SW_MAX_ENTRIES) return;
    return Promise.all(keys.slice(0, keys.length - SW_MAX_ENTRIES).map(function (key) { return cache.delete(key); }));
  }).catch(function () {});
}

self.addEventListener("install", function (e) {
  /* Posamezna sredstva naj ne blokirajo namestitve, če manjka katero od njih. */
  e.waitUntil(caches.open(SW_CACHE).then(function (cache) {
    return Promise.all(SW_ASSETS.map(function (url) { return cache.add(url).catch(function () {}); }));
  }));
});

/* Nov service worker prevzame šele, ko uporabnik potrdi poziv za posodobitev. */
self.addEventListener("message", function (e) {
  if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (key) {
      return key.indexOf(SW_CACHE_PREFIX) === 0 && key !== SW_CACHE;
    }).map(function (key) { return caches.delete(key); }));
  }).then(function () { return self.clients.claim(); }));
});

function networkFirst(req) {
  return fetch(req).then(function (res) {
    if (res && res.status === 200 && res.type === "basic") {
      var copy = res.clone();
      caches.open(SW_CACHE).then(function (cache) { return cache.put(req, copy).then(function () { return trimCache(cache); }); }).catch(function () {});
    }
    return res;
  }).catch(function () {
    return caches.open(SW_CACHE).then(function (cache) {
      return cache.match(req).then(function (hit) {
        return hit || cache.match("./tehnicka-risba-pro.html") || cache.match("./index.html") || Response.error();
      });
    });
  });
}

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === "navigate") { e.respondWith(networkFirst(req)); return; }

  e.respondWith(caches.open(SW_CACHE).then(function (cache) {
    return cache.match(req).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res && res.status === 200 && res.type === "basic") {
          var copy = res.clone();
          cache.put(req, copy).then(function () { return trimCache(cache); }).catch(function () {});
        }
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    });
  }));
});
