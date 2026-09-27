from pathlib import Path
import re, sys

ROOT=Path(__file__).resolve().parents[1]
APP=ROOT/"GENEVIEVE_CATS_DOGS_LIVE_DEMO"
errors=[]

def fail(msg): errors.append(msg)

# Guard against the exact corruption found in the recovered branch.
bad_markers=["<buttton","�","Ã","Â","â€™","â€“","â€”","â€¢"]
for base in [APP, ROOT/"worker", ROOT/"docs"]:
    if not base.exists():
        continue
    for p in base.rglob("*"):
        if p.is_file() and p.suffix.lower() in {".html",".js",".css",".md",".json",".toml",".webmanifest"}:
            text=p.read_text(encoding="utf-8")
            for marker in bad_markers:
                if marker in text:
                    fail(f"{p.relative_to(ROOT)} contains corruption marker {marker!r}")

# Canonical runtime must not contain Vercel deployment configuration.
for p in list(APP.glob("*.html"))+list(APP.glob("*.js"))+list(APP.glob("*.css"))+[ROOT/"wrangler.toml"]:
    if p.exists() and re.search(r"vercel",p.read_text(encoding="utf-8"),re.I):
        fail(f"{p.relative_to(ROOT)} still references Vercel")

index=(APP/"index.html").read_text(encoding="utf-8")
for required in ['data-screen="safety-command"','id="safety-command"','safety-command.js']:
    if required not in index:
        fail(f"index.html missing {required}")

for src in re.findall(r'<script[^>]+src=["\']([^"\']+)["\']', index, re.I):
    if src.startswith(("http://","https://")):
        continue
    target=(APP/src.replace("./","",1)).resolve()
    if not target.exists():
        fail(f"index.html references missing script {src}")

sw=(APP/"sw.js").read_text(encoding="utf-8")
if "safety-command.js" not in sw:
    fail("service worker does not cache safety-command.js")

worker=(ROOT/"worker/src/index.js").read_text(encoding="utf-8")
for required in ["access_tokens","authenticate","HYPERDRIVE","facility_id","audit_events"]:
    if required not in worker:
        fail(f"worker missing security/isolation marker {required}")

migration=(ROOT/"migrations/0001_core.sql").read_text(encoding="utf-8")
for table in ["facilities","access_tokens","animals","kennels","care_tasks","incidents","stock_items","daily_ops","physio_records","compliance_evidence","audit_events"]:
    if f"CREATE TABLE {table}" not in migration:
        fail(f"migration missing table {table}")

operations=(ROOT/"migrations/0002_operations.sql").read_text(encoding="utf-8")
for table in ["staff_members","bookings","custody_records","rounds","transports","alerts","emergency_state","owner_updates","pickup_authority_requests"]:
    if f"CREATE TABLE {table}" not in operations:
        fail(f"operations migration missing table {table}")

for route in ["/api/bookings","/api/custody","/api/rounds","/api/transports","/api/alerts","/api/emergency","/api/owner/me","/api/owner/pickup-authority-requests","/api/workforce-events"]:
    if route not in worker:
        fail(f"worker missing operational route {route}")


for required_path in [
    ROOT/"scripts/generate_access_token.py",
    ROOT/"scripts/smoke_api.py",
    ROOT/"scripts/seed_synthetic.sql",
    ROOT/"scripts/cleanup_synthetic.sql",
    ROOT/"docs/PRODUCTION_HANDOVER_CHECKLIST.md",
]:
    if not required_path.exists():
        fail(f"missing deployment-readiness artifact {required_path.relative_to(ROOT)}")

token_helper=(ROOT/"scripts/generate_access_token.py").read_text(encoding="utf-8")
if "secrets.token_urlsafe" not in token_helper or "hashlib.sha256" not in token_helper:
    fail("access-token helper must generate high-entropy tokens and SHA-256 hashes")

seed=(ROOT/"scripts/seed_synthetic.sql").read_text(encoding="utf-8")
cleanup=(ROOT/"scripts/cleanup_synthetic.sql").read_text(encoding="utf-8")
synthetic_id="11111111-1111-4111-8111-111111111111"
if synthetic_id not in seed or synthetic_id not in cleanup:
    fail("synthetic seed and cleanup must share the deterministic facility UUID")

for base in [APP,ROOT/"worker",ROOT/"docs",ROOT/"migrations"]:
    if base.exists():
        for p in base.rglob("*"):
            if p.is_file() and p.suffix.lower() in {".js",".md",".sql",".toml",".html"}:
                t=p.read_text(encoding="utf-8")
                if re.search(r"postgres(?:ql)?://[^\s'\"<>]+",t,re.I):
                    fail(f"{p.relative_to(ROOT)} appears to contain a database connection string")

if errors:
    print("VALIDATION FAILED")
    for e in errors: print(" -",e)
    sys.exit(1)

print("VALIDATION GREEN")
print("Canonical Cats & Dogs UI + clean Safety Command + Cloudflare/Neon production foundation verified.")
