#!/usr/bin/env python3
"""Deploy na Vercel prek REST API (project-scoped token)."""
import base64, json, os, sys, urllib.request

TOKEN = os.environ["VERCEL_TOKEN"]
TEAM = "robertpezdirc12-designs-projects"
PROJECT_ID = "prj_Pg1UyGub5Azha3CyZdog2UzIgf2o"
ROOT = os.getcwd()

FILES = [
    "index.html",
    "tehnicka-risba-pro.html",
    "manifest.webmanifest",
    "sw.js",
    "icon-192.png",
    "icon-512.png",
    "vendor/jspdf.umd.min.js",
    "vendor/svg2pdf.umd.min.js",
    "vendor/qr-core.js",
    "vendor/LiberationSans-Regular.ttf",
]

files = []
for rel in FILES:
    p = os.path.join(ROOT, rel)
    with open(p, "rb") as fh:
        b64 = base64.b64encode(fh.read()).decode("ascii")
    files.append({"file": rel.replace(os.sep, "/"), "data": b64})

payload = {
    "name": "draftwright-demo",
    "project": PROJECT_ID,
    "files": files,
    "target": "production",
    "projectSettings": {"framework": None, "buildCommand": None},
}

req = urllib.request.Request(
    "https://api.vercel.com/v13/deployments",
    data=json.dumps(payload).encode("utf-8"),
    headers={
        "Authorization": "Bearer " + TOKEN,
        "Content-Type": "application/json",
    },
    method="POST",
)
try:
    with urllib.request.urlopen(req, timeout=300) as resp:
        out = json.load(resp)
    print("id:", out.get("id"))
    print("url:", out.get("url"))
    print("readyState:", out.get("readyState"))
except urllib.error.HTTPError as e:
    print("HTTP", e.code)
    print(e.read().decode("utf-8")[:500])
    sys.exit(1)
