import ast
import json
import re
from pathlib import Path

catalog_path = Path('/home/ubuntu/doctor-farmer-quiz/client/src/data/priceCatalog.ts')
text = catalog_path.read_text(encoding='utf-8')

# Extract the exported array, which is valid Python literal syntax apart from the TS wrapper.
match = re.search(r"export const PRICE_CATALOG: PriceItem\[\] = (\[.*\]);\s*$", text, re.S)
if not match:
    raise SystemExit('PRICE_CATALOG array not found')
array_text = match.group(1)
items = ast.literal_eval(array_text)

if len(items) != 68:
    raise SystemExit(f'Expected 68 items, got {len(items)}')

# Current groups and suspicious entries are reported without changing source data.
current_counts = {}
for item in items:
    current_counts[item['group']] = current_counts.get(item['group'], 0) + 1

report = {
    'total': len(items),
    'current_group_counts': current_counts,
    'items': items,
}
Path('/home/ubuntu/doctor-farmer-quiz/catalog_inventory.json').write_text(
    json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8'
)

print(f'Total items: {len(items)}')
print('Current groups:')
for group, count in sorted(current_counts.items()):
    print(f'  {group}: {count}')
print('\nInventory:')
for i, item in enumerate(items, 1):
    print(f"{i:02d}. {item['name']} | group={item['group']} | dv={item['dv']} | rate={item['rate']}")
