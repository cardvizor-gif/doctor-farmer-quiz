import ast
import re
from collections import Counter
from pathlib import Path

catalog = Path('/home/ubuntu/doctor-farmer-quiz/client/src/data/priceCatalog.ts').read_text(encoding='utf-8')
array = re.search(r"export const PRICE_CATALOG: PriceItem\[\] = (\[.*\]);\s*$", catalog, re.S)
if not array:
    raise SystemExit('Catalog array not found')
items = ast.literal_eval(array.group(1))
assert len(items) == 68, len(items)
assert all(item['group'] != 'Удобрение' for item in items if 'Фипронил' in item['dv'] or 'Бифентрин' in item['dv'])
assert not any(item['group'] == 'Удобрение' for item in items if any(token in item['dv'].lower() for token in ['глифосат', 'трибенурон', 'флорасулам', 'тиаметоксам', 'тебуконазол', 'карбендазим', 'фипронил']))
ui = Path('/home/ubuntu/doctor-farmer-quiz/client/src/pages/KnowledgeBase.tsx').read_text(encoding='utf-8')
assert 'Из прайса' not in ui
print('COUNT=68')
for group, count in sorted(Counter(item['group'] for item in items).items()):
    print(f'{group}: {count}')
print('BITRIN_GROUPS:')
for item in items:
    if item['name'].startswith('Битрин'):
        print(f"  {item['name']} -> {item['group']}")
print('UI_SOURCE_LABEL_REMOVED=yes')
