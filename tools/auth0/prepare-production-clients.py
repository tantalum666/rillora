#!/usr/bin/env python3
"""Prepare inactive production clients in the existing tenant; never print secrets."""
import argparse
import json
import os
from pathlib import Path
import subprocess
from urllib.parse import urlencode

ROOT = Path(__file__).resolve().parents[2]
import sys
sys.path.insert(0,str(ROOT/'tools/security'))
from credential_store import CredentialStore, read_secret_json, write_secret_json
DOMAIN = 'rillora-dev.eu.auth0.com'
SECRET = ROOT / '.local-secrets/production-identity/web-client.json'
NATIVE_CALLBACK = 'https://login.rillora.xyz/ios/com.rillora.ios/callback'
CLIENTS = {
    'web': {'name': 'Rillora Production Web', 'app_type': 'regular_web',
            'callbacks': ['https://app.rillora.xyz/api/auth/callback'],
            'allowed_logout_urls': ['https://app.rillora.xyz'],
            'web_origins': ['https://app.rillora.xyz'],
            'token_endpoint_auth_method': 'client_secret_post'},
    'ios': {'name': 'Rillora Production iOS', 'app_type': 'native',
            'callbacks': [NATIVE_CALLBACK], 'allowed_logout_urls': [NATIVE_CALLBACK],
            'mobile': {'ios': {'team_id': '8L99CFNK24', 'app_bundle_identifier': 'com.rillora.ios'}},
            'token_endpoint_auth_method': 'none'},
}
COMMON = {'grant_types': ['authorization_code'], 'oidc_conformant': True,
          'is_first_party': True,
          'jwt_configuration': {'alg': 'RS256', 'lifetime_in_seconds': 900},
          'client_metadata': {'environment': 'production', 'release_state': 'prepared'}}
API = {'name': 'Rillora Production API', 'identifier': 'urn:rillora:production:api',
       'signing_alg': 'RS256', 'token_lifetime': 900, 'allow_offline_access': False,
       'scopes': [{'value': 'session:create', 'description': 'Create a secure Rillora app session'}]}


def api(method, path, body=None):
    result = subprocess.run(['auth0', 'api', method, path, '--tenant', DOMAIN, '--no-input'],
                            input=json.dumps(body) if body is not None else None,
                            capture_output=True, text=True, timeout=45)
    if result.returncode:
        raise RuntimeError(f'Auth0 {method} failed; inspect session or permissions. Provider body suppressed.')
    return json.loads(result.stdout) if result.stdout.strip() else None


def exact(values, name, key='name'):
    matches = [v for v in values if v.get(key) == name]
    if len(matches) > 1:
        raise RuntimeError('Ambiguous resource; do not create or modify another.')
    return matches[0] if matches else None


def match(actual, expected):
    for key, value in expected.items():
        if isinstance(value, dict) and isinstance(actual.get(key), dict):
            match(actual[key], value)
        elif actual.get(key) != value:
            raise RuntimeError(f'Existing prepared resource differs at {key}; manual review required.')


def connection_clients(connection_id):
    result = []
    cursor = None
    for _ in range(20):
        query = {'take': 100}
        if cursor:
            query['from'] = cursor
        data = api('get', f'connections/{connection_id}/clients?{urlencode(query)}')
        clients = data.get('clients', [])
        result.extend(item['client_id'] for item in clients)
        cursor = data.get('next')
        if not cursor:
            return sorted(result)
    raise RuntimeError('Incomplete connection listing; stop before mutation.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    clients = api('get', 'clients?fields=client_id,name,app_type&include_fields=true&per_page=100')
    if len(clients) >= 100:
        raise RuntimeError('Client inventory must be complete.')
    servers = api('get', 'resource-servers?per_page=100')
    if len(servers) >= 100:
        raise RuntimeError('API inventory must be complete.')
    connections = api('get', 'connections?fields=id,name,strategy&include_fields=true&per_page=100')
    if len(connections) >= 100:
        raise RuntimeError('Connection inventory must be complete.')
    before = {c['id']: connection_clients(c['id']) for c in connections}
    report = {'tenant': DOMAIN, 'applied': False,
              'clients': {kind: {**spec, **COMMON} for kind, spec in CLIENTS.items()},
              'api': API, 'connectionsWillRemainDisabled': True,
              'activationRequires': ['staging identity retirement', 'reviewed cleanup',
                                     'production email and provider acceptance', 'hosted consent',
                                     'production Web/iOS deployment'],
              'newPaidPlan': False}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + '\n')
    if not args.apply:
        print(json.dumps({'preview': str(args.output), 'applied': False}))
        return
    existing_production = [existing['client_id'] for spec in CLIENTS.values()
                           if (existing := exact(clients, spec['name']))]
    if any(identifier in bindings for identifier in existing_production for bindings in before.values()):
        raise RuntimeError('Existing production client has active connection bindings; preparation cannot disable an activated client')
    production = []
    for kind, spec in CLIENTS.items():
        desired = {**spec, **COMMON}
        existing = exact(clients, spec['name'])
        if existing:
            identifier = existing['client_id']
        else:
            if kind == 'web' and SECRET.exists():
                raise RuntimeError('An unmatched protected credential exists; review before creating a client.')
            if kind == 'web':
                CredentialStore(ROOT).ensure_ready()
            created = api('post', 'clients', desired)
            identifier = created['client_id']
            if kind == 'web':
                SECRET.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
                os.chmod(SECRET.parent, 0o700)
                write_secret_json(SECRET,{'domain':DOMAIN,'client_id':identifier,'client_secret':created['client_secret']},root=ROOT)
        fields = ','.join([*desired, 'client_id'])
        current = api('get', f'clients/{identifier}?fields={fields}&include_fields=true')
        match(current, desired)
        if kind == 'web':
            if not SECRET.exists() or SECRET.stat().st_mode & 0o077:
                raise RuntimeError('Web credential needs protected recovery; never auto-rotate or duplicate.')
            stored = read_secret_json(SECRET,root=ROOT)
            if stored['client_id'] != identifier or stored['domain'] != DOMAIN:
                raise RuntimeError('Protected credential does not match.')
        # Some Auth0 tenant defaults automatically bind new clients. Remove only
        # these prepared IDs, preserving every pre-existing connection/client pair.
        for connection in connections:
            if identifier in connection_clients(connection['id']):
                if existing:
                    raise RuntimeError('Existing production client acquired active connection bindings; preparation stopped')
                api('patch', f"connections/{connection['id']}/clients",
                    [{'client_id': identifier, 'status': False}])
        report['clients'][kind] = current
        production.append(identifier)
    existing_api = exact(servers, API['identifier'], 'identifier')
    api_id = existing_api['id'] if existing_api else api('post', 'resource-servers', API)['id']
    current_api = api('get', f'resource-servers/{api_id}')
    match(current_api, API)
    report['api'] = {**API, 'id': api_id}
    after = {c['id']: connection_clients(c['id']) for c in connections}
    if any(set(ids) & set(production) for ids in after.values()):
        raise RuntimeError('Prepared clients must not have an active login connection.')
    if {key: [v for v in values if v not in production] for key, values in before.items()} != after:
        raise RuntimeError('Unrelated connection bindings changed; inspect before continuing.')
    report.update(applied=True, preparedClientIds=production,
                  existingConnectionBindingsUnchanged=True,
                  productionConnectionsDisabled=True, secretPrinted=False)
    args.output.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({'applied': True, 'preparedClientIds': production,
                      'productionConnectionsDisabled': True, 'readback': str(args.output)}))


if __name__ == '__main__':
    main()
