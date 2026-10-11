"""Tracked source must not disappear from security review through ignore rules."""
from pathlib import Path
import subprocess

PRIVATE_DIRECTORIES = {'.local-secrets', '.secrets', '.local'}


def tracked_source_paths(root: Path) -> set[str]:
    result = subprocess.run(['git', 'ls-files', '-z'], cwd=root, capture_output=True, check=True)
    paths = set()
    for name in result.stdout.decode().split('\0'):
        if not name or name.startswith('collaboration/'):
            # The separate publication manifest scans readable evidence and
            # verifies immutable encrypted originals; do not decrypt archives.
            continue
        relative = Path(name)
        if relative.is_absolute() or '..' in relative.parts or any(p in PRIVATE_DIRECTORIES for p in relative.parts):
            raise ValueError('Tracked private material is forbidden: ' + name)
        candidate = root / relative
        if candidate.is_symlink():
            raise ValueError('Tracked source symlink requires explicit review: ' + name)
        if candidate.is_file():
            paths.add(name)
    return paths
