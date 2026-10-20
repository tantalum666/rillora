#!/usr/bin/env python3
"""Check readable-file coverage, catalog links, and downloaded archives or LFS pointers."""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile
import os
from verify_archives import safe_relative

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = 'collaboration/readable-manifest.json'


def digest(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as source:
        for block in iter(lambda: source.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def actual_readable_files(root: Path) -> list[Path]:
    return sorted(p for p in (root / 'collaboration').rglob('*') if p.is_file()
                  and p.relative_to(root).as_posix() != MANIFEST
                  and 'archives' not in p.relative_to(root / 'collaboration').parts[:1])


def write_manifest(root: Path):
    files = [{'path': p.relative_to(root).as_posix(), 'bytes': p.stat().st_size, 'sha256': digest(p)}
             for p in actual_readable_files(root)]
    (root / MANIFEST).write_text(json.dumps({'files': files, 'fileCount': len(files),
        'totalBytes': sum(f['bytes'] for f in files)}, ensure_ascii=False, indent=2) + '\n')


def verify(root: Path, scan: bool = False) -> dict:
    manifest = json.loads((root / MANIFEST).read_text())
    paths = [f['path'] for f in manifest['files']]
    actual = [p.relative_to(root).as_posix() for p in actual_readable_files(root)]
    if len(set(paths)) != len(paths) or sorted(paths) != sorted(actual):
        raise ValueError('Readable manifest has missing, extra or duplicate files')
    for item in manifest['files']:
        path = root / item['path']
        if path.is_symlink() or path.stat().st_size != item['bytes'] or digest(path) != item['sha256']:
            raise ValueError('Readable file changed: ' + item['path'])
    summary = json.loads((root / 'collaboration/snapshot.json').read_text())
    archives = {a['path']: a for a in summary['archives']}
    records = [record for file in summary['catalogFiles'] for record in json.loads((root / file).read_text())]
    if len(records) != summary['workFiles'] or len({r['sourcePath'] for r in records}) != len(records):
        raise ValueError('Incomplete or duplicated source path catalog')
    for record in records:
        if record['rawArchive'] not in archives:
            raise ValueError('Unknown raw archive')
        for key in ['readablePath', 'previewPath']:
            if key in record and record[key] not in paths:
                raise ValueError('Missing readable evidence: ' + record[key])
    pointers, downloaded = 0, 0
    for name, item in archives.items():
        path = root / safe_relative(name)
        if path.is_symlink():
            raise ValueError('Archive must not be a symlink')
        if path.stat().st_size < 1024:
            pointer = path.read_text()
            expected = f'version https://git-lfs.github.com/spec/v1\noid sha256:{item["sha256"]}\nsize {item["bytes"]}\n'
            if pointer != expected:
                raise ValueError('LFS pointer mismatch: ' + name)
            pointers += 1
        elif path.stat().st_size == item['bytes'] and digest(path) == item['sha256']:
            downloaded += 1
        else:
            raise ValueError('Downloaded archive mismatch: ' + name)
    scan_result = None
    if scan:
        # Scan only readable bytes, including compressed text/design packages.
        # Ciphertext authenticity/plaintext checks belong to verify_archives.py.
        with tempfile.TemporaryDirectory(prefix='rillora-publication-scan-') as temporary:
            stage = Path(temporary) / 'readable'
            for item in manifest['files']:
                target = stage / item['path']
                target.parent.mkdir(parents=True, exist_ok=True)
                os.link(root / item['path'], target)
            report = Path(temporary) / 'scan.json'
            rules = Path(temporary) / 'rules.toml'
            rules.write_text('[extend]\nuseDefault = true\n')
            ignored = Path(temporary) / 'empty.ignore'
            ignored.write_text('')
            result = subprocess.run(['gitleaks', 'dir', str(stage), '--redact=100', '--no-banner',
                '--config', str(rules), '--gitleaks-ignore-path', str(ignored), '--ignore-gitleaks-allow',
                '--max-archive-depth', '2', '--report-format', 'json', '--report-path', str(report)], capture_output=True)
            if result.returncode != 0 or not report.exists() or json.loads(report.read_text()):
                raise ValueError('Readable evidence secret scan did not pass')
            scan_result = {'scanner': 'gitleaks', 'unreviewedFindings': 0, 'compressedDepth': 2}
    return {'passed': True, 'readableFiles': len(paths), 'coveredWorkFiles': len(records),
            'downloadedArchives': downloaded, 'lfsPointers': pointers, 'scan': scan_result}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=ROOT)
    parser.add_argument('--write-manifest', action='store_true')
    parser.add_argument('--scan', action='store_true')
    parser.add_argument('--report', type=Path)
    args = parser.parse_args()
    root = args.root.resolve()
    if args.write_manifest:
        write_manifest(root)
    result = verify(root, args.scan)
    data = json.dumps(result, indent=2) + '\n'
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(data)
    print(data)


if __name__ == '__main__':
    main()
