import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('preflight', Path(__file__).with_name('preflight.py'))
preflight = importlib.util.module_from_spec(spec)
spec.loader.exec_module(preflight)


class PublicationBoundaryTests(unittest.TestCase):
    def test_current_register_is_complete_and_review_gate_cannot_be_removed(self):
        data = json.loads((preflight.ROOT / 'config/release-gates.json').read_text())
        missing = 'Release register does not contain the complete required gate set'
        self.assertNotIn(missing, preflight.gate_findings(data))
        data['gates'] = [gate for gate in data['gates'] if gate['id'] != 'review-remediation']
        self.assertIn(missing, preflight.gate_findings(data))

    def test_build_success_with_empty_release_configuration_cannot_pass(self):
        issues = preflight.native_findings({'CFBundleIdentifier': 'com.rillora.ios'})
        for key in preflight.REQUIRED_NATIVE:
            self.assertTrue(any(key in issue for issue in issues))

    def test_debug_cloud_build_cannot_be_used_as_production_artifact(self):
        info = {key: 'configured' for key in preflight.REQUIRED_NATIVE}
        info.update(CFBundleIdentifier='com.rillora.ios', RilloraAuth0Domain='login.rillora.xyz',
                    RilloraAPIBaseURL='https://app.staging.rillora.xyz/api/v1',
                    RilloraNativeSessionURL='https://app.staging.rillora.xyz/api/auth/native/session',
                    RilloraDevPlannerID='synthetic-planner')
        issues = preflight.native_findings(info)
        self.assertIn('Development identity is present', issues)
        self.assertEqual(sum('production origin' in i for i in issues), 2)
        self.assertIn('No compiled primary App icon', issues)

    def test_deferred_and_unsupported_verified_gates_do_not_clear_publication(self):
        data = {'schemaVersion': 1, 'gates': [
            {'id': 'merchant', 'required': True, 'status': 'owner_deferred', 'evidence': []},
            {'id': 'backup', 'required': True, 'status': 'verified', 'evidence': []},
        ]}
        issues = preflight.gate_findings(data)
        self.assertIn('merchant: owner_deferred', issues)
        self.assertIn('backup: verified without evidence references', issues)

    def test_valid_artifact_shape_and_referenced_evidence_can_be_recognized(self):
        info = {key: 'configured' for key in preflight.REQUIRED_NATIVE}
        info.update(CFBundleIdentifier='com.rillora.ios', RilloraAuth0Domain='login.rillora.xyz',
                    RilloraAPIBaseURL='https://app.rillora.xyz/api/v1',
                    RilloraNativeSessionURL='https://app.rillora.xyz/api/auth/native/session',
                    RilloraAuth0ClientID=preflight.CONNECTIONS['nativeClientID'],
                    RilloraAuth0Audience=preflight.CONNECTIONS['audience'],
                    RilloraCustomerAccessEnabled=True,
                    CFBundleIcons={'CFBundlePrimaryIcon': {'CFBundleIconName': 'AppIcon'}})
        self.assertEqual(preflight.native_findings(info), [])
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / 'proof.json').write_text('{}')
            data = {'schemaVersion': 1, 'gates': [
                {'id': ident, 'required': True, 'status': 'verified', 'evidence': ['proof.json']}
                for ident in preflight.GATE_IDS]}
            self.assertEqual(preflight.gate_findings(data, root), [])
            data['gates'][0]['evidence'] = ['../outside.json']
            self.assertTrue(preflight.gate_findings(data, root))

    def test_configured_closed_candidate_does_not_clear_native_publication(self):
        info = {'CFBundleIdentifier': 'com.rillora.ios', 'RilloraAuth0Domain': 'login.rillora.xyz',
                'RilloraAPIBaseURL': preflight.CONNECTIONS['apiBaseURL'],
                'RilloraNativeSessionURL': preflight.CONNECTIONS['nativeSessionURL'],
                'RilloraAuth0ClientID': preflight.CONNECTIONS['nativeClientID'],
                'RilloraAuth0Audience': preflight.CONNECTIONS['audience'],
                'RilloraCustomerAccessEnabled': 'NO',
                'CFBundleIcons': {'CFBundlePrimaryIcon': {'CFBundleIconName': 'AppIcon'}}}
        self.assertEqual(preflight.native_findings(info), ['Customer account access is closed in this artifact'])
        info['RilloraAuth0Audience'] = 'urn:rillora:api'
        self.assertIn('RilloraAuth0Audience: not the reviewed production connection', preflight.native_findings(info))

    def test_removing_a_required_gate_does_not_turn_the_check_green(self):
        data = {'schemaVersion': 1, 'gates': [
            {'id': 'operations', 'required': True, 'status': 'verified', 'evidence': ['AGENTS.md']}]}
        self.assertIn('Release register does not contain the complete required gate set',
                      preflight.gate_findings(data))


if __name__ == '__main__':
    unittest.main()
