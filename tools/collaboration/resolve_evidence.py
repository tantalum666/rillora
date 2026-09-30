#!/usr/bin/env python3
"""Find a historical output path in the complete Git collaboration catalog."""
import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('path', help='Original project-relative path or directory prefix')
args = parser.parse_args()
summary = json.loads((ROOT / 'collaboration/snapshot.json').read_text())
matches = [record for file in summary['catalogFiles'] for record in json.loads((ROOT / file).read_text())
           if record['sourcePath'] == args.path or record['sourcePath'].startswith(args.path.rstrip('/') + '/')]
print(json.dumps(matches, ensure_ascii=False, indent=2))
raise SystemExit(0 if matches else 1)
