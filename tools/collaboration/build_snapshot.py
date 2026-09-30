#!/usr/bin/env python3
"""Preserve work, publish readable redacted evidence, and seal raw artifacts for LFS.

This tool neither uploads nor changes source artifacts. It excludes credential stores,
database contents, unrelated system diagnostics and reproducible dependency/build caches.
"""
from __future__ import annotations
import argparse
import datetime
import gzip
import hashlib
import io
import json
import os
from pathlib import Path
import re
import shlex
import shutil
import subprocess
import tarfile
import uuid
from collections import Counter
from snapshot_policy import directory_exclusion, file_exclusion, readable_text, readable_binary, public_path

ROOT = Path(__file__).resolve().parents[2]
DEST = ROOT / 'collaboration'
QA = ROOT / 'output/qa/rillora-all-work-git-20260930'
IDENTITY = ROOT / '.local-secrets/collaboration-git/identity.txt'
CHUNK_BYTES = 750 * 1024 * 1024
SENSITIVE_KEYS = {'password', 'clientsecret', 'secretaccesskey', 'accesstoken', 'refreshtoken',
                  'sessiontoken', 'idtoken', 'csrftoken', 'apikey', 'privatekey', 'secret',
                  'authorization', 'cookie', 'setcookie', 'invitationtoken', 'recoveryprivatekey'}
PUBLIC_EMAILS = {'support@rillora.xyz', 'privacy@rillora.xyz', 'security@rillora.xyz'}
# Old client build artifacts were kept here because they contained legal identity
# text. These exact reviewed paths are work products, not credential-store exports.
PROTECTED_BUILD_PATHS = [
    '.local-secrets/compiled-p1-20260916',
    '.local-secrets/compiled-p2-20260916',
    '.local-secrets/brand-adoption',
    '.local-secrets/legal/rillora-legal-p1-20260916.tar.gz',
    '.local-secrets/legal/rillora-ux-behavior-20260916.tar.gz',
]

