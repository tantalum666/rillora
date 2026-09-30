from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
import json,hashlib
root=Path(__file__).resolve().parents[3];q=Path(__file__).resolve().parent
changes=[]
for file in (q/'source-before').rglob('*'):
 if not file.is_file():continue
 relative=file.relative_to(q/'source-before');current=root/relative
 if current.exists() and current.read_bytes()!=file.read_bytes():changes.append(str(relative))
(q/'changed-existing-source.json').write_text(json.dumps(changes,indent=2)+'\n')
print('Changed existing source files:',len(changes))
