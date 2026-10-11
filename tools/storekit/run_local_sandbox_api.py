#!/usr/bin/env python3
"""Start the existing local sandbox API after user-presence credential access."""
from pathlib import Path
import os
import sys
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools/security"))
from credential_store import CredentialStore

store = CredentialStore(ROOT)
private = ROOT / ".local-secrets/storekit"
# Public identifiers may remain owner-only text; the private key must be an OS reference.
key = store.read(private / "iap-private-key.p8").decode()
key_id = (private / "key-id").read_text().strip()
issuer_id = (private / "issuer-id").read_text().strip()
environment = {**os.environ, "NODE_ENV": "development", "HOST": "127.0.0.1",
    "PORT": os.environ.get("RILLORA_STOREKIT_LOCAL_PORT", "4182"),
    "DATABASE_URL": os.environ.get("RILLORA_STOREKIT_DATABASE_URL", "postgresql:///continuity_dev"),
    "DATABASE_SSL_MODE": "disable", "CORS_ORIGINS": "http://localhost:4173,http://localhost:4174",
    "ALLOW_DEV_AUTH": "true", "ALLOW_SYNTHETIC_RECIPIENT_REHEARSAL": "false",
    "ALLOW_STRIPE_TEST_INTEGRATION": "false", "STRIPE_TEST_STAGING_MODE": "false",
    "ALLOW_APPLE_SANDBOX_INTEGRATION": "true", "APPLE_SANDBOX_STAGING_MODE": "false",
    "APPLE_ROOT_CERTIFICATE_DIRECTORY": str(ROOT / "apps/api/certificates/apple"),
    "APPLE_IAP_KEY_ID": key_id, "APPLE_IAP_ISSUER_ID": issuer_id, "APPLE_IAP_PRIVATE_KEY": key,
    "DATA_REGION": "eu-central-1"}
os.chdir(ROOT / "apps/api")
os.execvpe("npm", ["npm", "run", "dev"], environment)
