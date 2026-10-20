#!/usr/bin/env python3
"""Scan a prepared source tree, allowing only reviewed, unchanged source spans."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile
import os
import re


def load_exceptions(source, trusted_base=None, repository=None):
    if trusted_base is not None:
        if not re.fullmatch(r'[0-9a-f]{40}', trusted_base):
            raise ValueError('Exception authority must be an exact trusted Git commit')
        raw = subprocess.check_output(['git', 'show', trusted_base + ':config/repository-scan-exceptions.json'], cwd=repository)
        return json.loads(raw)['findings']
    return json.loads((source / 'config/repository-scan-exceptions.json').read_text())['findings']


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
    parser.add_argument('--exception-base-ref', help='Exact protected base commit for pull-request exception authority')
    args = parser.parse_args()
    source = args.source.resolve()
    trusted_base = args.exception_base_ref
    if os.environ.get('GITHUB_EVENT_NAME') in ('pull_request', 'pull_request_target'):
        event = json.loads(Path(os.environ['GITHUB_EVENT_PATH']).read_text())
        expected = event['pull_request']['base']['sha']
        if trusted_base is not None and trusted_base != expected:
            raise SystemExit('Exception authority disagrees with the protected PR base')
        trusted_base = expected
    exceptions = load_exceptions(source, trusted_base, Path(__file__).resolve().parents[2])
    with tempfile.TemporaryDirectory(prefix='rillora-source-scan-') as temp:
        raw = Path(temp)/'findings.json'
        # Head-controlled config, ignore files and inline allow comments must
        # never replace the reviewed scanner/exception authority.
        rules = Path(temp)/'rules.toml'
        rules.write_text('[extend]\nuseDefault = true\n')
        ignored = Path(temp)/'empty.ignore'
        ignored.write_text('')
        scan = subprocess.run(['gitleaks','dir',str(source),'--redact=100','--no-banner',
                               '--config',str(rules),'--gitleaks-ignore-path',str(ignored),'--ignore-gitleaks-allow',
                               '--report-format','json','--report-path',str(raw)],capture_output=True,text=True)
        if scan.returncode not in (0, 1) or not raw.is_file():
            raise SystemExit('Secret scan failed; source must not be published')
        findings = json.loads(raw.read_text())
        accepted, unknown = classify(findings, source, exceptions)
    result = {'scanner': 'gitleaks', 'version': subprocess.check_output(['gitleaks','version'],text=True).strip(),
              'rawFindingCount': len(findings), 'reviewedNonSecrets': accepted,
              'unreviewedFindings': unknown, 'passed': not unknown,
              'exceptionAuthority': trusted_base or 'locally-reviewed-candidate',
              'boundary': 'A scoped source scan; not proof of absence of every possible secret or personal datum.'}
    args.report.parent.mkdir(parents=True,exist_ok=True)
    args.report.write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({'passed': result['passed'],'reviewedNonSecrets':len(accepted),'unreviewed':len(unknown)}))
    return 0 if result['passed'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
