#!/usr/bin/env python3
"""Generate the isolated next iOS project with the current reviewed dependency pins."""
from pathlib import Path
import hashlib
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[2]
IOS = ROOT / 'apps/ios'
PRESERVED = ['project.yml', 'Rillora/Resources/Info.plist', 'Rillora/Rillora.entitlements',
             'Rillora.xcodeproj/project.pbxproj',
             'Rillora.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved']


def main():
    before = {name: hashlib.sha256((IOS / name).read_bytes()).hexdigest() for name in PRESERVED}
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
