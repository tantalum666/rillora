"""Classify project work without treating credentials or machine caches as deliverables."""
from __future__ import annotations
from pathlib import PurePosixPath

PRIVATE_DIRS = {'.local-secrets', '.secrets', '.auth0', '.aws'}
CACHE_DIRS = {'.git', 'node_modules', '.build', '.swiftpm', 'SourcePackages', 'checkouts',
              'vendor', '__pycache__', 'ModuleCache.noindex', 'Index.noindex',
              'SDKStatCaches.noindex', 'ClangStatCache.noindex', 'Intermediates.noindex'}
PRIVATE_SUFFIXES = {'.p8', '.p12', '.pfx', '.key', '.jks', '.keychain', '.dump', '.db', '.sqlite', '.sqlite3'}
TEXT_SUFFIXES = {'.md', '.txt', '.json', '.jsonl', '.csv', '.tsv', '.log', '.py', '.sh', '.mjs',
                 '.cjs', '.js', '.jsx', '.ts', '.tsx', '.swift', '.sql', '.html', '.css', '.yml',
                 '.yaml', '.toml', '.xml', '.plist', '.svg', '.patch', '.xcscheme', '.pbxproj', '.resolved'}

def directory_exclusion(path: str) -> str | None:
    parts = PurePosixPath(path).parts
    if any(p in PRIVATE_DIRS for p in parts):
        return 'credentials_or_protected_identity_state'
    if any(p in CACHE_DIRS for p in parts):
        return 'reproducible_dependency_or_editor_cache'
    if any(p.lower().startswith(('derived', '.derived', '.release-derived', '.xcodebuildmcp-derived')) for p in parts):
        return 'reproducible_xcode_cache'
    if any(p in {'simctl_diagnostics', 'sysdiagnose', 'xcuserdata'} or p.endswith('.logarchive') for p in parts):
        return 'machine_wide_diagnostics_or_personal_ide_state'
    if parts[:2] in [('.local', 'backups'), ('.local', 'dns-backups'), ('.local', 'recovery')]:
        return 'protected_database_or_provider_backup'
    if parts[:2] == ('.local', 'github-preflight'):
        return 'duplicate_publication_mirror'
    if any(p.startswith('asset.') and len(p.split('.')[-1]) >= 32 for p in parts):
        return 'expanded_deployment_asset_copy'
    if any(p == 'Build' for p in parts) and not any(p.endswith('.xcarchive') for p in parts):
        return 'reproducible_compiler_output'
    return None

def file_exclusion(path: str) -> str | None:
    p = PurePosixPath(path)
    if p.name in {'.DS_Store', '.npmrc', '.env'} or (p.name.startswith('.env.') and p.name not in {'.env.example', '.env.sample'}):
        return 'credentials_or_machine_configuration'
    in_result_package = any(part.endswith(('.xcresult', '.xcarchive')) for part in p.parts)
    suffixes = PRIVATE_SUFFIXES - {'.db', '.sqlite', '.sqlite3'} if in_result_package else PRIVATE_SUFFIXES
    if p.suffix.lower() in suffixes or p.name.endswith(('.sql.gz', '.dump.gz', '.pyc')):
        return 'private_key_database_or_cache'
    if p.name.lower().startswith(('storage-state', 'auth-state', 'cookies.')):
        return 'browser_authentication_state'
    return None

def readable_text(path: str) -> bool:
    return PurePosixPath(path).suffix.lower() in TEXT_SUFFIXES

def readable_binary(path: str) -> bool:
    # Approved/created presentation assets, not arbitrary authenticated screenshots.
    return path.startswith(('output/brand/', 'output/imagegen/', 'output/logo-research/',
                            'output/release/rillora-store-design-20260930/',
                            'output/release/rillora-20260930/screenshots/',
                            'output/release/rillora-20260930/raw-screenshots/'))

def public_path(path: str) -> str:
    p = PurePosixPath(path)
    if p.name in {'AGENTS.md', 'SKILL.md', 'SECURITY.md'}:
        path += '.reference.txt'
    elif p.suffix == '.log':
        path += '.txt'
    return 'collaboration/evidence/' + path
