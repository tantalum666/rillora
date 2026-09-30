import json
import sys
from pathlib import Path

root = Path(__file__).parent
chunks = json.loads((root / 'reading-chunks.json').read_text())
ledger_path = root / 'reading.json'
ledger = json.loads(ledger_path.read_text())

def indexes(value):
    for item in value.split(','):
        if not item:
            continue
        parts = item.split('-')
        yield from range(int(parts[0]), int(parts[-1]) + 1)

for index in indexes(sys.argv[1]):
    chunk = chunks[index]
    if not any(entry['chunk'] == index for entry in ledger['read']):
        ledger['read'].append(dict(chunk=index, path=chunk['path'], start=chunk['start'], end=chunk['end']))
ledger_path.write_text(json.dumps(ledger, ensure_ascii=False, indent=2))
for index in indexes(sys.argv[2]):
    chunk = chunks[index]
    print(f"READ CHUNK {index}: {chunk['path']} lines {chunk['start']}-{chunk['end']}\n{chunk['text']}\nEND CHUNK {index}")
