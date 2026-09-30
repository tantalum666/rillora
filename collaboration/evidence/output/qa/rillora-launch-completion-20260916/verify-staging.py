"""Read-only deployment checks; no identities, consent, or invitations are created."""
import hashlib
import json
import re
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

QA = Path(__file__).resolve().parent
ROOT = QA.parents[2]
WEB = "https://app.staging.rillora.xyz"
API = "https://l1g8350qw0.execute-api.eu-central-1.amazonaws.com"


from curl_transport import request_url

def request(origin,path,method="GET",payload=None,headers=None):
    return request_url(origin+path,method,payload,headers)


def verify(case):
    name, origin, path, method, payload, extra, expected = case
    status, raw_headers, body = request(origin, path, method, payload, extra)
    headers = {key.lower(): value for key, value in raw_headers.items()}
    checks = {"status": status == expected, "hsts": bool(headers.get("strict-transport-security"))}
    result = {"name": name, "path": path, "status": status, "checks": checks}
    if path.startswith(("/api/", "/sharing/", "/v1/")):
        checks["no_store"] = "no-store" in headers.get("cache-control", "")
        checks["no_framework_header"] = "x-powered-by" not in headers
        parsed = json.loads(body)
        result["response"] = parsed
        if name == "legal_contract":
            checks["current_privacy"] = parsed.get("privacyVersion")=="privacy-2026-09-15-1"
            checks["current_digest"] = parsed.get("bundleSha256")=="3eb7d7bf4d3c420c49946dbfcd322293136cce556407339dc0cafa0aa5f30602"
        if name == "unknown_invitation":
            checks["new_database_function_responded"] = parsed.get("error", {}).get("code") == "invitation_unavailable"
        if name == "signed_out":
            checks["signed_out"] = parsed == {"authenticated": False}
    elif path in ("/", "/open-copy", "/account-deletion", "/account", "/invite", "/?view=shared", "/account?next=reviews"):
        checks["csp"] = bool(headers.get("content-security-policy"))
        local = (ROOT / "apps/web/dist/client/index.html").read_bytes()
        checks["matches_built_spa"] = hashlib.sha256(body).digest() == hashlib.sha256(local).digest()
    result["passed"] = all(checks.values())
    return result


cases = [
    ("sharing_allowance_private", WEB, "/api/v1/sharing/access", "GET", None, None, 401),
    ("test_checkout_private", WEB, "/api/v1/commerce/test/checkout", "POST", {"billingPeriod":"annual"}, None, 401),
    ("test_portal_private", WEB, "/api/v1/commerce/test/portal", "POST", {}, None, 401),
    ("test_checkout_cancel_private", WEB, "/api/v1/commerce/test/checkout/cancel", "POST", {}, None, 401),
    ("sharing_preview_denied", WEB, "/api/v1/sharing/preview", "POST", {"grants":[]}, None, 401),
    ("complete_backup_denied", WEB, "/api/v1/account/map/export", "POST", {"acknowledgesPrivateCopy":True}, None, 401),
    ("account_deletion_denied", WEB, "/api/v1/account/delete", "POST", {}, None, 401),
    ("deletion_status_proof_required", WEB, "/api/account-deletions/status", "GET", None, None, 401),
    ("unknown_deletion_receipt", WEB, "/api/account-deletions/status", "GET", None, {"Authorization": "[REDACTED_CREDENTIAL]"+"Z"*43}, 404),
    ("liveness", API, "/health/live", "GET", None, None, 200),
    ("database_ready", API, "/health/ready", "GET", None, None, 200),
    *[(name, WEB, path, "GET", None, None, 200) for name, path in [
        ("public_home", "/"), ("saved_copy_reader", "/open-copy"), ("deletion_status_page", "/account-deletion"), ("account_entry", "/account"),
        ("invitation_entry", "/invite"), ("shared_entry", "/?view=shared"), ("review_entry", "/account?next=reviews"),
    ]],
    ("signed_out", WEB, "/api/auth/session-status", "GET", None, None, 200),
    ("legal_contract", WEB, "/api/auth/legal-contract", "GET", None, None, 200),
    ("review_private_denied", WEB, "/api/v1/maintenance/overview", "GET", None, None, 401),
    ("review_write_denied", WEB, "/api/v1/maintenance/rounds", "POST", {}, None, 401),
    ("review_settings_denied", WEB, "/api/v1/maintenance/settings", "PATCH", {}, None, 401),
    ("review_dev_denied", WEB, "/api/v1/maintenance/overview", "GET", None, {"x-dev-planner-id": "11111111-1111-4111-8111-111111111111"}, 401),
    ("overview_private_denied", WEB, "/api/v1/overview", "GET", None, None, 401),
    ("matter_create_private_denied", WEB, "/api/v1/matters", "POST", {"category":"account","title":"Rejected unauthenticated request"}, None, 401),
    ("invitation_create_private_denied", WEB, "/api/v1/sharing/connections", "POST", {}, None, 401),
    ("private_session_denied", WEB, "/api/v1/session", "GET", None, None, 401),
    ("owner_sharing_denied", WEB, "/api/v1/sharing/connections", "GET", None, None, 401),
    ("receiver_sharing_denied", WEB, "/api/v1/sharing/shared-with-me", "GET", None, None, 401),
    ("anonymous_accept_denied", WEB, "/api/v1/sharing/invitations/accept", "POST", {"accepted": True, "invitationToken": "[REDACTED_CREDENTIAL]" * 43}, None, 401),
    ("dev_identity_denied", WEB, "/api/v1/sharing/connections", "GET", None, {"x-dev-planner-id": "11111111-1111-4111-8111-111111111111"}, 401),
    ("unknown_invitation", WEB, "/api/sharing/invitations/resolve", "POST", {"invitationToken": "[REDACTED_CREDENTIAL]" * 43}, None, 404),
    ("missing_handoff", WEB, "/api/sharing/invitations/11111111-1111-4111-8111-111111111111", "GET", None, None, 404),
    ("native_unknown_invitation", API, "/sharing/invitations/resolve", "POST", {"invitationToken": "[REDACTED_CREDENTIAL]" * 43}, None, 404),
]
with ThreadPoolExecutor(max_workers=4) as pool:
    results = list(pool.map(verify, cases))

html = (ROOT / "apps/web/dist/client/index.html").read_text()
assets = sorted("/assets/" + p.name for p in (ROOT / "apps/web/dist/client/assets").iterdir() if p.suffix in (".js", ".css"))
for asset in assets:
    status, _, body = request(WEB, asset)
    local = ROOT / "apps/web/dist/client" / asset.lstrip("/")
    results.append({"name": "published_asset", "path": asset, "status": status,
                    "passed": status == 200 and hashlib.sha256(body).digest() == hashlib.sha256(local.read_bytes()).digest()})

summary = {"passed": sum(r["passed"] for r in results), "total": len(results), "checks": results}
(QA / "aws-http-verification.json").write_text(json.dumps(summary, indent=2) + "\n")
print(json.dumps({"passed": summary["passed"], "total": summary["total"],
                  "failures": [r for r in results if not r["passed"]]}, indent=2))
raise SystemExit(0 if all(r["passed"] for r in results) else 1)
