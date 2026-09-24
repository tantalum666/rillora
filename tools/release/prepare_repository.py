#!/usr/bin/env python3
"""Prepare a local, reviewable source snapshot; never commits or uploads it."""
from pathlib import Path
import datetime
import hashlib
import json
import os
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[2]
DEST = ROOT / ".local/github-preflight/source"
REPORT = ROOT / "output/qa/rillora-production-recovery-20260923/repository-candidate.json"
SKIP = {".git", "node_modules", ".build", ".swiftpm", "SourcePackages", "checkouts",
        "vendor", "dist", "dist-public", "build", "output", ".local-secrets", ".local", ".secrets",
        ".playwright-cli", ".playwright-mcp", ".xcodebuildmcp-deriveddata", "__pycache__"}

paths, nested, symlinks = [], [], []
for base, dirs, files in os.walk(ROOT):
    parent = Path(base)
    if ".git" in dirs and parent != ROOT:
        nested.append(str(parent.relative_to(ROOT)))
    dirs[:] = [name for name in dirs if name not in SKIP
               and not name.startswith(("cdk.out", ".derived-data", "DerivedData"))
               and not name.endswith((".xcresult", ".xcarchive", ".dSYM"))]
    for name in files:
        path = parent / name
        if path.is_symlink():
            symlinks.append(str(path.relative_to(ROOT)))
        else:
            paths.append(str(path.relative_to(ROOT)))
payload = b"\0".join(path.encode() for path in paths) + b"\0"
ignored = subprocess.run(["git", "check-ignore", "--no-index", "-z", "--stdin"],
                         cwd=ROOT, input=payload, capture_output=True)
if ignored.returncode not in (0, 1):
    raise SystemExit("Git ignore evaluation failed; no snapshot created")
omitted = set(ignored.stdout.decode().strip("\0").split("\0"))
selected = sorted(set(paths) - omitted)
DEST.mkdir(parents=True, exist_ok=True)
# Only remove stale files inside this tool-owned generated source snapshot.
for prior in DEST.rglob("*"):
    if prior.is_file() and str(prior.relative_to(DEST)) not in selected:
        prior.unlink()
manifest = []
for name in selected:
    source, target = ROOT / name, DEST / name
    if source.stat().st_size >= 95 * 1024 * 1024:
        raise SystemExit("Oversize source asset needs explicit repository/LFS review: " + name)
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)
    data = source.read_bytes()
    manifest.append({"path": name, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()})
result = {"preparedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
          "destination": str(DEST), "files": manifest, "fileCount": len(manifest),
          "totalBytes": sum(item["bytes"] for item in manifest), "nestedRepositoriesPreserved": nested,
          "excludedSymlinks": symlinks, "committed": False, "uploaded": False,
          "boundary": "Snapshot requires secret/privacy review before any Git or remote operation."}
REPORT.parent.mkdir(parents=True, exist_ok=True)
REPORT.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n")
print(json.dumps({key: result[key] for key in ("fileCount", "totalBytes", "nestedRepositoriesPreserved", "committed", "uploaded")}))
