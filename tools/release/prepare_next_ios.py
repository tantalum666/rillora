#!/usr/bin/env python3
"""Generate the isolated next iOS project with the current reviewed dependency pins."""
from pathlib import Path
import hashlib
import json
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[2]
IOS = ROOT / 'apps/ios'
PRESERVED = ['project.yml', 'Rillora/Resources/Info.plist', 'Rillora/Rillora.entitlements', 'Rillora/Resources/Localizable.xcstrings',
             'Rillora.xcodeproj/project.pbxproj',
             'Rillora.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved']


def main():
    before = {name: hashlib.sha256((IOS / name).read_bytes()).hexdigest() for name in PRESERVED}
    # Deferred notification localization must live in the application bundle.
    # Generate a next-only superset; never edit the current review's catalogue.
    catalogue = json.loads((IOS / 'Rillora/Resources/Localizable.xcstrings').read_text())
    additions = json.loads((IOS / 'NextVersionCheckIn/Configuration/NotificationStrings.xcstrings').read_text())
    if set(catalogue['strings']) & set(additions['strings']):
        raise RuntimeError('Next notification keys must not override reviewed strings')
    catalogue['strings'].update(additions['strings'])
    generated = IOS / 'NextVersionContent/Configuration/Localizable.xcstrings'
    generated.parent.mkdir(parents=True, exist_ok=True)
    generated.write_text(json.dumps(catalogue, ensure_ascii=False, indent=2) + '\n')
    watch_strings = IOS / 'NextVersionWatch/Configuration/Localizable.xcstrings'
    watch_strings.parent.mkdir(parents=True, exist_ok=True)
    watch_strings.write_text(json.dumps(additions, ensure_ascii=False, indent=2) + '\n')
    subprocess.run(['xcodegen', 'generate', '--spec', str(IOS / 'project.next.yml')], check=True)
    source = IOS / PRESERVED[-1]
    target = IOS / 'RilloraNext.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved'
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, target)
    for name, digest in before.items():
        if hashlib.sha256((IOS / name).read_bytes()).hexdigest() != digest:
            raise RuntimeError('Current review source changed: ' + name)
    print('Next project prepared; original project and remote dependency pins preserved.')


if __name__ == '__main__':
    main()
