#!/usr/bin/env python3
"""Run reviewed Rillora checks locally; never dispatch Actions or deploy anything."""
from __future__ import annotations
import argparse
import datetime
import hashlib
import json
import os
from pathlib import Path
import re
import signal
import subprocess
import tempfile
import time

ROOT = Path(__file__).resolve().parents[2]
PLAN = Path(__file__).with_name('checks.json')


def clean_environment(source):
    # No ambient database URLs, provider keys, NODE_OPTIONS or shell startup hooks.
    result = {key: source[key] for key in
              ('PATH', 'HOME', 'USER', 'LOGNAME', 'TMPDIR', 'LANG', 'LC_ALL', 'DEVELOPER_DIR') if key in source}
    result.update(CI='1', AWS_EC2_METADATA_DISABLED='true',
                  AWS_SHARED_CREDENTIALS_FILE=os.devnull, AWS_CONFIG_FILE=os.devnull,
                  GIT_LFS_SKIP_SMUDGE='1', GIT_TERMINAL_PROMPT='0')
    return result


def cloud_policy(root):
    directory = root / '.github/workflows'
    active = sorted(str(p.relative_to(root)) for p in directory.glob('*')
                    if p.suffix.lower() in ('.yml', '.yaml'))
    if active:
        raise ValueError('Cloud workflow definitions must remain inactive: ' + ', '.join(active))


