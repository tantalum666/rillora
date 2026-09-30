#!/usr/bin/env python3
"""Rillora-only entry to the official gddy CLI. Writes default to preview."""
import argparse
import datetime
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import uuid

ROOT = Path(__file__).resolve().parents[2]
DOMAIN = 'rillora.xyz'
BINARY = Path.home() / '.local/bin/gddy'
TYPES = ('A', 'AAAA', 'CNAME', 'TXT', 'MX', 'CAA')


def parser():
    result = argparse.ArgumentParser(description=__doc__)
    result.add_argument('operation', choices=['list', 'add', 'set'])
    result.add_argument('--type', choices=TYPES)
    result.add_argument('--name')
    result.add_argument('--data', action='append')
    result.add_argument('--ttl', type=int, default=600)
    result.add_argument('--priority', type=int)
    result.add_argument('--flag', type=int)
    result.add_argument('--tag')
    result.add_argument('--apply', action='store_true', help='Apply the explicit record change after preview and backup')
    return result


def validate(args):
    if args.name and not (args.name == '@' or re.fullmatch(r'[a-zA-Z0-9_*][a-zA-Z0-9_.-]{0,249}', args.name)):
        raise ValueError('Use a relative DNS name; shell options and URL syntax are not accepted')
    if args.name and (args.name.endswith('.' + DOMAIN) or args.name == DOMAIN):
        raise ValueError('Names must be relative to rillora.xyz; use @ for its root')
    if args.name and not args.type:
        raise ValueError('--name requires --type')
    if args.operation != 'list' and (not args.type or not args.name or not args.data):
        raise ValueError('A mutation requires --type, --name and at least one --data')
    if args.operation == 'list' and (args.apply or args.data):
        raise ValueError('List is read-only')
    if not 600 <= args.ttl <= 604800:
        raise ValueError('TTL must be between600 and604800seconds')
    if args.type == 'CAA' and args.operation != 'list' and (args.flag is None or args.tag not in ['issue', 'issuewild', 'iodef']):
        raise ValueError('CAA requires --flag and a supported --tag')
    if args.type == 'MX' and args.priority is None and args.operation != 'list':
        raise ValueError('MX requires --priority')


def invoke(arguments):
    command = [str(BINARY), 'dns', *arguments, '--env=prod', '--credential-store=keyring', '--output=json', '--timeout=30s']
    result = subprocess.run(command, text=True, capture_output=True, timeout=40, check=False)
    if result.returncode:
        # Never forward an authentication URL, token, or arbitrary provider error.
        raise RuntimeError('GoDaddy CLI failed. Check gddy auth status and the exact command permissions; no credential was logged.')
    value = json.loads(result.stdout)
    return value.get('data', value) if isinstance(value, dict) else value


def read_records():
    value = invoke(['list', DOMAIN, '--fields=all'])
    if not isinstance(value, list) or any(not isinstance(row, dict) for row in value):
        raise RuntimeError('Unexpected DNS response shape; no mutation is allowed')
    return value


def identity(row):
    return str(row.get('type', '')).upper(), str(row.get('name', '')).lower()


def digest(records):
    rows = sorted(json.dumps(row, sort_keys=True, separators=(',', ':')) for row in records)
    return hashlib.sha256('\n'.join(rows).encode()).hexdigest()


def mutation_command(args, preview):
    # The domain and environment cannot be supplied/overridden by a caller.
    values = [args.operation, DOMAIN, '--type=' + args.type, '--name=' + args.name,
              '--ttl=' + str(args.ttl)]
    values += ['--data=' + value for value in args.data]
    for name in ['priority', 'flag', 'tag']:
        value = getattr(args, name)
        if value is not None:
            values.append('--' + name + '=' + str(value))
    if preview:
        values.append('--dry-run')
    return values


def check_unchanged(before, after, target):
    old = [row for row in before if identity(row) != target]
    new = [row for row in after if identity(row) != target]
    if digest(old) != digest(new):
        raise RuntimeError('Unrelated DNS records changed; inspect the saved snapshot before proceeding')


