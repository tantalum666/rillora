#!/usr/bin/env python3
"""Plan/apply verified HTTPS callbacks for the two existing Rillora iOS clients.

Default is read-only. Coordinate --apply with the native/AASA rollout; old
private-scheme clients cannot authenticate after the callback is retired.
"""
import argparse
import copy
import json
import subprocess

DOMAIN = 'rillora-dev.eu.auth0.com'
CLIENTS = {'staging': 'HDfmJrHaM08lDAgsygPm7b5OB1aaUhrZ',
           'production': 'POpNKTqlr6dHbJZLWPWxhyjg5qPtdrm4'}
CALLBACK = 'https://login.rillora.xyz/ios/com.rillora.ios/callback'
LEGACY = {f'com.rillora.ios://{host}/ios/com.rillora.ios/callback'
          for host in ['login.rillora.xyz', DOMAIN]}
FIELDS = 'client_id,name,app_type,callbacks,allowed_logout_urls,mobile'


def desired(current, client_id, retain_legacy=False):
    if current.get('client_id') != client_id or client_id not in CLIENTS.values() or current.get('app_type') != 'native':
        raise ValueError('Unexpected native client identity')
    for field in ['callbacks', 'allowed_logout_urls']:
        value = current.get(field)
        if not isinstance(value, list) or not value or any(url not in LEGACY | {CALLBACK} for url in value):
            raise ValueError('Unknown callback configuration; review before changing it')
    mobile = copy.deepcopy(current.get('mobile') or {})
    mobile['ios'] = {**mobile.get('ios', {}), 'team_id': '8L99CFNK24', 'app_bundle_identifier': 'com.rillora.ios'}
    values = {field: sorted(set(current[field]) | {CALLBACK}) if retain_legacy else [CALLBACK]
              for field in ['callbacks', 'allowed_logout_urls']}
    return {**values, 'mobile': mobile}


def api(method, path, body=None):
    value = subprocess.run(['auth0','api',method,path,'--tenant',DOMAIN,'--no-input'],
        input=json.dumps(body) if body is not None else None,capture_output=True,text=True,timeout=45)
    if value.returncode:
        raise RuntimeError('Auth0 request failed; provider response suppressed')
    return json.loads(value.stdout) if value.stdout.strip() else None


def configure(environment, apply=False, provider=api, retain_legacy=False):
    client_id = CLIENTS[environment]
    path = f'clients/{client_id}'
    current = provider('get', f'{path}?fields={FIELDS}&include_fields=true')
    patch = desired(current, client_id, retain_legacy)
    changed = any(current.get(key) != value for key,value in patch.items())
    if apply and changed:
        provider('patch', path, patch)
        after = provider('get', f'{path}?fields={FIELDS}&include_fields=true')
        if desired(after, client_id, retain_legacy) != patch or any(after.get(k) != v for k,v in patch.items()):
            raise RuntimeError('HTTPS callback readback mismatch')
    return {'environment': environment, 'clientId': client_id, 'changed': changed,
            'applied': apply and changed, 'desired': patch, 'legacyCallbacksRetained': retain_legacy,
            'providerAssociationVerified': False,
            'nativeLoginVerified': False}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('environment', choices=CLIENTS)
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--retain-legacy', action='store_true',
                        help='Add HTTPS and retain only the existing reviewed legacy callbacks until the new native client is verified')
    args = parser.parse_args()
    print(json.dumps(configure(args.environment,args.apply,retain_legacy=args.retain_legacy),ensure_ascii=False,indent=2))


if __name__ == '__main__': main()
