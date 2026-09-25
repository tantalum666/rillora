#!/usr/bin/env python3
"""Read-only release inventory. Local evidence is never promoted to deployment proof."""
import argparse
import datetime
import json
import plistlib
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[2]
REQUIRED_NATIVE = (
    'RilloraAPIBaseURL', 'RilloraAuth0Domain', 'RilloraAuth0ClientID',
    'RilloraAuth0Audience', 'RilloraNativeSessionURL',
)
CONNECTIONS = json.loads((ROOT / 'config/production-connections.json').read_text())
STATES = {'open', 'in_progress', 'owner_deferred', 'verified'}
GATE_IDS = {'production-runtime', 'production-identity', 'production-billing',
            'merchant-market', 'apple-transactions', 'operations', 'backup-retention',
            'release-security', 'apple-submission', 'physical-device', 'public-surface'}


def native_findings(info):
    issues = []
    for key in REQUIRED_NATIVE:
        value = info.get(key)
        if not isinstance(value, str) or not value.strip() or '$(' in value:
            issues.append(key + ': missing release value')
    if info.get('CFBundleIdentifier') != 'com.rillora.ios':
        issues.append('Wrong native product bundle')
    if str(info.get('RilloraDevPlannerID', '')).strip():
        issues.append('Development identity is present')
    for key in ('RilloraAPIBaseURL', 'RilloraNativeSessionURL'):
        value = info.get(key, '')
        if not isinstance(value, str):
            continue
        u = urlparse(value)
        if u.scheme != 'https' or u.hostname != 'app.rillora.xyz' or u.username or u.password or u.query or u.fragment:
            issues.append(key + ': not the reviewed production origin')
    if info.get('RilloraAuth0Domain') != 'login.rillora.xyz':
        issues.append('Identity issuer does not match the reviewed login domain')
    for key, expected in [('RilloraAPIBaseURL', CONNECTIONS['apiBaseURL']),
                          ('RilloraNativeSessionURL', CONNECTIONS['nativeSessionURL']),
                          ('RilloraAuth0ClientID', CONNECTIONS['nativeClientID']),
                          ('RilloraAuth0Audience', CONNECTIONS['audience'])]:
        if info.get(key) != expected:
            issues.append(key + ': not the reviewed production connection')
    if info.get('RilloraCustomerAccessEnabled') not in (True, 'YES', 'true', '1'):
        issues.append('Customer account access is closed in this artifact')
    icons = info.get('CFBundleIcons', {}).get('CFBundlePrimaryIcon', {})
    if not icons.get('CFBundleIconName') and not icons.get('CFBundleIconFiles'):
        issues.append('No compiled primary App icon')
    return issues


def gate_findings(data, root=ROOT):
    issues = []
    if data.get('schemaVersion') != 1 or not isinstance(data.get('gates'), list) or not data['gates']:
        return ['Release gate register missing or invalid']
    ids = set()
    for gate in data['gates']:
        ident = gate.get('id', '')
        if not ident or ident in ids or gate.get('status') not in STATES:
            issues.append('Malformed or duplicate release gate')
        ids.add(ident)
        if gate.get('required') is not True:
            issues.append(ident + ': required classification missing')
        if gate.get('status') != 'verified':
            issues.append(ident + ': ' + gate.get('status', 'unknown'))
        else:
            evidence = gate.get('evidence', [])
            if not evidence:
                issues.append(ident + ': verified without evidence references')
            for ref in evidence:
                path = (root / ref).resolve()
                if root.resolve() not in path.parents or not path.is_file():
                    issues.append(ident + ': missing or out-of-repository evidence')
    if ids != GATE_IDS:
        issues.append('Release register does not contain the complete required gate set')
    return issues


def source_inventory(root=ROOT):
    project = (root / 'apps/ios/project.yml').read_text()
    release = re.search(r'^        Release:\n(.*?)(?=^  [A-Za-z]|\Z)', project, re.M | re.S)
    block = release.group(1) if release else ''
    fields = {}
    for key in ('RILLORA_API_BASE_URL', 'RILLORA_AUTH0_DOMAIN', 'RILLORA_AUTH0_CLIENT_ID',
                'RILLORA_AUTH0_AUDIENCE', 'RILLORA_NATIVE_SESSION_URL'):
        match = re.search(r'^          ' + key + r':\s*"([^"]*)"', block, re.M)
        fields[key] = bool(match and match.group(1).strip())
    adapter = (root / 'apps/api/src/stripe-test-adapter.ts').read_text()
    return {
        'nativeReleaseFieldsConfigured': fields,
        'mainAppIconConfigured': not bool(re.search(r'ASSETCATALOG_COMPILER_APPICON_NAME:\s*""', project.split('  RilloraComponentPreview:')[0])),
        'stripeTestAdapterRejectsLiveObjects': 'rk_test_' in adapter and 'if (event.livemode)' in adapter,
        'stripeProductionAdapterSourcePresent': (root / 'apps/api/src/stripe-production-adapter.ts').is_file(),
        'productionPurchaseConsentSourcePresent': (root / 'config/purchase-consent.json').is_file(),
        'productionInfrastructureSourcePresent': (root / 'infra/aws/lib/rillora-production-stack.ts').is_file(),
        'note': 'Source inventory only. A present value/file does not prove deployment or release acceptance.',
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ios-app', type=Path, help='Final native .app artifact, not a source plist')
    parser.add_argument('--output', type=Path)
    parser.add_argument('--report-only', action='store_true', help='Save blockers without a failing shell exit')
    args = parser.parse_args()
    register = json.loads((ROOT / 'config/release-gates.json').read_text())
    blockers = gate_findings(register)
    native = ['Final native app artifact not supplied']
    if args.ios_app:
        path = args.ios_app / 'Info.plist'
        try:
            with path.open('rb') as source:
                native = native_findings(plistlib.load(source))
            if list(args.ios_app.rglob('*.storekit')):
                native.append('Xcode StoreKit fixture included in release artifact')
        except (OSError, ValueError, plistlib.InvalidFileException):
            native = ['Final native Info.plist is unreadable']
    result = {
        'checkedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'preflightPassed': not blockers and not native,
        'publicationApproval': False,
        'gateBlockers': blockers, 'nativeArtifactBlockers': native,
        'sourceInventory': source_inventory(),
        'evidenceLimit': 'Local preflight is not provider approval, deployment, App Review or legal clearance.',
    }
    output = json.dumps(result, ensure_ascii=False, indent=2) + '\n'
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(output)
    print(output, end='')
    return 0 if args.report_only or result['preflightPassed'] else 2


if __name__ == '__main__':
    sys.exit(main())
