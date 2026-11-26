/* Tehnična risba PRO — service worker (P3): aplikacija deluje brez signala na terenu.
   Strategija:
   - navigacije (dokumenti): network-first → če splet pade, stalna različica;
   - ostalo: stale-while-revalidate — iz predpomnilnika takoj, osvežitev v ozadju.
   Različico cache dvigni ob večjih spremembah (stari cache se ob aktivaciji počisti). */
var SW_CACHE = "risba-pro-v3";
var SW_ASSETS = ["./", "./index.html", "./tehnicka-risba-pro.html", "./print.css", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./vendor/jspdf.umd.min.js", "./vendor/svg2pdf.umd.min.js", "./vendor/qr-core.js", "./vendor/LiberationSans-Regular.ttf", "./slike/pokoncna/polna57-eksponat.webp", "./slike/pokoncna/polna100-ograja.webp", "./slike/pokoncna/polna128-balkon.webp", "./slike/pokoncna/romb67-fasada.webp", "./slike/pokoncna/montaza-polna-lica.webp", "./slike/pokoncna/montaza-vogal-lica.webp", "./slike/pokoncna/polna100-antracit.webp", "./slike/pokoncna/polna128-deska.webp", "./slike/pokoncna/rocaj-95x45.webp", "./slike/pokoncna/rocaj-92x45-poln.webp", "./slike/pokoncna/romb-alu.webp", "./slike/pokoncna/romb-cepi.webp", "./slike/pokoncna/paleta-57.webp", "./slike/pokoncna/paleta-100.webp", "./slike/pokoncna/paleta-128.webp", "./slike/pokoncna/paleta-romb.webp", "./slike/pokoncna/pohistvo-miza-kubo.webp", "./slike/pokoncna/pohistvo-klop-kubo.webp", "./slike/pokoncna/pohistvo-miza-linea.webp", "./slike/pokoncna/pohistvo-klop-linea.webp", "./slike/pokoncna/pohistvo-x.webp", "./slike/pokoncna/pohistvo-r.webp", "./slike/pokoncna/pohistvo-po-meri.webp", "./slike/pokoncna/pohistvo-klop-rustik.webp", "./slike/pokoncna/pohistvo-komplet.webp"];

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
