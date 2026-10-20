#!/usr/bin/env python3
"""Explicit migration; plan is metadata-only, apply verifies hardware protection before replacing plaintext."""
import argparse
import hashlib
import json
import os
import re
from pathlib import Path
from credential_store import CredentialStore, ROOT


def migrate(source, apply=False, store=None):
    store = store or CredentialStore(ROOT)
    source = store._path(source)
    relative = source.relative_to(store.root / ".local-secrets").as_posix()
    supported = {'production-identity-services/deletion.json','production-identity-services/verification.json',
        'production-identity/web-client.json','email-verification/auth0-management.json',
        'account-deletion/auth0-management.json','production-review/reviewer.json','storekit/iap-private-key.p8'}
    if relative not in supported and not re.fullmatch(r'apple/AuthKey_[A-Z0-9]{10}\.p8', relative):
        raise RuntimeError("This file has no migrated credential reader; keep its current representation")
    if not source.is_file():
        raise RuntimeError("An existing protected source file is required")
    pending = source.with_name(source.name + ".enclave-pending.json")
    if not apply:
        return {"source": str(source.relative_to(store.root)), "bytes": source.stat().st_size,
                "pendingReference": pending.exists(), "applied": False, "secretRead": False}
    store.ensure_ready()
    original, before = store.read_protected_file(source)
    try:
        ref = json.loads(original)
    except (ValueError, UnicodeError):
        ref = None
    if isinstance(ref, dict) and ref.get("storage") == "macos-secure-enclave-user-presence":
        store.read(source)
        return {"source": str(source.relative_to(store.root)), "applied": False, "alreadyProtected": True,
                "protectedReadbackMatched": True, "providerChanged": False}
    if not original or len(original) > 65536:
        raise RuntimeError("Unsupported credential size")
    if not pending.exists():
        store.put(pending, original)
    restored = store.read(pending)  # OS requires current user presence.
    if not hashlib.sha256(original).digest() == hashlib.sha256(restored).digest():
        raise RuntimeError("Protected readback did not match; original remains")
    current = source.lstat()
    if (before.st_ino, before.st_mtime_ns, before.st_size) != (current.st_ino, current.st_mtime_ns, current.st_size):
        raise RuntimeError("Source changed; original remains")
    os.replace(pending, source)
    return {"source": str(source.relative_to(store.root)), "applied": True, "protectedReadbackMatched": True,
            "plaintextPathReplaced": True, "backupErasureClaimed": False, "providerChanged": False}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    try:
        print(json.dumps(migrate(args.source, args.apply)))
    except Exception:
        raise SystemExit("Credential migration did not complete; no secret was printed and no unverified source was removed.") from None
