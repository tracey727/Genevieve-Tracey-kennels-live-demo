from pathlib import Path
import os, sys

required=["HYPERDRIVE_ID"]
missing=[k for k in required if not os.environ.get(k)]
if missing:
    print("Missing required deployment secret(s): "+", ".join(missing), file=sys.stderr)
    sys.exit(2)

base=Path("wrangler.toml").read_text(encoding="utf-8").rstrip()+"\n\n"
base += '[[hyperdrive]]\n'
base += 'binding = "HYPERDRIVE"\n'
base += 'id = "'+os.environ["HYPERDRIVE_ID"].replace('"','')+'"\n'
Path("wrangler.deploy.toml").write_text(base,encoding="utf-8")
print("Rendered wrangler.deploy.toml without exposing secrets.")
