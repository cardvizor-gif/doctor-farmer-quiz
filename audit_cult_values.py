import ast
import json
import re
from pathlib import Path

path = Path('/home/ubuntu/doctor-farmer-quiz/client/src/data/drugs.ts')
text = path.read_text(encoding='utf-8')
match = re.search(r"export const DRUGS = (\[.*?\]) as const;", text, re.S)
if not match:
    raise RuntimeError('DRUGS array not found')
drugs = ast.literal_eval(match.group(1))
print('TOTAL', len(drugs))
for drug in drugs:
    cult = drug.get('cult', '')
    print(json.dumps({'name': drug['name'], 'group': drug['group'], 'cult': cult}, ensure_ascii=False))
