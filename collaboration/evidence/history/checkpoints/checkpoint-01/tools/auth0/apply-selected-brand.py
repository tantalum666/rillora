"""Apply only selected Logo fields supported by the current Auth0 plan."""
from datetime import datetime, timezone
from pathlib import Path
import hashlib
import json
import os
import subprocess

ROOT = Path(__file__).resolve().parents[2]
QA = ROOT / "output/qa/rillora-annual-brand-capacity-20260921"
BACKUP = ROOT / ".local-secrets/annual-brand-auth0"
TENANT = "rillora-dev.eu.auth0.com"
CLIENTS = {"Sbf9lj69O25Cf7JZSZJuI09bTcRi2i0x": "Rillora Web",
           "HDfmJrHaM08lDAgsygPm7b5OB1aaUhrZ": "Rillora iOS"}


def api(method, path, body=None):
    result = subprocess.run(["auth0", "api", method, path, "--no-input", "--no-color"],
                            input=None if body is None else json.dumps(body), capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError(f"Auth0 {method} {path} failed: {result.stderr[-350:]}")
    return json.loads(result.stdout) if result.stdout.strip() else None


active = subprocess.run(["auth0", "tenants", "list", "--json", "--no-input", "--no-color"], capture_output=True, text=True, check=True)
tenants = json.loads(active.stdout)
selected = [row for row in tenants if row.get("active") or row.get("isActive")]
if not selected or not any(TENANT in str(row) for row in selected):
    raise RuntimeError("Active Auth0 tenant could not be verified; no mutation")

branding = json.loads((ROOT / "infra/auth0/universal-login/branding.json").read_text())
desired_theme = json.loads((ROOT / "infra/auth0/universal-login/theme.json").read_text())
assets = [
    (branding["logo_url"], ROOT / "apps/web/src/assets/brand/apple-touch-icon.png"),
    (branding["favicon_url"], ROOT / "assets/brand/rillora/favicon.svg"),
    (desired_theme["widget"]["logo_url"], ROOT / "assets/brand/rillora/lockup-reversed.svg"),
]
for url, local in assets:
    response = subprocess.run(["curl", "-fsSL", "--max-time", "20", url], capture_output=True, check=True)
    if hashlib.sha256(response.stdout).digest() != hashlib.sha256(local.read_bytes()).digest():
        raise RuntimeError("Hosted Logo differs from the selected source")

BACKUP.mkdir(parents=True, exist_ok=True, mode=0o700)
os.chmod(BACKUP, 0o700)
before = {"branding": api("get", "branding"), "theme": api("get", "branding/themes/default"), "clients": {}}
for client, name in CLIENTS.items():
    value = api("get", f"clients/{client}?fields=client_id,name,logo_uri&include_fields=true")
    if value["name"] != name:
        raise RuntimeError("Unexpected client identity; no mutation")
    before["clients"][client] = value
backup = BACKUP / (datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ") + ".json")
backup.write_text(json.dumps(before, indent=2) + "\n")
os.chmod(backup, 0o600)

api("patch", "branding", branding)
theme = dict(before["theme"])
theme_id = theme.pop("themeId")
theme["widget"] = {**theme["widget"], "logo_url": desired_theme["widget"]["logo_url"], "logo_position": "center", "logo_height": 32}
api("patch", f"branding/themes/{theme_id}", theme)
for client in CLIENTS:
    api("patch", f"clients/{client}", {"logo_uri": branding["logo_url"]})
after = {"branding": api("get", "branding"), "theme": api("get", "branding/themes/default"), "clients": {}}
for client in CLIENTS:
    after["clients"][client] = api("get", f"clients/{client}?fields=client_id,name,logo_uri&include_fields=true")
checks = {
    "tenantLogo": after["branding"].get("logo_url") == branding["logo_url"],
    "favicon": after["branding"].get("favicon_url") == branding["favicon_url"],
    "widgetFullLockup": after["theme"]["widget"]["logo_url"] == desired_theme["widget"]["logo_url"],
    "widgetVisible": after["theme"]["widget"]["logo_position"] == "center",
    "clients": all(value.get("logo_uri") == branding["logo_url"] for value in after["clients"].values()),
    "unrelatedThemePreserved": all(after["theme"].get(k) == v for k, v in before["theme"].items() if k not in ["themeId", "widget"]),
}
report = {"checkedAt": datetime.now(timezone.utc).isoformat(), "tenant": TENANT, "checks": checks,
          "branding": branding, "clients": list(CLIENTS.values()), "planChanged": False,
          "customTemplate": "Not changed; current Free API returned402 Payment Required before this operation"}
(QA / "auth0-brand-readback.json").write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps(report))
assert all(checks.values())
