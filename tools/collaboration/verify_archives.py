#!/usr/bin/env python3
"""Verify every sealed object, optionally restore selected original paths to a new folder."""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import shutil
import subprocess
import tarfile
import tempfile


def safe_relative(name: str) -> Path:
    value = PurePosixPath(name)
    if not name or value.is_absolute() or '..' in value.parts or '\\' in name:
        raise ValueError('Unsafe archive path')
    return Path(*value.parts)


def digest(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def verify(root: Path, identity: Path, destination: Path | None = None, prefix: str = '') -> dict:
    summary = json.loads((root / 'collaboration/snapshot.json').read_text())
    records = [r for file in summary['catalogFiles'] for r in json.loads((root / file).read_text())]
    expected = {}
    for record in records:
        safe_relative(record['sourcePath'])
        item = expected.setdefault(record['rawObject'], {'paths': [], 'archive': record['rawArchive'], 'bytes': record['bytes']})
        if item['archive'] != record['rawArchive'] or item['bytes'] != record['bytes']:
            raise ValueError('Catalog object metadata disagrees')
        item['paths'].append(record['sourcePath'])
    if destination is not None:
        if destination.exists():
            raise ValueError('Restore destination must not exist; original work is never overwritten')
        destination.mkdir(parents=True, mode=0o700)
    seen, restored = set(), 0
    for archive in summary['archives']:
        path = root / safe_relative(archive['path'])
        if path.stat().st_size != archive['bytes'] or digest(path) != archive['sha256']:
            raise ValueError('Ciphertext mismatch or Git LFS object not fetched: ' + archive['path'])
        decrypt = subprocess.Popen(['age', '-d', '-i', str(identity), str(path)], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        unpack = subprocess.Popen(['zstd', '-dq'], stdin=decrypt.stdout, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        decrypt.stdout.close()
        try:
            with tarfile.open(fileobj=unpack.stdout, mode='r|') as tar:
                first = tar.next()
                if first is None or first.name != 'manifest.json' or not first.isfile():
                    raise ValueError('Missing sealed manifest')
                manifest = json.load(tar.extractfile(first))
                blobs = {b['id']: b for b in manifest}
                if len(blobs) != len(manifest):
                    raise ValueError('Duplicate sealed object')
                local_seen = set()
                for member in tar:
                    if member.name == 'manifest.json':
                        continue
                    object_id = member.name.removeprefix('objects/')
                    if member.name != 'objects/' + object_id or not member.isfile() or object_id not in blobs:
                        raise ValueError('Unexpected archive member')
                    item, public = blobs[object_id], expected.get(object_id)
                    if object_id in seen or public is None or public['archive'] != archive['path']:
                        raise ValueError('Uncatalogued or duplicated object')
                    if sorted(item['paths']) != sorted(public['paths']) or member.size != item['bytes'] or member.size != public['bytes']:
                        raise ValueError('Sealed/public manifests disagree')
                    targets = [p for p in item['paths'] if p.startswith(prefix)] if destination is not None else []
                    h = hashlib.sha256()
                    with tempfile.TemporaryFile() as spool:
                        source = tar.extractfile(member)
                        for block in iter(lambda: source.read(1024 * 1024), b''):
                            h.update(block)
                            if targets:
                                spool.write(block)
                        if h.hexdigest() != item['sha256']:
                            raise ValueError('Plaintext hash mismatch')
                        for name in targets:
                            target = destination / safe_relative(name)
                            target.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
                            spool.seek(0)
                            with target.open('xb') as output:
                                shutil.copyfileobj(spool, output)
                            target.chmod(0o700 if member.mode & 0o111 else 0o600)
                            restored += 1
                    local_seen.add(object_id)
                    seen.add(object_id)
                if local_seen != set(blobs):
                    raise ValueError('Missing sealed object')
            # Consume tar padding so both producers finish and authentication is checked.
            while unpack.stdout.read(1024 * 1024):
                pass
            if unpack.wait() or decrypt.wait():
                raise ValueError('Decompression or age authentication failed')
        finally:
            for process in (unpack, decrypt):
                if process.poll() is None:
                    process.kill()
                    process.wait()
        print('Verified ' + archive['path'], flush=True)
    if seen != set(expected):
        raise ValueError('Catalog references missing raw objects')
    return {'verifiedObjects': len(seen), 'coveredWorkFiles': len(records), 'restoredFiles': restored,
            'archives': len(summary['archives']), 'passed': True}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument('--identity', type=Path, required=True)
    parser.add_argument('--restore-to', type=Path)
    parser.add_argument('--prefix', default='')
    parser.add_argument('--report', type=Path)
    args = parser.parse_args()
    result = verify(args.root.resolve(), args.identity.resolve(), args.restore_to, args.prefix)
    data = json.dumps(result, indent=2) + '\n'
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(data)
    print(data)


if __name__ == '__main__':
    main()
