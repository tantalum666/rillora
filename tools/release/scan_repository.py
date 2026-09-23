#!/usr/bin/env python3
"""Scan a prepared source tree, allowing only reviewed, unchanged source spans."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile


def classify(findings, source, exceptions):
    unknown, accepted = [], []
    source = source.resolve()
    for finding in findings:
        candidate = Path(finding['File'])
        if not candidate.is_absolute():
            candidate = Path.cwd() / candidate
        candidate = candidate.resolve()
        if source not in candidate.parents:
            unknown.append({'rule': finding['RuleID'], 'path': '<outside source>'})
            continue
        relative = str(candidate.relative_to(source))
        lines = candidate.read_text().splitlines(keepends=True)
        start, end = finding['StartLine'], finding['EndLine']
        digest = hashlib.sha256(''.join(lines[start-1:end]).encode()).hexdigest()
        matches = [item for item in exceptions
                   if item['path'] == relative and item['rule'] == finding['RuleID']
                   and item['startLine'] == start and item['endLine'] == end
                   and item['sourceSpanSha256'] == digest]
        result = {'rule': finding['RuleID'], 'path': relative, 'startLine': start,
                  'endLine': end, 'sourceSpanSha256': digest}
        if len(matches) == 1:
            accepted.append({**result, 'reason': matches[0]['reason']})
        else:
            unknown.append(result)
    return accepted, unknown


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=Path('.local/github-preflight/source'))
    parser.add_argument('--report', type=Path, required=True)
    args = parser.parse_args()
    source = args.source.resolve()
    exceptions = json.loads((source/'config/repository-scan-exceptions.json').read_text())['findings']
    with tempfile.TemporaryDirectory(prefix='rillora-source-scan-') as temp:
        raw = Path(temp)/'findings.json'
        scan = subprocess.run(['gitleaks','dir',str(source),'--redact=100','--no-banner',
                               '--report-format','json','--report-path',str(raw)],capture_output=True,text=True)
        if scan.returncode not in (0, 1) or not raw.is_file():
            raise SystemExit('Secret scan failed; source must not be published')
        findings = json.loads(raw.read_text())
        accepted, unknown = classify(findings, source, exceptions)
    result = {'scanner': 'gitleaks', 'version': subprocess.check_output(['gitleaks','version'],text=True).strip(),
              'rawFindingCount': len(findings), 'reviewedNonSecrets': accepted,
              'unreviewedFindings': unknown, 'passed': not unknown,
              'boundary': 'A scoped source scan; not proof of absence of every possible secret or personal datum.'}
    args.report.parent.mkdir(parents=True,exist_ok=True)
    args.report.write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({'passed': result['passed'],'reviewedNonSecrets':len(accepted),'unreviewed':len(unknown)}))
    return 0 if result['passed'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
