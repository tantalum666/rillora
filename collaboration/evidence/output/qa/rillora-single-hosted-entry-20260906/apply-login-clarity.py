"""Scoped, already-authorized hosted-login layout and method-clarity apply."""
from pathlib import Path
import json
import plistlib
import re
import runpy

ROOT = Path.cwd()
helpers = runpy.run_path(str(ROOT / "tools/auth0/apply-hosted-consent.py"))
api, save = helpers["api"], helpers["save"]
out = ROOT / "output/qa/rillora-single-hosted-entry-20260906/login-clarity-v2"
if out.exists():
    raise SystemExit("Use a fresh evidence directory before reapplying.")
out.mkdir()
source = ROOT / "infra/auth0/universal-login"
info = plistlib.loads(Path("/tmp/rillora-single-hosted-entry-20260906-derived-data/Build/Products/Debug-iphonesimulator/Rillora.app/Info.plist").read_bytes())
client_id = info["RilloraAuth0ClientID"]
client = api("get", f"clients/{client_id}?fields=client_id,name,app_type&include_fields=true")
assert client.get("name") == "Rillora iOS" and client.get("app_type") == "native"

theme = api("get", "branding/themes/default")
assert re.fullmatch(r"[A-Za-z0-9]{32}", theme.get("themeId", ""))
texts = {name: api("get", f"prompts/{name}/custom-text/en") for name in ("login-id", "login-password")}
apple = api("get", "connections?strategy=apple&fields=id,options&include_fields=true")
assert len(apple) == 1 and not apple[0].get("options", {}).get("client_id"), "Review Apple web configuration before changing its availability."
connection_id = apple[0]["id"]
bindings = api("get", f"connections/{connection_id}/clients?take=1000")
assert not bindings.get("next"), "Complete connection binding readback required."
before_clients = [x["client_id"] for x in bindings["clients"]]

save(out / "theme-before.json", theme)
save(out / "apple-binding-before.json", {"connection_id": connection_id, "client_ids": before_clients})
for name, value in texts.items():
    save(out / f"{name}-before.json", value)

wanted_theme = {k: v for k, v in theme.items() if k != "themeId"}
wanted_theme["widget"]["social_buttons_layout"] = "top"
api("patch", f"branding/themes/{theme['themeId']}", wanted_theme)
for name, value in texts.items():
    wanted = json.loads((source / f"custom-text/{name}.en.json").read_text())
    value.setdefault(name, {}).update(wanted[name])
    api("put", f"prompts/{name}/custom-text/en", value)
    actual = api("get", f"prompts/{name}/custom-text/en")
    assert actual == value
    save(out / f"{name}-after.json", actual)

if client_id in before_clients:
    api("patch", f"connections/{connection_id}/clients", [{"client_id": client_id, "status": False}])
after = api("get", f"connections/{connection_id}/clients?take=1000")
assert not after.get("next")
assert set(x["client_id"] for x in after["clients"]) == set(before_clients) - {client_id}
save(out / "apple-binding-after.json", {"connection_id": connection_id, "client_ids": [x["client_id"] for x in after["clients"]]})
actual_theme = api("get", "branding/themes/default")
assert helpers["subset"](wanted_theme, actual_theme)
save(out / "theme-after.json", actual_theme)
save(out / "result.json", {"readback_matches": True, "social_buttons_layout": "top", "google_method_guidance": True, "ios_apple_hosted_connection_enabled": False, "other_connection_bindings_unchanged": True, "credentials_changed": False, "users_or_sessions_changed": False, "page_template_changed": False, "template_api_gate": "402 paid feature; use scoped Form CSS instead"})
print("Login layout, method guidance and iOS Apple availability applied and read back.")
