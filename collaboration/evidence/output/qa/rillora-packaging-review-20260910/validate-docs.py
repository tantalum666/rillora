from pathlib import Path
import difflib
import hashlib
import json
import re
import subprocess
from datetime import datetime
from urllib.parse import unquote
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[3]
QA = Path(__file__).resolve().parent
reading = json.loads((QA / 'reading.json').read_text())
proof = json.loads((QA / 'full-read-completion.json').read_text())
failures = []
originals = {}

for entry in reading['inventory']:
    ranges = [p for p in reading['parts'] if p['file'] == entry['file']]
    lines = [None] * entry['lines']
    for part in ranges:
        assert part['acknowledged'], part['id']
        content = part['text'].splitlines(keepends=True)
        assert len(content) == part['end'] - part['start'] + 1
        for offset, value in enumerate(content, part['start'] - 1):
            assert lines[offset] is None or lines[offset] == value
            lines[offset] = value
    assert all(line is not None for line in lines), entry['file']
    original = ''.join(lines)
    assert hashlib.sha256(original.encode()).hexdigest() == entry['sha256'], entry['file']
    originals[entry['file']] = original

raw_files = subprocess.check_output(
    ['rg', '--files', '--hidden', '--no-ignore', '-g', '*.md'], cwd=ROOT, text=True
).splitlines()
excluded = {'.git', 'node_modules', 'output', '.local', 'dist', 'build', '.build',
            '.cache', 'SourcePackages', '.venv', 'coverage'}
files = [f for f in raw_files if not any(
    part in excluded or part.startswith('.derived-data') for part in Path(f).parts)]
expected_new = {'docs/handoff-history-20260910.md'}
unexpected = set(files) - set(originals) - expected_new
if unexpected:
    failures.append({'unexpectedUnreadProjectFiles': sorted(unexpected)})
files = sorted(set(files) | {str((QA / 'README.md').relative_to(ROOT))})

link_count = 0
anchor_count = 0
for name in files:
    text = (ROOT / name).read_text()
    without_fences = re.sub(r'^```.*?^```[^\n]*', '', text, flags=re.M | re.S)
    for match in re.finditer(r'!?\[[^\]\n]*\]\((<[^>]+>|[^)\n]+)\)', without_fences):
        target = match.group(1).strip()
        target = target[1:-1] if target.startswith('<') else re.split(r'\s+["\']', target)[0]
        if re.match(r'^[a-z][a-z0-9+.-]*:', target, re.I):
            continue
        link_count += 1
        location, _, fragment = unquote(target).partition('#')
        location = location.split('?')[0]
        path = ((ROOT / name).parent / location).resolve() if location else ROOT / name
        if not path.exists():
            failures.append({'file': name, 'link': target, 'error': 'missing target'})
        elif fragment and path.suffix.lower() == '.md':
            anchor_count += 1
            anchors = []
            for heading in re.findall(r'^#{1,6}\s+(.+)$', path.read_text(), re.M):
                heading = heading.strip().strip('#').strip().lower()
                heading = re.sub(r'[^\w\- ]', '', heading).replace(' ', '-')
                anchors.append(heading)
            if fragment not in anchors:
                failures.append({'file': name, 'link': target, 'error': 'missing heading anchor'})

archive = (ROOT / 'docs/handoff-history-20260910.md').read_text()
archive_exact = archive.endswith(originals['docs/handoff.md'])
if not archive_exact:
    failures.append({'error': 'handoff archive does not preserve exact original text'})
handoff = (ROOT / 'docs/handoff.md').read_text()
assert len(re.findall(r'^## Next step', handoff, re.M)) == 1
assert len(handoff.splitlines()) == 99
assert 'Historical' in archive
checks = {
    'quota_gap_disclosed': 'plan-based count enforcement is absent' in (ROOT / 'docs/monetization.md').read_text(),
    'free_privacy': 'privacy levels' in (ROOT / 'docs/monetization.md').read_text(),
    'family_allowance_provisional': 'PROVISIONAL' in (ROOT / 'docs/monetization.md').read_text(),
    'no_old_account_gate': 'must open `account-access.scroll`' not in (ROOT / 'docs/authentication-experience.md').read_text(),
    'no_stale_pending_iam': 'Cloud rollout is still pending IAM' not in (ROOT / 'SECURITY.md').read_text(),
    'mvp_refund_corrected': '以30天退款保障降低风险' not in (ROOT / 'docs/mvp.md').read_text(),
    'price_sequence_corrected': 'Build a truthful pricing screen with US$89 standard list' not in (ROOT / 'docs/unit-economics.md').read_text(),
    'no_static_p0_map': 'Public root + static product map' not in (ROOT / 'docs/platform-contract.md').read_text(),
}
for name, passed in checks.items():
    if not passed:
        failures.append({'assertion': name})

changed = []
diffs = []
for name, before in originals.items():
    after = (ROOT / name).read_text()
    if before != after:
        changed.append(name)
        if name != 'docs/handoff.md':
            diffs.extend(difflib.unified_diff(before.splitlines(True), after.splitlines(True),
                                            fromfile=f'before/{name}', tofile=f'after/{name}'))
        header = after.splitlines()[:12]
        dates = [line for line in header if line.startswith(('Last updated:', 'Last reviewed:'))]
        if dates and '2026-09-10' not in dates[0]:
            failures.append({'file': name, 'error': 'stale current header date'})

(QA / 'document-changes.patch').write_text(''.join(
    line if line.endswith('\n') else line + '\n\\ No newline at end of file\n'
    for line in diffs))
diff_check = subprocess.run(['git', 'diff', '--check'], cwd=ROOT, capture_output=True, text=True)
if diff_check.returncode:
    failures.append({'gitDiffCheck': diff_check.stdout + diff_check.stderr})
result = {
    'checkedAt': datetime.now(ZoneInfo('Asia/Hong_Kong')).isoformat(),
    'kind': 'documentation validation; no app tests or deployment',
    'startupReadFiles': proof['files'], 'startupReadLines': proof['lines'],
    'acknowledgedRanges': len(reading['parts']), 'originalSourceReconstructionMatches': True,
    'markdownFilesChecked': len(files), 'localLinksChecked': link_count,
    'localHeadingAnchorsChecked': anchor_count, 'originalHandoffPreserved': archive_exact,
    'currentHandoffLines': len(handoff.splitlines()), 'currentNextStepCount': 1,
    'changedExistingMarkdown': changed, 'newProjectMarkdown': sorted(expected_new),
    'currentContractAssertions': checks, 'gitDiffCheckExit': diff_check.returncode,
    'failures': failures, 'passed': not failures,
}
(QA / 'validation.json').write_text(json.dumps(result, indent=2, ensure_ascii=False) + '\n')
print(json.dumps({k:v for k,v in result.items() if k not in ('changedExistingMarkdown', 'currentContractAssertions')}, ensure_ascii=False, indent=2))
raise SystemExit(0 if result['passed'] else 1)