def exact_base(root, value):
    if not re.fullmatch(r'[0-9a-f]{40}', value):
        raise ValueError('Supply the exact reviewed base SHA, not a moving ref')
    subprocess.run(['git', 'cat-file', '-e', value + '^{commit}'], cwd=root, check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return value


def run_step(command, cwd, env, log, timeout):
    """Fail closed on errors/timeouts; stop descendants such as local test servers."""
    started = time.monotonic()
    with log.open('xb') as output:
        os.chmod(log, 0o600)
        process = subprocess.Popen(command, cwd=cwd, env=env, stdout=output,
                                   stderr=subprocess.STDOUT, start_new_session=True)
        timed_out = False
        try:
            code = process.wait(timeout=timeout)
        except (subprocess.TimeoutExpired, KeyboardInterrupt):
            timed_out = True
            os.killpg(process.pid, signal.SIGTERM)
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                os.killpg(process.pid, signal.SIGKILL)
                process.wait()
            code = 124
    return {'exitCode': code, 'timedOut': timed_out,
            'seconds': round(time.monotonic() - started, 3),
            'log': log.name, 'logSha256': hashlib.sha256(log.read_bytes()).hexdigest()}


def trusted_guard(root, base, report, env, execute):
    # A local shared clone borrows immutable Git objects, never credentials or
    # a candidate's scanner. Only these reviewed base files are checked out.
    with tempfile.TemporaryDirectory(prefix='rillora-base-guard-') as temp:
        policy = Path(temp) / 'policy'
        execute('Prepare trusted policy repository', ['git', 'clone', '--quiet', '--shared', '--no-checkout', str(root), str(policy)], root)
        execute('Read immutable base policy', ['git', 'checkout', base, '--', 'tools/release', 'tools/collaboration', 'config/repository-scan-exceptions.json'], policy)
        execute('Prepare candidate without executing it', ['python3', str(policy / 'tools/release/prepare_repository.py'), '--repository', str(root), '--report', str(report / 'source-inventory.json')], root)
        execute('Scan source with base exception authority', ['python3', str(policy / 'tools/release/scan_repository.py'), '--source', str(root / '.local/github-preflight/source'), '--exception-base-ref', base, '--report', str(report / 'source-scan.json')], root)
        execute('Verify complete readable publication', ['python3', str(policy / 'tools/collaboration/verify_publication.py'), '--root', str(root), '--scan', '--report', str(report / 'publication-scan.json')], root)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--trusted-base', required=True, help='Exact reviewed main/base commit')
    parser.add_argument('--group', action='append', choices=['source', 'api', 'web-and-infrastructure', 'browser', 'native-modules'], default=[])
    parser.add_argument('--report-dir', type=Path, required=True, help='New directory under output/qa/')
    parser.add_argument('--pg-port', type=int, default=5432, help='Existing dedicated loopback test PostgreSQL; never creates/marks databases')
    parser.add_argument('--browser-channel', choices=['chrome', 'chromium'], default='chrome')
    parser.add_argument('--timeout', type=int, default=1200, help='Per-step seconds; a timeout fails')
    parser.add_argument('--plan', action='store_true', help='Show commands without running checks')
    args = parser.parse_args()
    base = exact_base(ROOT, args.trusted_base)
    cloud_policy(ROOT)
    if not 1 <= args.pg_port <= 65535 or not 1 <= args.timeout <= 3600:
        parser.error('Invalid local port or timeout')
    plan = json.loads(PLAN.read_text())['groups']
    groups = list(dict.fromkeys(args.group))
    if args.plan:
        print(json.dumps({'guard': 'base-owned source and publication checks always run',
                          'trustedBase': base, 'groups': {g: plan[g] for g in groups}}, indent=2))
        return 0
    report = args.report_dir.resolve()
    if not report.is_relative_to(ROOT / 'output/qa'):
        parser.error('Reports must be under this repository output/qa/')
    report.mkdir(parents=True, exist_ok=False)
    os.chmod(report, 0o700)
    env = clean_environment(os.environ)
    env.update(PGHOST='127.0.0.1', PGPORT=str(args.pg_port))
    if args.browser_channel == 'chrome':
        env['RILLORA_TEST_BROWSER_CHANNEL'] = 'chrome'
    results = []
    receipt = {'startedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
               'head': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
               'trackedDiffSha256': hashlib.sha256(subprocess.check_output(['git', 'diff', 'HEAD', '--binary'], cwd=ROOT)).hexdigest(),
               'planSha256': hashlib.sha256(PLAN.read_bytes()).hexdigest(),
               'runnerSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
               'trustedBase': base, 'groups': groups, 'execution': 'local', 'steps': results,
               'boundary': 'Selected groups only; no cloud run, deployment, device acceptance or release claim.'}

    def execute(name, command, cwd, extra_env=None):
        print(name, flush=True)
        result = run_step(command, cwd, {**env, **(extra_env or {})}, report / f'{len(results):02}.log', args.timeout)
        results.append({'name': name, **result})
        if result['exitCode']:
            raise RuntimeError(f'{name} failed; see {result["log"]}')

    try:
        execute('Verify pinned scanner', ['bash', '--noprofile', '--norc', '-euo', 'pipefail', '-c', 'test "$(gitleaks version)" = "8.30.1"'], ROOT)
        trusted_guard(ROOT, base, report, env, execute)
        if any(g in groups for g in ('api', 'web-and-infrastructure', 'browser')):
            execute('Verify pinned Node runtime', ['bash', '--noprofile', '--norc', '-euo', 'pipefail', '-c', 'test "$(node --version)" = "v22.23.4"'], ROOT)
        for group in groups:
            for step in plan[group]:
                cwd = (ROOT / step['cwd']).resolve()
                if not cwd.is_relative_to(ROOT):
                    raise ValueError('Check directory escapes repository')
                execute(group + ': ' + step['name'], ['bash', '--noprofile', '--norc', '-euo', 'pipefail', '-c', step['command']], cwd, step.get('env'))
        receipt['passed'] = True
    except (RuntimeError, ValueError, OSError, subprocess.CalledProcessError) as error:
        receipt['passed'] = False
        receipt['error'] = str(error)
    finally:
        receipt['finishedAt'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        (report / 'result.json').write_text(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps({'passed': receipt['passed'], 'report': str(report / 'result.json')}))
    return 0 if receipt['passed'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