def replace_single_cname(args, before):
    """v3 cannot create a conflicting CNAME before deleting its old value."""
    target = ('CNAME', args.name.lower())
    existing = [row for row in before if identity(row) == target]
    if len(existing) != 1 or len(args.data) != 1:
        raise RuntimeError('CNAME replacement requires exactly one old and one new value')
    old = existing[0]
    desired = args.data[0].rstrip('.')
    try:
        invoke(['delete', DOMAIN, '--type=CNAME', '--name=' + args.name])
        middle = read_records()
        check_unchanged(before, middle, target)
        if any(identity(row) == target for row in middle):
            raise RuntimeError('CNAME changed concurrently; do not overwrite another writer')
        invoke(['add', DOMAIN, '--type=CNAME', '--name=' + args.name,
                '--data=' + args.data[0], '--ttl=' + str(args.ttl)])
        return {'strategy': 'single-cname-replacement', 'replaced': 1}
    except (RuntimeError, subprocess.TimeoutExpired) as cause:
        current = read_records()
        check_unchanged(before, current, target)
        values = [row for row in current if identity(row) == target]
        if len(values) == 1 and str(values[0].get('data', '')).rstrip('.') == desired and values[0].get('ttl') == args.ttl:
            return {'strategy': 'single-cname-replacement', 'replaced': 1, 'ambiguousResponseResolvedByReadback': True}
        if not values:
            try:
                invoke(['add', DOMAIN, '--type=CNAME', '--name=' + args.name,
                        '--data=' + old['data'], '--ttl=' + str(old['ttl'])])
            except (RuntimeError, subprocess.TimeoutExpired):
                # A timeout can follow a successful provider write. Read actual DNS.
                pass
            restored = read_records()
            check_unchanged(before, restored, target)
            values = [row for row in restored if identity(row) == target]
        if len(values) == 1 and str(values[0].get('data', '')).rstrip('.') == old['data'].rstrip('.') and values[0].get('ttl') == old['ttl']:
            raise RuntimeError('CNAME replacement failed; the prior value and TTL are present/restored. Inspect the snapshot before retrying.') from cause
        raise RuntimeError('CNAME replacement interrupted; do not overwrite the current target. Inspect the saved snapshot and actual DNS immediately.') from cause


def main(argv=None):
    args = parser().parse_args(argv)
    validate(args)
    before = read_records()
    if args.operation == 'list':
        selected = [row for row in before if (not args.type or identity(row)[0] == args.type)
                    and (not args.name or identity(row)[1] == args.name.lower())]
        print(json.dumps({'domain': DOMAIN, 'records': selected}, indent=2))
        return
    old_target = [row for row in before if identity(row) == (args.type, (args.name or '').lower())]
    cname_replace = args.operation == 'set' and args.type == 'CNAME' and bool(old_target)
    if cname_replace:
        if len(old_target) != 1 or len(args.data) != 1:
            raise RuntimeError('CNAME replacement requires exactly one old and one new value')
        if old_target[0]['data'].rstrip('.') == args.data[0].rstrip('.') and old_target[0]['ttl'] == args.ttl:
            print(json.dumps({'domain': DOMAIN, 'applied': False, 'unchanged': True}))
            return
    preview = invoke(mutation_command(args, True))
    if cname_replace:
        preview = {'providerPreview': preview, 'strategy': 'delete one existing CNAME, add replacement, restore prior value on failure'}
    if not args.apply:
        print(json.dumps({'domain': DOMAIN, 'applied': False, 'preview': preview}, indent=2))
        return
    # Preserve exact prior record IDs/fields for a failed non-atomic provider write.
    directory = ROOT / '.local/dns-backups'
    directory.mkdir(parents=True, exist_ok=True, mode=0o700)
    os.chmod(directory, 0o700)
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    target = directory / (stamp + '-' + uuid.uuid4().hex[:8] + '.json')
    with os.fdopen(os.open(target, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600), 'w') as handle:
        json.dump({'domain': DOMAIN, 'before': before, 'preview': preview}, handle, indent=2)
    if digest(read_records()) != digest(before):
        raise RuntimeError('DNS changed during preview; no write performed. Re-read before trying again.')
    failure = None
    try:
        result = replace_single_cname(args, before) if cname_replace else invoke(mutation_command(args, False))
    except RuntimeError as error:
        result = {'error': str(error)}
        failure = error
    after = read_records()
    with target.open('w') as handle:
        json.dump({'domain': DOMAIN, 'before': before, 'after': after, 'result': result}, handle, indent=2)
    if failure:
        raise failure
    check_unchanged(before, after, (args.type, args.name.lower()))
    if isinstance(result, dict) and result.get('failed', 0):
        raise RuntimeError('Provider reported a partial change; consult the saved snapshot')
    selected = [row for row in after if identity(row) == (args.type, args.name.lower())]
    expected = set(args.data)
    actual = {str(row.get('data', '')) for row in selected}
    # Hosts may be normalized with a trailing dot by the provider.
    normalize = lambda values: {value.rstrip('.') if args.type in ['CNAME', 'MX'] else value for value in values}
    values_match = normalize(expected) == normalize(actual) if args.operation == 'set' else normalize(expected).issubset(normalize(actual))
    if not values_match or any(row.get('ttl') != args.ttl for row in selected if normalize({str(row.get('data', ''))}) & normalize(expected)):
        raise RuntimeError('Provider readback does not contain the requested value; consult the saved snapshot')
    print(json.dumps({'domain': DOMAIN, 'applied': True, 'result': result,
                      'unrelatedRecordsUnchanged': True, 'snapshot': str(target)}, indent=2))


if __name__ == '__main__':
    try:
        main()
    except (ValueError, RuntimeError, subprocess.TimeoutExpired) as error:
        raise SystemExit(str(error))
