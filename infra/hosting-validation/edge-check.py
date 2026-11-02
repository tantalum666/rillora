"""Fixed, bounded synthetic probes. Read the ephemeral nonce from non-echo stdin."""
import json
import re
import subprocess
import sys
import termios
import time
from pathlib import Path

ORIGIN = "https://rillora-hosting-validation-20261102.rillora-candidate.workers.dev"
root = Path(__file__).resolve().parents[2]
out = root / "output/qa/rillora-cf-neon-validation-20261102/edge-results.json"
if sys.stdin.isatty():
    settings = termios.tcgetattr(sys.stdin.fileno())
    settings[3] &= ~termios.ECHO
    termios.tcsetattr(sys.stdin.fileno(), termios.TCSANOW, settings)
print("Ready for ephemeral validation nonce; input echo is disabled.", flush=True)
value = json.loads(sys.stdin.readline())
secret = value.get("nonce", "")
if not re.fullmatch(r"[A-Za-z0-9_-]{64}", secret):
    raise RuntimeError("Invalid validation nonce")
results = []
cases = [
    ("/probe/http", False),
    ("/arbitrary", True),
    ("/probe/http", True),
    ("/probe/http", True),
    ("/probe/crypto", True),
    ("/probe/file-limit", True),
    ("/probe/database", True),
    ("/probe/database", True),
]
for path, authorized in cases:
    config = "url = " + json.dumps(ORIGIN + path) + "\nrequest = \"GET\"\n"
    if authorized:
        config += "header = " + json.dumps("Authorization: Bearer " + secret) + "\n"
    started = time.monotonic()
    result = subprocess.run(
        ["curl", "--config", "-", "--silent", "--show-error", "--max-time", "30",
         "--max-filesize", "65536", "--write-out", "\n%{http_code}"],
        input=config, text=True, capture_output=True, timeout=35,
    )
    body, _, status = result.stdout.rpartition("\n")
    try:
        payload = json.loads(body)
    except ValueError:
        payload = {"nonJson": body[:200].replace(secret, "[redacted]")}
    entry = {"path": path, "authorized": authorized, "exit": result.returncode,
             "status": status, "wallSeconds": round(time.monotonic() - started, 3),
             "body": payload, "error": result.stderr[:200].replace(secret, "[redacted]")}
    expected = "404" if not authorized or path == "/arbitrary" else "200"
    entry["passed"] = result.returncode == 0 and status == expected
    if expected == "200":
        entry["passed"] = entry["passed"] and (payload.get("passed") is True or payload.get("file", {}).get("passed") is True)
        for item in payload.get("results", []):
            entry["passed"] = entry["passed"] and item.get("passed") is True and item.get("noSniff") is True
            if item.get("key", "").startswith("unauthenticated_"):
                entry["passed"] = entry["passed"] and item.get("noCache") is True
    results.append(entry)
    out.write_text(json.dumps({"origin": ORIGIN, "syntheticOnly": True, "results": results}, indent=2) + "\n")
    print(json.dumps(entry), flush=True)
secret = ""
sys.exit(0 if all(entry["passed"] for entry in results) else 1)