def sha(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as f:
        for block in iter(lambda: f.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()

def freeze_file(path: Path, cache: Path) -> tuple[Path, str]:
    """Capture the opening byte length; later appends cannot change this snapshot."""
    temporary = cache / (uuid.uuid4().hex + '.part')
    h = hashlib.sha256()
    with path.open('rb') as source, temporary.open('xb') as target:
        info = os.fstat(source.fileno())
        remaining = info.st_size
        while remaining:
            block = source.read(min(remaining, 1024 * 1024))
            if not block:
                raise RuntimeError('Source truncated during capture: ' + str(path))
            target.write(block)
            h.update(block)
            remaining -= len(block)
    digest = h.hexdigest()
    frozen = cache / digest
    temporary.chmod(0o700 if info.st_mode & 0o111 else 0o600)
    if frozen.exists():
        temporary.unlink()
    else:
        temporary.rename(frozen)
    return frozen, digest

def sensitive_values() -> set[str]:
    values = set()
    def walk(value):
        if isinstance(value, dict):
            for key, child in value.items():
                if re.sub('[^a-z]', '', key.lower()) in SENSITIVE_KEYS and isinstance(child, str) and len(child) >= 8:
                    values.add(child)
                else:
                    walk(child)
        elif isinstance(value, list):
            for child in value:
                walk(child)
    for path in (ROOT / '.local-secrets').rglob('*.json'):
        if path.stat().st_size > 1024 * 1024:
            continue
        try:
            walk(json.loads(path.read_text()))
        except (ValueError, UnicodeError):
            pass
    env = ROOT / '.local-secrets/legal/release.env'
    if env.exists():
        for line in env.read_text().splitlines():
            line = line.strip().removeprefix('export ').strip()
            if line.startswith(('VITE_LEGAL_OPERATOR_NAME=', 'VITE_LEGAL_SERVICE_ADDRESS=')):
                parts = shlex.split(line.partition('=')[2])
                if parts and len(parts[0]) >= 4:
                    values.add(parts[0])
    return values

def redact(text: str, values: set[str], preserve_attribution: bool = False) -> tuple[str, int]:
    before = text
    for value in sorted(values, key=len, reverse=True):
        text = text.replace(value, '[REDACTED_PRIVATE_VALUE]')
    text = re.sub(r'-----BEGIN (?:[A-Z ]+)?PRIVATE KEY-----.*?-----END (?:[A-Z ]+)?PRIVATE KEY-----',
                  '[REDACTED_PRIVATE_KEY]', text, flags=re.S)
    text = re.sub(r'\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+', '[REDACTED_JWT]', text)
    text = re.sub(r'(?i)(Bearer\s+)[A-Za-z0-9_.~+/-]{20,}', r'\1[REDACTED_TOKEN]', text)
    text = re.sub(r'(?i)((?:continuity_session|continuity_csrf|continuity_auth_tx)\s*=\s*)[^;\s"\']+', r'\1[REDACTED_COOKIE]', text)
    text = re.sub(r'(?i)((?:[?&#]|%26)(?:invitation|code|state|token)=)[^&#\s"<>]+', r'\1[REDACTED_CAPABILITY]', text)
    def email(match):
        value = match.group(0)
        domain = value.rsplit('@', 1)[1].lower()
        return value if value.lower() in PUBLIC_EMAILS or domain.endswith(('.test', '.invalid', '.example', 'users.noreply.github.com')) or domain in {'example.com', 'example.net', 'example.org'} else '[REDACTED_EMAIL]'
    if not preserve_attribution:
        text = re.sub(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', email, text)
    # Literal JSON secret fields, not hashes, IDs, ARN references, or source variable names.
    def field(match):
        key = re.sub('[^a-z]', '', match.group(1).lower())
        if key not in SENSITIVE_KEYS:
            return match.group(0)
        return json.dumps(match.group(1)) + ': "[REDACTED_CREDENTIAL]"'
    text = re.sub(r'"([^"\n]+)"\s*:\s*"(?:\\.|[^"\\])*"', field, text)
    return text, int(text != before)

def inputs():
    exclusions = []
    files = []
    for base, dirs, names in os.walk(ROOT):
        parent = Path(base)
        kept = []
        for name in sorted(dirs):
            path = parent / name
            rel = path.relative_to(ROOT).as_posix()
            if path == DEST or path == QA:
                continue
            reason = directory_exclusion(rel)
            if reason:
                exclusions.append({'path': rel, 'kind': 'directory', 'reason': reason})
            elif path.is_symlink():
                exclusions.append({'path': rel, 'kind': 'symlink', 'reason': 'machine_specific_link'})
            else:
                kept.append(name)
        dirs[:] = kept
        for name in sorted(names):
            path = parent / name
            rel = path.relative_to(ROOT).as_posix()
            reason = file_exclusion(rel)
            if path.suffix.lower() == '.pem':
                with path.open('rb') as stream:
                    header = stream.read(65536)
                if b'PRIVATE KEY' in header or not any(kind in header for kind in [b'BEGIN CERTIFICATE', b'BEGIN PUBLIC KEY']):
                    reason = 'private_or_unreviewed_key_material'
            if path.is_symlink():
                reason = 'machine_specific_link'
            if reason:
                exclusions.append({'path': rel, 'kind': 'file', 'reason': reason})
            else:
                files.append((rel, path))
    report = Path('/Users/tantalum/Downloads/Rillora-code-review-2026-09-30-zh.md')
    if report.exists():
        files.append(('external-inputs/' + report.name, report))
    for name in PROTECTED_BUILD_PATHS:
        path = ROOT / name
        candidates = [path] if path.is_file() else path.rglob('*')
        for candidate in candidates:
            relative = candidate.relative_to(ROOT).as_posix()
            if candidate.is_file() and not candidate.is_symlink() and not file_exclusion(relative):
                files.append((relative, candidate))
    # Filtered editor snapshots are prepared separately, without their ignored data/caches.
    history = QA / 'checkpoint-sources'
    if history.exists():
        files.extend(('history/checkpoints/' + p.relative_to(history).as_posix(), p) for p in history.rglob('*') if p.is_file())
    return files, exclusions

def add_bytes(tar: tarfile.TarFile, name: str, data: bytes):
    info = tarfile.TarInfo(name)
    info.size = len(data)
    info.mode = 0o600
    tar.addfile(info, io.BytesIO(data))

def seal_chunk(number: int, blobs: list[dict], recipient: str) -> dict:
    archive = DEST / 'archives' / f'raw-work-{number:03d}.tar.zst.age'
    plain_size = sum(item['bytes'] for item in blobs)
    with archive.open('wb') as output:
        encrypt = subprocess.Popen(['age', '-r', recipient], stdin=subprocess.PIPE, stdout=output, stderr=subprocess.PIPE)
        compress = subprocess.Popen(['zstd', '-q', '-T2', '-6'], stdin=subprocess.PIPE, stdout=encrypt.stdin, stderr=subprocess.PIPE)
        encrypt.stdin.close()
        try:
            with tarfile.open(fileobj=compress.stdin, mode='w|', format=tarfile.PAX_FORMAT) as tar:
                manifest = [{k: v for k, v in item.items() if k != 'source'} for item in blobs]
                add_bytes(tar, 'manifest.json', json.dumps(manifest, ensure_ascii=False).encode())
                for item in blobs:
                    source = Path(item['source'])
                    if source.stat().st_size != item['bytes'] or sha(source) != item['sha256']:
                        raise RuntimeError('Source changed while archiving: ' + item['paths'][0])
                    info = tar.gettarinfo(str(source), arcname='objects/' + item['id'])
                    info.uid = info.gid = 0
                    info.uname = info.gname = ''
                    with source.open('rb') as f:
                        tar.addfile(info, f)
        finally:
            compress.stdin.close()
        if compress.wait() != 0 or encrypt.wait() != 0:
            raise RuntimeError('Archive encryption failed')
    return {'path': archive.relative_to(ROOT).as_posix(), 'sha256': sha(archive),
            'bytes': archive.stat().st_size, 'plainBytes': plain_size, 'uniqueObjects': len(blobs)}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--plan-only', action='store_true')
    args = parser.parse_args()
    files, exclusions = inputs()
    tracked = set(subprocess.check_output(['git', 'ls-files', '-z'], cwd=ROOT).decode().strip('\0').split('\0'))
    work = [(name, path) for name, path in files if name not in tracked]
    plan = {'sourceBase': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT).decode().strip(),
            'repositorySources': sum(name in tracked for name, _ in files),
            'workFiles': len(work), 'workBytes': sum(p.stat().st_size for _, p in work),
            'excluded': exclusions}
    QA.mkdir(parents=True, exist_ok=True)
    (QA / 'publication-plan.json').write_text(json.dumps(plan, ensure_ascii=False, indent=2) + '\n')
    if args.plan_only:
        print(json.dumps({k: v for k, v in plan.items() if k != 'excluded'}))
        return
    if any((DEST / 'archives').glob('*.age')):
        raise RuntimeError('Archive set already exists; verify/reuse it instead of regenerating randomized ciphertext')
    if IDENTITY.stat().st_mode & 0o077:
        raise RuntimeError('Archive identity must have owner-only permissions')
    recipient = subprocess.check_output(['age-keygen', '-y', str(IDENTITY)], text=True).strip()
    values = sensitive_values()
    captured_from = datetime.datetime.now(datetime.timezone.utc).isoformat()
    cache = QA / 'frozen-objects'
    cache.mkdir(mode=0o700, exist_ok=True)
    unique = {}
    records = []
    for index, (name, path) in enumerate(work):
        original_name = path.name
        path, digest = freeze_file(path, cache)
        blob = unique.setdefault(digest, {'id': uuid.uuid4().hex, 'sha256': digest,
            'bytes': path.stat().st_size, 'source': str(path), 'paths': []})
        blob['paths'].append(name)
        record = {'sourcePath': name, 'bytes': path.stat().st_size, 'rawObject': blob['id']}
        # Whole-browser capture folders may describe unrelated tabs or people.
        browser_capture = name.startswith('.local-secrets/') or any(part.startswith('.playwright') for part in Path(name).parts)
        if readable_text(name) and not browser_capture and path.stat().st_size <= 64 * 1024 * 1024:
            try:
                text = path.read_text()
            except (UnicodeError, ValueError):
                text = None
            if text is not None and '\x00' not in text:
                attribution = original_name.lower() in {'ofl.txt', 'license', 'license.txt', 'license.md', 'font-licenses.txt', 'design-credits.txt'}
                text, changed = redact(text, values, preserve_attribution=attribution)
                published = ROOT / public_path(name)
                published.parent.mkdir(parents=True, exist_ok=True)
                data = text.encode()
                if len(data) > 1024 * 1024:
                    published = Path(str(published) + '.gz')
                    with published.open('wb') as f:
                        f.write(gzip.compress(data, mtime=0))
                    preview = Path(str(published) + '.preview.txt')
                    lines = text.splitlines()
                    preview.write_text('GENERATED PREVIEW; full redacted contents are in the adjacent gzip.\n\n' + '\n'.join(lines[:100] + ['[... full content retained in gzip ...]'] + lines[-100:]))
                    record['previewPath'] = preview.relative_to(ROOT).as_posix()
                else:
                    published.write_bytes(data)
                record.update(readablePath=published.relative_to(ROOT).as_posix(), privacyRedactions=bool(changed))
        elif readable_binary(name) and path.stat().st_size < 50 * 1024 * 1024:
            published = ROOT / public_path(name)
            published.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(path, published)
            record['readablePath'] = published.relative_to(ROOT).as_posix()
        records.append(record)
        if index % 1000 == 0:
            print(f'Inventoried {index}/{len(work)} work files', flush=True)
    chunks, pending, size = [], [], 0
    for blob in unique.values():
        if pending and size + blob['bytes'] > CHUNK_BYTES:
            chunks.append(pending); pending, size = [], 0
        pending.append(blob); size += blob['bytes']
    if pending:
        chunks.append(pending)
    archives, object_archives = [], {}
    for number, chunk in enumerate(chunks, 1):
        receipt = seal_chunk(number, chunk, recipient)
        archives.append(receipt)
        for blob in chunk:
            object_archives[blob['id']] = receipt['path']
        print(f'Sealed {number}/{len(chunks)} archives: {receipt["bytes"]} bytes', flush=True)
    for record in records:
        record['rawArchive'] = object_archives[record['rawObject']]
    for start in range(0, len(records), 500):
        (DEST / 'catalog' / f'files-{start//500+1:03d}.json').write_text(json.dumps(records[start:start+500], ensure_ascii=False, indent=2) + '\n')
    summary = {k: v for k, v in plan.items() if k != 'excluded'}
    summary.update(workBytes=sum(r['bytes'] for r in records), capturedFrom=captured_from,
                   capturedThrough=datetime.datetime.now(datetime.timezone.utc).isoformat(),
                   protectedBuildExceptions=PROTECTED_BUILD_PATHS)
    summary.update(uniqueRawObjects=len(unique), uniqueRawBytes=sum(b['bytes'] for b in unique.values()),
        readableFiles=sum('readablePath' in r for r in records), archives=archives,
        archiveBytes=sum(a['bytes'] for a in archives), recipientFingerprint=hashlib.sha256(recipient.encode()).hexdigest(),
        catalogFiles=[p.relative_to(ROOT).as_posix() for p in sorted((DEST / 'catalog').glob('files-*.json'))],
        excludedDirectoryAndFileCounts=dict(Counter(r['reason'] for r in exclusions)))
    (DEST / 'snapshot.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2) + '\n')
    # Local audit retains precise excluded names; the shared policy lists reasons without exposing credential filenames.
    (QA / 'raw-objects.json').write_text(json.dumps(list(unique.values()), ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({k: summary[k] for k in ['workFiles','uniqueRawObjects','readableFiles','archiveBytes']}, ensure_ascii=False))

if __name__ == '__main__':
    main()
