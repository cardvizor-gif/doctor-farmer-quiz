import ast
import json
import re
import shutil
from collections import Counter
from pathlib import Path

CATALOG_PATH = Path('/home/ubuntu/doctor-farmer-quiz/client/src/data/priceCatalog.ts')
BACKUP_PATH = Path('/home/ubuntu/doctor-farmer-quiz/client/src/data/priceCatalog.ts.before-classification')
REPORT_PATH = Path('/home/ubuntu/doctor-farmer-quiz/classification_audit.json')

HERBICIDES = {
    'КлопЭфир Интенсив', 'КлопЭфир Микс', 'Триатлон Плюс', 'Триатлон Экстра',
    'Адвокат, ВР', 'Актеон супер*, ВР', 'Актеон, ВР', 'Царумин, ВРК',
    'Богдэн, ВДГ', 'Р-Прадо/Гольф, ВРК', 'Гуарил, ВДГ', 'Ибис, ЭМВ',
    'Софт, КЭ', 'Клегал, МКЭ', 'КлопЭфир, КЭ', 'Кратерр, КС', 'МетАлт, ВДГ',
    'Орель, ВР', 'Р-Галситил, КЭ', 'Злак Супер, КЭ', 'Ромул, ВДГ',
    'Сикурс, ВР', 'Стратег, КС', 'Сотейра, ВРК', 'Кэйталин, ВР',
    'Кэйталин Экстра, ВДГ', 'Тайпан, КЭ', 'Трастер, КЭ*', 'Тифи, ВДГ',
    'Флагман, КС', 'Фомус, ВР', 'Элант, КЭ', 'Элант Премиум, КЭ',
    'Элант Экстра, СЭ', 'ЭтилФло, СЭ'
}

INSECTICIDES = {'Алтын, КЭ', 'Цунами, КЭ', 'Фэнс, КЭ', 'Тиматерр, КС', 'Тайсон, КС*', 'Фэнсди, КС'}
FUNGICIDES = {'Вернер, КС', 'Кардон, КС', 'Рекрут, КС', 'Р-Ципрос, КЭ', 'ПроТэб, КМЭ'}
FUNGICIDE_SEED_TREATMENTS = {'Меклонил, МЭ*', 'Редут, КС', 'Турион, КЭ'}
INSECTICIDE_SEED_TREATMENTS = {'Форсер Энто, КС', 'Тиматерр, КС (красный)', 'Битрин, КС', 'Битрин, КС* (с краской)'}
FERTILIZERS = {
    'Контур, ВР', 'Контур Антистресс, ВР', 'Контур Аргент, ВР',
    'Контур Профи, ВР', 'Контур Рост, ВР', 'Контур Старт, ВР', 'Янтарная к-та, ВР'
}
ADJUVANTS = {'Гласис, ВР', 'Неон-99', 'Неон-99 Турбо', 'Тесил, ВР'}


def parse_items(text):
    match = re.search(r"export const PRICE_CATALOG: PriceItem\[\] = (\[.*\]);\s*$", text, re.S)
    if not match:
        raise RuntimeError('PRICE_CATALOG array not found')
    return match, ast.literal_eval(match.group(1))


def classify(item):
    name = item['name']
    if name in FERTILIZERS:
        return 'Удобрения и биостимуляторы'
    if name in ADJUVANTS:
        return 'Адъюванты и ПАВ'
    if name == 'Ламонд, ВР':
        return 'Десиканты'
    if name == 'Фосфин, ТАБ':
        return 'Фумиганты'
    if name == 'Кардон, КС':
        return 'Протравители — фунгициды' if item['rate'] == '0,3-0,6' else 'Фунгициды'
    if name in FUNGICIDE_SEED_TREATMENTS:
        return 'Протравители — фунгициды'
    if name in INSECTICIDE_SEED_TREATMENTS:
        return 'Протравители — инсектициды'
    if name in HERBICIDES:
        return 'Гербициды'
    if name in INSECTICIDES:
        return 'Инсектициды'
    if name in FUNGICIDES:
        return 'Фунгициды'
    raise RuntimeError(f'No classification rule for: {name}')


text = CATALOG_PATH.read_text(encoding='utf-8')
match, items = parse_items(text)
if len(items) != 68:
    raise RuntimeError(f'Expected 68 catalog items before update, found {len(items)}')

classified = []
for index, item in enumerate(items, 1):
    new_group = classify(item)
    new_category = 'УДОБРЕНИЯ И БИОСТИМУЛЯТОРЫ' if new_group == 'Удобрения и биостимуляторы' else ('АДЪЮВАНТЫ И ПАВ' if new_group == 'Адъюванты и ПАВ' else 'СРЕДСТВА ЗАЩИТЫ РАСТЕНИЙ')
    classified.append({
        'index': index,
        'name': item['name'],
        'old_group': item['group'],
        'new_group': new_group,
        'old_category': item['category'],
        'new_category': new_category,
        'dv': item['dv'],
        'rate': item['rate'],
    })
    item['group'] = new_group
    item['category'] = new_category

if not BACKUP_PATH.exists():
    shutil.copy2(CATALOG_PATH, BACKUP_PATH)

new_array = repr(items)
new_text = text[:match.start(1)] + new_array + text[match.end(1):]
CATALOG_PATH.write_text(new_text, encoding='utf-8')

report = {
    'total_before': len(items),
    'total_after': len(items),
    'group_counts': dict(Counter(row['new_group'] for row in classified)),
    'category_counts': dict(Counter(row['new_category'] for row in classified)),
    'items': classified,
}
REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(report['group_counts'], ensure_ascii=False, sort_keys=True))
print(f'Updated {len(items)} items; backup={BACKUP_PATH}')
