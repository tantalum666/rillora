#!/usr/bin/env python3
"""Install an Owner-approved replacement Apple key into the existing connection.

Default mode is read-only. This does not create/revoke Apple keys or enable the
connection; those remain explicit, separately verified steps of the rotation.
Private key bytes never enter output or an evidence file.
"""
import argparse
import hmac
import json
import os
from pathlib import Path
import plistlib
import re
import runpy
import stat
import subprocess

ROOT = Path(__file__).resolve().parents[2]
SERVICES_ID = "com.rillora.auth"
OLD_KEY_ID = "9H3JRBA558"
APPLE_TEAM = "8L99CFNK24"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--key-id", required=True)
    parser.add_argument("--key-file", type=Path, required=True)
    parser.add_argument("--ios-info-plist", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    if not re.fullmatch(r"[A-Z0-9]{10}", args.key_id) or args.key_id == OLD_KEY_ID:
        raise RuntimeError("Use the newly issued replacement Key ID.")
    key_file = args.key_file.resolve()
    if key_file.parent != (ROOT / ".local-secrets/apple").resolve():
        raise RuntimeError("Move the approved key into the protected Apple secret directory first.")
    if key_file.name != f"AuthKey_{args.key_id}.p8":
        raise RuntimeError("The downloaded filename and Apple Key ID must match.")
    if stat.S_IMODE(key_file.stat().st_mode) != 0o600 or stat.S_IMODE(key_file.parent.stat().st_mode) != 0o700:
        raise RuntimeError("The key must be mode 0600 inside a mode 0700 directory.")
    if key_file.stat().st_uid != os.getuid():
        raise RuntimeError("The key must belong to the current local user.")
    ignored = subprocess.run(["git", "check-ignore", "--quiet", str(key_file.relative_to(ROOT))], cwd=ROOT, capture_output=True)
    if ignored.returncode:
        raise RuntimeError("The private key path must be excluded from Git before use.")
    key = key_file.read_bytes()
    if len(key) > 16384 or not key.startswith(b"-----BEGIN PRIVATE KEY-----"):
        raise RuntimeError("Expected the Apple PKCS8 private key file.")
    public = subprocess.run(["openssl", "pkey", "-pubout", "-outform", "DER"], input=key, capture_output=True, timeout=10)
    if public.returncode:
        raise RuntimeError("The replacement key could not be parsed; no key bytes were logged.")
    curve = subprocess.run(["openssl", "pkey", "-pubin", "-inform", "DER", "-text", "-noout"], input=public.stdout, capture_output=True, timeout=10)
    if curve.returncode or b"prime256v1" not in curve.stdout:
        raise RuntimeError("Expected the Apple P256 signing key.")

    helpers = runpy.run_path(str(ROOT / "tools/auth0/apply-hosted-consent.py"))
    api, save = helpers["api"], helpers["save"]
    info = plistlib.loads(args.ios_info_plist.read_bytes())
    client_id = info["RilloraAuth0ClientID"]
    client = api("get", f"clients/{client_id}?fields=name,app_type&include_fields=true")
    if client.get("name") != "Rillora iOS" or client.get("app_type") != "native":
        raise RuntimeError("The active tenant is not the intended Rillora iOS target.")
    connections = api("get", "connections?strategy=apple&fields=id,name,options&include_fields=true")
    if len(connections) != 1:
        raise RuntimeError("Expected exactly one existing Apple connection.")
    connection = connections[0]
    options = connection["options"]
    if options.get("team_id") != APPLE_TEAM or options.get("kid") not in {OLD_KEY_ID, args.key_id}:
        raise RuntimeError("The current Apple team/key differs from the approved rotation target.")
    if options.get("client_id") not in {None, "", SERVICES_ID}:
        raise RuntimeError("An unexpected Apple web identifier requires review.")
    bindings = api("get", f"connections/{connection['id']}/clients?take=1000")
    if bindings.get("next"):
        raise RuntimeError("Complete binding readback is required.")
    if args.output.exists():
        raise RuntimeError("Use a new evidence directory to preserve prior readbacks.")
    args.output.mkdir(parents=True)
    save(args.output / "plan.json", {
        "connection_id": connection["id"], "old_key_id": options.get("kid"),
        "new_key_id": args.key_id, "services_id": SERVICES_ID,
        "scope": "existing Apple connection and Rillora primary App only",
        "binding_unchanged": True, "secret_values_retained": False,
    })
    if not args.apply:
        print("Replacement key and target checked. No Auth0 change applied.")
        return

    wanted = dict(options)
    wanted.update({"kid": args.key_id, "client_id": SERVICES_ID, "app_secret": key.decode().strip()})
    api("patch", f"connections/{connection['id']}", {"options": wanted})
    actual = api("get", f"connections/{connection['id']}?fields=options&include_fields=true")["options"]
    if not hmac.compare_digest(actual.get("app_secret", "").strip(), wanted["app_secret"]):
        raise RuntimeError("Secret readback did not match; keep Apple disabled.")
    public_wanted = {k: v for k, v in wanted.items() if k != "app_secret"}
    if not helpers["subset"](public_wanted, actual):
        raise RuntimeError("Apple connection readback differed; keep Apple disabled.")
    if api("get", f"connections/{connection['id']}/clients?take=1000") != bindings:
        raise RuntimeError("Bindings changed concurrently; review before restoring Apple.")
    save(args.output / "result.json", {
        "applied": True, "readback_matches": True, "new_key_id": args.key_id,
        "services_id": SERVICES_ID, "secret_values_retained": False,
        "binding_unchanged": True, "old_key_revocation_verified": False,
        "real_apple_login_verified": False,
    })
    print("Replacement Apple configuration read back. Verify old-key revocation before restoring the binding.")


if __name__ == "__main__":
    try:
        main()
    except (RuntimeError, OSError, subprocess.TimeoutExpired) as error:
        raise SystemExit(str(error))
