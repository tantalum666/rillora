"""Provisioning regression fixtures. Every provider operation is intercepted."""
import contextlib
import importlib.util
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

HERE = Path(__file__).parent


def load(name):
    spec = importlib.util.spec_from_file_location(name.replace('-', '_'), HERE / (name + '.py'))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main(module, *arguments):
    with patch.object(sys, 'argv', ['fixture', *arguments]), contextlib.redirect_stdout(io.StringIO()):
        module.main()


class PreparationGuards(unittest.TestCase):
    def test_full_client_page_stops_service_creation_before_any_mutation(self):
        for name in ['prepare-production-identity-services', 'provision-email-verification']:
            with self.subTest(name=name), tempfile.TemporaryDirectory() as temporary:
                module = load(name)
                root = Path(temporary)
                calls = []

                def api(method, resource, body=None):
                    calls.append((method, resource))
                    if method == 'get' and resource.startswith('clients?'):
                        return [{'client_id': str(index), 'name': 'Unrelated ' + str(index)} for index in range(100)]
                    raise RuntimeError('UNEXPECTED_PROVIDER_MUTATION')

                attributes = {'DIRECTORY': root / 'services'} if hasattr(module, 'DIRECTORY') else {'TARGET': root / 'credential.json'}
                with patch.multiple(module, **attributes), patch.object(module, 'api', api):
                    with self.assertRaisesRegex(RuntimeError, 'Incomplete client inventory'):
                        main(module, '--output', str(root / 'receipt.json'))
                self.assertTrue(all(method == 'get' for method, _ in calls))

    def test_unmatched_protected_credential_cannot_create_an_orphan_client(self):
        module = load('provision-email-verification')
        with tempfile.TemporaryDirectory() as temporary:
            target = Path(temporary) / 'credential.json'
            target.write_text('{"client_id":"synthetic-existing"}')
            target.chmod(0o600)
            calls = []

            def api(method, resource, body=None):
                calls.append(method)
                if method == 'get':
                    return []
                raise RuntimeError('UNEXPECTED_PROVIDER_MUTATION')

            with patch.object(module, 'TARGET', target), patch.object(module, 'api', api):
                with self.assertRaisesRegex(RuntimeError, 'Protected credential exists'):
                    main(module)
            self.assertEqual(calls, ['get'])
            self.assertEqual(json.loads(target.read_text())['client_id'], 'synthetic-existing')

    def test_preparation_cannot_disable_an_existing_active_production_client(self):
        module = load('prepare-production-clients')
        identifiers = {'web': 'synthetic-web', 'ios': 'synthetic-ios'}
        clients = [{**spec, **module.COMMON, 'client_id': identifiers[kind]} for kind, spec in module.CLIENTS.items()]
        writes = []

        def api(method, resource, body=None):
            if method != 'get':
                writes.append((method, resource))
                raise RuntimeError('UNEXPECTED_PROVIDER_MUTATION')
            if resource.startswith('clients?'): return clients
            if resource.startswith('resource-servers?'): return [{**module.API, 'id': 'api-fixture'}]
            if resource.startswith('connections?'): return [{'id': 'connection-fixture', 'name': 'database', 'strategy': 'auth0'}]
            if resource.startswith('connections/'): return {'clients': [{'client_id': identifiers['web']}]}
            if resource.startswith('clients/'):
                return next(row for row in clients if resource.split('/')[1].split('?')[0] == row['client_id'])
            raise AssertionError(resource)

        with tempfile.TemporaryDirectory() as temporary:
            secret = Path(temporary) / 'web.json'
            secret.write_text(json.dumps({'client_id': identifiers['web'], 'domain': module.DOMAIN}))
            secret.chmod(0o600)
            with patch.object(module, 'SECRET', secret), patch.object(module, 'api', api):
                with self.assertRaisesRegex(RuntimeError, 'Existing production client.*active connection'):
                    main(module, '--apply', '--output', str(Path(temporary) / 'receipt.json'))
            self.assertEqual(writes, [])

    def run_theme_fixture(self, first_read_status):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            cli = root / 'auth0'
            cli.write_text('''#!/usr/bin/env python3
import json, os, sys
args = sys.argv[1:]
with open(os.environ['RILLORA_AUTH0_FIXTURE_LOG'], 'a') as log:
    log.write(json.dumps(args[:3]) + '\\n')
if args[:3] == ['api', 'get', 'branding/themes/default'] and len(open(os.environ['RILLORA_AUTH0_FIXTURE_LOG']).readlines()) == 1:
    print(os.environ['RILLORA_AUTH0_FIXTURE_FIRST_READ_STATUS'], file=sys.stderr)
    raise SystemExit(1)
if args[:2] == ['api', 'post']:
    print(json.dumps({'themeId': 'a' * 32}))
else:
    print('{}')
''')
            cli.chmod(0o700)
            log = root / 'calls.jsonl'
            result = subprocess.run(['bash', str(HERE / 'apply-universal-login.sh'), str(root / 'evidence')],
                env={**os.environ, 'PATH': str(root) + os.pathsep + os.environ['PATH'],
                    'RILLORA_AUTH0_FIXTURE_LOG': str(log),
                    'RILLORA_AUTH0_FIXTURE_FIRST_READ_STATUS': first_read_status},
                text=True, capture_output=True, timeout=15)
            self.assertTrue(log.exists(), result.stderr)
            calls = [json.loads(line) for line in log.read_text().splitlines()]
            return result, calls

    def test_theme_read_failure_cannot_be_treated_as_a_missing_theme(self):
        result, calls = self.run_theme_fixture('503 Service Unavailable')
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse(any(row[:2] in [['api', 'post'], ['api', 'patch']] or row[:3] == ['universal-login', 'templates', 'update'] for row in calls))

    def test_confirmed_missing_theme_can_use_the_creation_path(self):
        result, calls = self.run_theme_fixture('404 Not Found')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn(['api', 'post', 'branding/themes'], calls)
        self.assertIn(['universal-login', 'templates', 'update'], calls)


if __name__ == '__main__':
    unittest.main()
