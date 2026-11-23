/**
 * Pregled 2026-11-23, točka 4 — behavioral test service workerja (sw.js).
 * tests/pwa.test.js dela le statične string-checke na sw.js; tukaj ZAVRTJE pravo
 * sw.js v VM z fake CacheStorage in preverim dejansko ODRSVOVANJE fetch handlerja:
 *   - stale-while-revalidate: hit se vrne TAKOJ (ne omrežni rezultat);
 *   - brez hita + omrežje OK → omrežni rezultat + update predpomniska;
 *   - brez hita + omrežje PAD → fallback na "./" (NE undefined) — popravljen bug;
 *   - navigacija: omrežje prvo, ob padu → predpomnik/domov;
 *   - POST in zunanji izvor → brez respondWith (preskoceno).
 */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const swSrc = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const ORIGIN = "https://draftwright-demo.vercel.app";
const URL_ = "https://draftwright-demo.vercel.app/";

let pass = 0, fail = 0;
function check(name, ok, info) {
  if (ok) { pass++; console.log(`  [PASS] ${name}${info ? " — " + info : ""}`); }
  else { fail++; console.error(`  [FAIL] ${name}${info ? " — " + info : ""}`); }
}

function makeResp(status, url, type) { return { status, type, url, clone() { return this; } }; }

function makeEnv() {
  const handlers = {};
  const SW_NAME = "risba-pro-v3";
  const cacheMap = new Map();
  const key = (r) => (r && r.url ? r.url : String(r));
  function store() { if (!cacheMap.has(SW_NAME)) cacheMap.set(SW_NAME, new Map()); return cacheMap.get(SW_NAME); }
  const caches = {
    open(name) {
      if (name !== SW_NAME) return Promise.resolve({ match() { return Promise.resolve(undefined); }, put() { return Promise.resolve(); }, addAll() { return Promise.resolve(); } });
      return Promise.resolve({
        match(req) { const e = store().get(key(req)); return Promise.resolve(e || undefined); },
        put(req, res) { store().set(key(req), res); return Promise.resolve(); },
        addAll(reqs) { return Promise.all(reqs.map((r) => { store().set(String(r), makeResp(200, String(r), "basic")); })); },
      });
    },
    match(req) { return Promise.resolve(store().get(key(req)) || undefined); },
    keys() { return Promise.resolve([SW_NAME]); },
    delete(name) { cacheMap.delete(name); return Promise.resolve(); },
  };
  let fetchImpl = (req) => Promise.resolve(makeResp(200, key(req), "basic"));
  const self = {
    location: { origin: ORIGIN, href: URL_ },
    addEventListener(type, fn) { handlers[type] = fn; },
    skipWaiting() {},
    clients: { claim() {} },
    caches,
  };
  const sandbox = {
    self, caches,
    fetch(req) { return fetchImpl(req); },
    URL, Promise, console,
  };
  vm.createContext(sandbox);
  vm.runInContext(swSrc, sandbox); // registers install/activate/fetch handlers
  return {
    getFetchHandler() { return handlers.fetch; },
    setFetch(fn) { fetchImpl = fn; },
    seed(url, resp) { store().set(url, resp || makeResp(200, url, "basic")); },
    seeded(url) { return store().has(url); },
    trigger(handler, event) {
      return new Promise((resolve, reject) => {
        let out;
        event.respondWith = (p) => { out = p; };
        handler(event);
        if (out === undefined) return reject(new Error("respondWith ni bil klican (preskocena zahteva)"));
        out.then(resolve, reject);
      });
    },
    /* for skip cases: returns the handler, lets caller assert no respondWith */
    skipProbe(reqObj, mode, method) {
      const event = { request: Object.assign({ url: reqObj, method: method || "GET", mode: mode || "same-origin", clone() { return this; } }, { clone() { return this; } }), respondWith() { this._rw = true; } };
      handlers.fetch(event);
      return !event._rw;
    },
  };
}

function req(url, mode) { return { url, method: "GET", mode: mode || "same-origin", clone() { return this; } }; }

(async () => {
  check("sw.js: fetch handler registriran v VM", (() => { const e = makeEnv(); return typeof e.getFetchHandler() === "function"; })());

  /* 1) SWR: predpomniski HIT se vrne takoj (ne omrežni rezultat) */
  {
    const env = makeEnv();
    const u = URL_ + "app.js";
    const hit = makeResp(200, u, "basic");
    env.seed(u, hit);
    env.setFetch(() => Promise.resolve(makeResp(200, u, "basic")));
    const out = await env.trigger(env.getFetchHandler(), { request: req(u), respondWith() {} });
    check("SWR: pri hitu se vrne PREDPOMNISKI rezultat (ne omrežni)", out === hit);
  }

  /* 2) BUG-fix: brez hita + omrežje PAD → fallback na "./", NE undefined */
  {
    const env = makeEnv();
    const home = makeResp(200, URL_ + ".", "basic");
    env.seed("./", home);
    env.setFetch(() => Promise.reject(new Error("offline")));
    const out = await env.trigger(env.getFetchHandler(), { request: req(URL_ + "missing.js"), respondWith() {} });
    check("offline + brez predpomniska → vrne domov (./) namesto undefined", out === home, out ? "vrnil domov" : "vrnil " + out);
  }

  /* 3) brez hita + omrežje OK → omrežni rezultat + predpomnisk posodobljen */
  {
    const env = makeEnv();
    const u = URL_ + "fresh.js";
    const net = makeResp(200, u, "basic");
    env.setFetch(() => Promise.resolve(net));
    const out = await env.trigger(env.getFetchHandler(), { request: req(u), respondWith() {} });
    check("brez hita + omrežje OK → omrežni rezultat", out === net);
    check("... in predpomnisk posodobljen (stale-while-revalidate)", env.seeded(u));
  }

  /* 4) navigacija: omrežje prvo, ob padu → domov (./) */
  {
    const env = makeEnv();
    const home = makeResp(200, URL_ + ".", "basic");
    env.seed("./", home);
    env.setFetch(() => Promise.reject(new Error("offline")));
    const out = await env.trigger(env.getFetchHandler(), { request: req(URL_, "navigate"), respondWith() {} });
    check("navigacija offline → domov (./)", out === home);
  }

  /* 5) POST zahtevka → brez respondWith */
  {
    const env = makeEnv();
    check("POST zahtevka → brez respondWith (preskoceno)", env.skipProbe(URL_, "same-origin", "POST"));
  }

  /* 6) zunanji izvor → brez respondWith */
  {
    const env = makeEnv();
    check("zunanji izvor → brez respondWith (preskoceno)", env.skipProbe("https://cdn.example.com/lib.js", "same-origin", "GET"));
  }

  console.log(`\n  Rezultat: ${pass} OK, ${fail} FAIL`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("test throw:", e && e.stack || e); process.exit(1); });
