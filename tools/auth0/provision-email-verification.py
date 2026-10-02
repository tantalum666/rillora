#!/usr/bin/env python3
"""Prepare a read-only, purpose-limited Auth0 client. Never print its secret."""
import json
import os
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[2]
DOMAIN = 'rillora-dev.eu.auth0.com'
NAME = 'Rillora current-session email verification'
TARGET = ROOT / '.local-secrets/email-verification/auth0-management.json'


def api(method, path, body=None):
    args = ['auth0', 'api', method, path, '--tenant', DOMAIN, '--no-input']
    result = subprocess.run(args, input=None if body is None else json.dumps(body), text=True, capture_output=True)
    if result.returncode:
        raise RuntimeError('Auth0 operation failed; provider response suppressed. Check CLI authentication/permissions.')
    return json.loads(result.stdout) if result.stdout.strip() else None


def main():
    clients = api('get', 'clients?fields=client_id,name,app_type&include_fields=true&per_page=100')
    if not isinstance(clients, list) or len(clients) >= 100:
        raise RuntimeError('Incomplete client inventory; stop before creating service identities')
    matches = [item for item in clients if item['name'] == NAME]
    if len(matches) > 1:
        raise RuntimeError('Multiple matching clients; do not create another.')
    if matches:
        if not TARGET.exists() or TARGET.stat().st_mode & 0o077:
            raise RuntimeError('Existing client needs its protected credential; do not create or reveal a replacement.')
        client = json.loads(TARGET.read_text())
        if client['client_id'] != matches[0]['client_id']:
            raise RuntimeError('Protected credential does not match the existing client.')
    else:
        if TARGET.exists():
            raise RuntimeError('Protected credential exists without a matching remote client; do not create another')
        TARGET.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
        os.chmod(TARGET.parent, 0o700)
        client = api('post', 'clients', {'name': NAME, 'app_type': 'non_interactive',
            'grant_types': ['client_credentials'], 'token_endpoint_auth_method': 'client_secret_post',
            'description': 'Read current email verification for the exact authenticated Rillora session identity. No user updates or deletion.'})
        fd = os.open(TARGET, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, 'w') as out:
            json.dump({'client_id': client['client_id'], 'client_secret': client['client_secret'], 'domain': DOMAIN}, out)
    grants = api('get', 'client-grants?client_id=' + client['client_id'])
    if not grants:
        api('post', 'client-grants', {'client_id': client['client_id'], 'audience': f'https://{DOMAIN}/api/v2/', 'scope': ['read:users']})
        grants = api('get', 'client-grants?client_id=' + client['client_id'])
    if len(grants) != 1 or grants[0]['audience'] != f'https://{DOMAIN}/api/v2/' or grants[0]['scope'] != ['read:users']:
        raise RuntimeError('Unexpected service scope. Do not broaden or repurpose it.')
    print(json.dumps({'clientId': client['client_id'], 'domain': DOMAIN, 'scope': ['read:users'], 'credentialSaved': True, 'secretPrinted': False}))


if __name__ == '__main__':
    main()
