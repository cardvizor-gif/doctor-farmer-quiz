import ast
import json
import re
from pathlib import Path

path = Path('/home/ubuntu/doctor-farmer-quiz/client/src/data/priceCatalog.ts')
text = path.read_text(encoding='utf-8')
match = re.search(r"export const PRICE_CATALOG: PriceItem\[\] = (\[.*\]);\s*$", text, re.S)
if not match:
    raise RuntimeError('PRICE_CATALOG array not found')
items = ast.literal_eval(match.group(1))
if len(items) != 68:
    raise RuntimeError(f'Expected exactly 68 items, found {len(items)}')

current = {}
for item in items:
    current[item['group']] = current.get(item['group'], 0) + 1

print(f'TOTAL={len(items)}')
print('GROUPS=' + json.dumps(current, ensure_ascii=False, sort_keys=True))
for index, item in enumerate(items, 1):
    print(json.dumps({
        'index': index,
        'name': item['name'],
        'dv': item['dv'],
        'rate': item['rate'],
        'group': item['group'],
        'cultures': item['cultures'],
    }, ensure_ascii=False))
