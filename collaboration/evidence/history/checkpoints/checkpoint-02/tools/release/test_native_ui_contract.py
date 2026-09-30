"""Guard current navigation targets independently of simulator availability."""
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

class NativeUIContractTests(unittest.TestCase):
    def test_profile_navigation_helpers_reference_declared_product_routes(self):
        tests = (ROOT / 'apps/ios/RilloraLayoutMatrixTests/RilloraLayoutMatrixTests.swift').read_text()
        app = '\n'.join(p.read_text() for p in (ROOT / 'apps/ios/Rillora').rglob('*.swift'))
        for route in re.findall(r'open(?:Push|Sheet)Route\(\s*"([^"]+)"', tests):
            self.assertIn(f'.accessibilityIdentifier("{route}")', app, route)
        for retired in ['matter.section.', 'first-use.account-open']:
            self.assertNotIn(f'element("{retired}', tests)
        for retired in ['plan-motivation.open', 'simulation.open', 'disclosure-rehearsal.open']:
            self.assertNotRegex(tests, r'openPushRoute\(\s*"' + re.escape(retired) + r'"')

    def test_matrix_does_not_reuse_an_unidentified_development_database(self):
        runner = (ROOT / 'tools/run-ios-layout-matrix.sh').read_text()
        self.assertNotIn('continuity_dev', runner)
        self.assertIn('/qa/native-ui-fixture', runner)
        self.assertIn('TEST_RUNNER_RILLORA_MATRIX_API_BASE_URL', runner)

if __name__ == '__main__':
    unittest.main()
