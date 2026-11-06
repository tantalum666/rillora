#!/usr/bin/env python3
"""Generate a local-only purchase UI test host without editing the release project."""
from pathlib import Path
import argparse
import hashlib
import json
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[2]
PRESERVED = ['project.yml', 'Rillora.xcodeproj/project.pbxproj',
             'Rillora/Resources/Info.plist', 'Rillora/Rillora.entitlements',
             'Rillora/Resources/Localizable.xcstrings']


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ios-root', type=Path, default=ROOT / 'apps/ios')
    parser.add_argument('--output', type=Path, default=ROOT / 'output/qa/native-purchase-ui')
    args = parser.parse_args()
    ios, output = args.ios_root.resolve(), args.output.resolve()
    before = {p: hashlib.sha256((ios / p).read_bytes()).hexdigest() for p in PRESERVED}
    output.mkdir(parents=True, exist_ok=True)
    resolved = output / 'resolved-source.json'
    subprocess.run(['xcodegen', 'dump', '--spec', str(ios / 'project.yml'), '--type', 'json',
                    '--no-env', '--quiet', '--file', str(resolved)], check=True)
    spec = json.loads(resolved.read_text())
    # Reuse the existing host's sources, settings and pinned package definitions.
    # Do not copy the real app target or its authentication/build configuration.
    spec['name'] = 'RilloraPurchaseUI'
    host = spec['targets']['RilloraComponentPreview']
    # Build settings resolve this path against the generated project directory,
    # not XcodeGen's source root. Generate a separate host plist beside the project.
    host['info']['path'] = str(output / 'RilloraComponentPreview-Info.plist')
    for source in host['sources']:
        if source.get('path') == 'RilloraComponentPreview':
            source['excludes'] = [*source.get('excludes', []), 'Info.plist']
    spec['targets'] = {'RilloraComponentPreview': host,
                      'RilloraPurchaseInteractionTests': {
                          'type': 'bundle.ui-testing', 'platform': 'iOS',
                          'sources': [{'path': 'RilloraPurchaseInteractionTests'}],
                          'dependencies': [{'target': 'RilloraComponentPreview'}],
                          'settings': {'base': {'PRODUCT_BUNDLE_IDENTIFIER': 'com.rillora.ios.purchase-interaction-tests',
                                                'GENERATE_INFOPLIST_FILE': True,
                                                'TEST_TARGET_NAME': 'RilloraComponentPreview'}}}}
    spec['schemes'] = {'RilloraComponentPreview': {
        'build': {'targets': {'RilloraComponentPreview': 'all', 'RilloraPurchaseInteractionTests': ['test']}},
        'run': {'config': 'Debug'},
        'test': {'config': 'Debug', 'targets': ['RilloraPurchaseInteractionTests']}}}
    path = output / 'project.json'
    path.write_text(json.dumps(spec, indent=2) + '\n')
    subprocess.run(['xcodegen', 'generate', '--spec', str(path), '--project-root', str(ios),
                    '--project', str(output), '--no-env'], check=True)
    pins = Path('project.xcworkspace/xcshareddata/swiftpm/Package.resolved')
    target = output / 'RilloraPurchaseUI.xcodeproj' / pins
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(ios / 'Rillora.xcodeproj' / pins, target)
    after = {p: hashlib.sha256((ios / p).read_bytes()).hexdigest() for p in PRESERVED}
    if before != after:
        raise RuntimeError('Purchase test generation changed the release project')
    print(json.dumps({'project': str(output / 'RilloraPurchaseUI.xcodeproj'),
                      'releaseFilesUnchanged': True, 'realAppTargetIncluded': False}))


if __name__ == '__main__':
    main()
