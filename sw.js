/* Tehnična risba PRO — service worker (P3): aplikacija deluje brez signala na terenu.
   Strategija:
   - navigacije (dokumenti): network-first → če splet pade, stalna različica;
   - ostalo: stale-while-revalidate — iz predpomnilnika takoj, osvežitev v ozadju.
   Različico cache dvigni ob večjih spremembah (stari cache se ob aktivaciji počisti). */
var SW_CACHE = "risba-pro-v3";
var SW_ASSETS = ["./", "./index.html", "./tehnicka-risba-pro.html", "./print.css", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./vendor/jspdf.umd.min.js", "./vendor/svg2pdf.umd.min.js", "./vendor/qr-core.js", "./vendor/LiberationSans-Regular.ttf", "./slike/pokoncna/polna57-eksponat.jpg", "./slike/pokoncna/polna100-ograja.jpg", "./slike/pokoncna/polna128-balkon.jpg", "./slike/pokoncna/romb67-fasada.jpg", "./slike/pokoncna/montaza-polna-lica.jpg", "./slike/pokoncna/montaza-vogal-lica.jpg", "./slike/pokoncna/polna100-antracit.jpg", "./slike/pokoncna/polna128-deska.jpg", "./slike/pokoncna/rocaj-95x45.jpg", "./slike/pokoncna/rocaj-92x45-poln.jpg", "./slike/pokoncna/romb-alu.jpg", "./slike/pokoncna/romb-cepi.jpg", "./slike/pokoncna/paleta-57.jpg", "./slike/pokoncna/paleta-100.jpg", "./slike/pokoncna/paleta-128.jpg", "./slike/pokoncna/paleta-romb.jpg", "./slike/pokoncna/pohistvo-miza-kubo.jpg", "./slike/pokoncna/pohistvo-klop-kubo.jpg", "./slike/pokoncna/pohistvo-miza-linea.jpg", "./slike/pokoncna/pohistvo-klop-linea.jpg", "./slike/pokoncna/pohistvo-x.jpg", "./slike/pokoncna/pohistvo-r.jpg", "./slike/pokoncna/pohistvo-po-meri.jpg", "./slike/pokoncna/pohistvo-klop-rustik.jpg", "./slike/pokoncna/pohistvo-komplet.jpg"];

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
        if (hit) {
          /* stale-while-revalidate: hit se vrne takoj, osvežitev teče v ozadju (ne blokira odziva) */
          return hit;
        }
        /* brez predpomniska: počakaj na omrežje; če pade (in ni hit), namesto undefined
           vrni domov (navigacijski fallback) — sicer se odziv reši v undefined (pregled 2026-11-23). */
        return net.then(function (res) {
          if (res && res.status === 200) return res;
          return caches.match("./");
        });
      });
    })
  );
});
