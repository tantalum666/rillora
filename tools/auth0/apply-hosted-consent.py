#!/usr/bin/env python3
"""Apply only the iOS hosted-consent form/action after an Owner CLI login.

Default mode reads current resources and saves a plan. --apply performs the
reviewed change, preserving existing Post Login binding IDs and their order.
No token, client secret, vault or M2M application is created or printed.
"""
import argparse
import json
import plistlib
from pathlib import Path
import re
import subprocess
import time

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "infra/auth0/hosted-consent"
FORM_NAME = "Rillora account acknowledgement — English"
FORM_ZH_NAME = "Rillora account acknowledgement — 简体中文"
ACTION_NAME = "Rillora hosted legal acceptance"


def api(method, resource, body=None):
    result = subprocess.run(
        ["auth0", "api", method, resource, "--no-input"],
        input=json.dumps(body) if body is not None else None,
        text=True, capture_output=True, timeout=60,
    )
    if result.returncode:
        if "expired" in result.stderr.lower() or "log in" in result.stderr.lower():
            raise RuntimeError("Auth0 CLI requires the Owner to sign in again.")
        raise RuntimeError(f"Auth0 rejected {method.upper()} for {resource.split('/')[0]}; no credentials were logged.")
    return json.loads(result.stdout) if result.stdout.strip() else {}


def one_named(items, name):
    matches = [item for item in items if item.get("name") == name]
    if len(matches) > 1:
        raise RuntimeError(f"Multiple resources named {name}; resolve the target before updating.")
    return matches[0] if matches else None


def subset(expected, actual):
    if isinstance(expected, dict):
        return isinstance(actual, dict) and all(k in actual and subset(v, actual[k]) for k, v in expected.items())
    if isinstance(expected, list):
        return isinstance(actual, list) and len(expected) == len(actual) and all(subset(x, y) for x, y in zip(expected, actual))
    return type(expected) is type(actual) and expected == actual


def bindings():
    result = api("get", "actions/triggers/post-login/bindings?per_page=100")
    items = result.get("bindings", [])
    if result.get("total", len(items)) != len(items):
        raise RuntimeError("Binding list was incomplete; refusing to replace it.")
    if any(not item.get("id") or not item.get("action", {}).get("id") for item in items):
        raise RuntimeError("A binding cannot be preserved safely.")
    return items


def binding_summary(items):
    return [{"id": x["id"], "action_id": x["action"]["id"], "display_name": x.get("display_name")} for x in items]


