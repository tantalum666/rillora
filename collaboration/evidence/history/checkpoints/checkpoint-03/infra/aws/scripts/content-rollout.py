"""Controlled staging content-encryption rollout; no production or sales switch.

Use diff first. prepare installs a compatible reader with temporary backfill
permissions. encrypt enables protected writes. finish removes backfill key access.
Database migration, snapshot and data verification are deliberately separate gates.
"""
from pathlib import Path
import json
import subprocess
import sys

root = Path(__file__).resolve().parents[3]
phase = sys.argv[1] if len(sys.argv) > 1 else ""
if phase not in ("diff", "prepare", "encrypt", "finish"):
    raise SystemExit("Use diff, prepare, encrypt, or finish")
evidence = root / "output/qa/rillora-content-encryption-20260922"
evidence.mkdir(parents=True, exist_ok=True)
lookup = subprocess.run([
    "aws", "--profile", "rillora-cdk-deploy", "--region", "eu-central-1",
    "cloudformation", "describe-stacks", "--stack-name", "RilloraStaging", "--output", "json",
], capture_output=True, text=True)
if lookup.returncode:
    raise SystemExit("Current AWS session unavailable; no deployment started.")
stack = json.loads(lookup.stdout)["Stacks"][0]
if stack["StackStatus"] not in ("CREATE_COMPLETE", "UPDATE_COMPLETE", "UPDATE_ROLLBACK_COMPLETE"):
    raise SystemExit("Staging stack is not at a stable checkpoint.")
command = "diff" if phase == "diff" else "deploy"
mode = "read-compatible" if phase in ("diff", "prepare") else "encrypted"
migration = phase != "finish"
args = ["npx", "cdk", command, "RilloraStaging", "--exclusively", "--profile", "rillora-operator"]
for key, value in {
    "serviceDesiredCount": "1", "stripeTestIntegrationEnabled": "true",
    "familyMaintenancePreviewEnabled": "true", "appleStoreKitSandboxEnabled": "false",
    "accountDeletionEnabled": "true", "emailVerificationEnabled": "true",
    "contentProtectionMode": mode, "contentMigrationEnabled": str(migration).lower(),
}.items():
    args += ["-c", key + "=" + value]
if command == "diff":
    args += ["--no-change-set"]
else:
    args += ["--previous-parameters", "true", "--require-approval", "never"]
    for parameter in stack["Parameters"]:
        if parameter["ParameterValue"] != "****" and parameter["ParameterKey"] != "BootstrapVersion":
            args += ["--parameters", parameter["ParameterKey"] + "=" + parameter["ParameterValue"]]
with (evidence / ("aws-" + phase + ".log")).open("w") as log:
    result = subprocess.run(args, cwd=root / "infra/aws", stdout=log, stderr=subprocess.STDOUT)
print("Staging", phase, "exit", result.returncode)
sys.exit(result.returncode)