def save(path, value):
    path.write_text(json.dumps(value, indent=2) + "\n")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ios-info-plist", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    if any((args.output / name).exists() for name in ("deployment.json", "form-after.json", "action-before.json")):
        raise RuntimeError("Use a fresh output directory to preserve the earlier deployment and rollback evidence.")
    info = plistlib.loads(args.ios_info_plist.read_bytes())
    client_id = info.get("RilloraAuth0ClientID", "")
    if not re.fullmatch(r"[A-Za-z0-9_-]{16,80}", client_id):
        raise RuntimeError("Use a built iOS Info.plist with resolved configuration.")
    desired_form = json.loads((SOURCE / "form.json").read_text())
    desired_form_zh = json.loads((SOURCE / "form.zh-CN.json").read_text())
    template = (SOURCE / "post-login-action.cjs").read_text()
    test = subprocess.run(["node", "--test", str(SOURCE / "post-login-action.test.cjs")], capture_output=True, text=True)
    if test.returncode:
        raise RuntimeError("Local hosted-consent contract tests must pass first.")

    # A client lookup also prevents writes to a different active tenant.
    client = api("get", f"clients/{client_id}?fields=client_id,name,app_type&include_fields=true")
    if client.get("client_id") != client_id or client.get("app_type") != "native" or client.get("name") != "Rillora iOS":
        raise RuntimeError("The configured client is not the expected Rillora iOS application.")
    forms_response = api("get", "forms?per_page=100&include_totals=true")
    forms = forms_response if isinstance(forms_response, list) else forms_response.get("forms", [])
    if isinstance(forms_response, dict) and forms_response.get("total", len(forms)) != len(forms):
        raise RuntimeError("Form list was incomplete.")
    actions = api("get", "actions/actions?per_page=100")
    action_items = actions.get("actions", [])
    if actions.get("total", len(action_items)) != len(action_items):
        raise RuntimeError("Action list was incomplete.")
    form = one_named(forms, FORM_NAME)
    form_zh = one_named(forms, FORM_ZH_NAME)
    action = one_named(action_items, ACTION_NAME)
    original_bindings = bindings()
    form_before = api("get", f"forms/{form['id']}") if form else None
    action_before = api("get", f"actions/actions/{action['id']}") if action else None
    if action_before and (action_before.get("secrets") or not action_before.get("code", "").startswith("// Deployment substitutes only these public resource identifiers")):
        raise RuntimeError("Existing target Action needs review before any mutation.")
    if form_before:
        save(args.output / "form-before.json", {k: form_before[k] for k in desired_form if k in form_before})
    save(args.output / "bindings-before.json", binding_summary(original_bindings))
    save(args.output / "plan.json", {
        "form": "update" if form else "create", "action": "update" if action else "create",
        "chinese_form": "update" if form_zh else "create",
        "scope": "existing Rillora iOS client only", "preserve_binding_order": True,
        "creates_credentials": False, "persists_user_metadata": False,
    })
    if not args.apply:
        print("Current resources checked; plan saved. No tenant changes applied.")
        return

    if form:
        form = api("patch", f"forms/{form['id']}", desired_form)
    else:
        form = api("post", "forms", desired_form)
    form_id = form["id"]
    if not re.fullmatch(r"ap_[A-Za-z0-9]+", form_id):
        raise RuntimeError("Unexpected form identifier; nothing was bound.")
    actual_form = api("get", f"forms/{form_id}")
    if not subset(desired_form, actual_form):
        raise RuntimeError("Form readback did not match; nothing was bound.")
    save(args.output / "form-after.json", {k: actual_form[k] for k in desired_form})

    if form_zh:
        before_zh = api("get", f"forms/{form_zh['id']}")
        save(args.output / "form-zh-before.json", {k: before_zh[k] for k in desired_form_zh if k in before_zh})
        form_zh = api("patch", f"forms/{form_zh['id']}", desired_form_zh)
    else:
        form_zh = api("post", "forms", desired_form_zh)
    form_zh_id = form_zh["id"]
    if not re.fullmatch(r"ap_[A-Za-z0-9]+", form_zh_id):
        raise RuntimeError("Unexpected Chinese form identifier; nothing was bound.")
    actual_zh = api("get", f"forms/{form_zh_id}")
    if not subset(desired_form_zh, actual_zh):
        raise RuntimeError("Chinese form readback did not match; nothing was bound.")
    save(args.output / "form-zh-after.json", {k: actual_zh[k] for k in desired_form_zh})

    code = template.replace("__RILLORA_IOS_CLIENT_ID__", client_id).replace("__RILLORA_FORM_ID__", form_id).replace("__RILLORA_FORM_ZH_ID__", form_zh_id)
    desired_action = {"name": ACTION_NAME, "runtime": "node22", "supported_triggers": [{"id": "post-login", "version": "v3"}], "code": code}
    if action:
        save(args.output / "action-before.json", {k: action_before[k] for k in desired_action if k in action_before})
        action = api("patch", f"actions/actions/{action['id']}", desired_action)
    else:
        action = api("post", "actions/actions", desired_action)
    action_id = action["id"]
    api("post", f"actions/actions/{action_id}/deploy")
    for _ in range(12):
        deployed = api("get", f"actions/actions/{action_id}")
        if deployed.get("status") == "built" and deployed.get("deployed_version"):
            break
        time.sleep(0.5)
    else:
        raise RuntimeError("Action deployment did not become ready; nothing was bound.")
    if deployed.get("code") != code or deployed.get("deployed_version", {}).get("code") != code:
        raise RuntimeError("Deployed Action code did not match; nothing was bound.")
    if binding_summary(bindings()) != binding_summary(original_bindings):
        raise RuntimeError("Bindings changed during preparation; no binding replacement was attempted.")
    wanted = [{"ref": {"type": "binding_id", "value": x["id"]}} for x in original_bindings]
    expected_ids = [x["action"]["id"] for x in original_bindings]
    if action_id not in expected_ids:
        wanted.append({"ref": {"type": "action_id", "value": action_id}, "display_name": ACTION_NAME})
        expected_ids.append(action_id)
    api("patch", "actions/triggers/post-login/bindings", {"bindings": wanted})
    final = bindings()
    if [x["action"]["id"] for x in final] != expected_ids:
        raise RuntimeError("Final binding order requires review.")
    save(args.output / "bindings-after.json", binding_summary(final))
    save(args.output / "deployment.json", {"form_id": form_id, "form_zh_id": form_zh_id, "action_id": action_id, "applied": True, "readback_matches": True, "live_user_flow_verified": False})
    print("Hosted-consent resources applied and read back. Live user-flow verification is still required.")


if __name__ == "__main__":
    try:
        main()
    except (RuntimeError, subprocess.TimeoutExpired) as error:
        raise SystemExit(str(error))
