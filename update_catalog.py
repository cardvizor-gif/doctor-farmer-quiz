import re

path = '/home/ubuntu/doctor-farmer-quiz/client/src/data/priceCatalog.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

regs = {
    'Актеон, ВР': {
        'phase': 'Опрыскивание посевов рапса в ранние фазы роста сорных растений (2-4 листа) и розетки у многолетников.',
        'objects': 'Комплекс однолетних и многолетних двудольных сорняков',
        'conditions': 'Расход рабочей жидкости 50-300 л/га. Температура применения от +10°C до +25°C.',
        'restrictions': 'Не проводить обработку при выпадении росы или осадков.'
    },
    'Битрин, КС': {
        'phase': 'Опрыскивание вегетирующих растений в период появления вредителей.',
        'objects': 'Комплекс почвенных и наземных вредителей',
        'conditions': 'Расход рабочей жидкости 200-400 л/га.',
        'restrictions': 'Соблюдать регламент безопасности и сроки ожидания.'
    },
    'Богдэн, ВДГ': {
        'phase': 'Опрыскивание посевов зерновых в фазу 2-3 листьев – выхода в трубку; подсолнечник в фазу 2-8 листьев.',
        'objects': 'Однолетние и некоторые многолетние двудольные сорняки',
        'conditions': 'Применять совместно с ПАВ для усиления гербицидного эффекта.',
        'restrictions': 'Не применять на культурах в состоянии стресса.'
    },
    'Вернер, КС': {
        'phase': 'Опрыскивание в период вегетации; против фузариоза колоса в фазу конец колошения – начало цветения.',
        'objects': 'Мучнистая роса, ржавчины, септориоз, пиренофороз, фузариоз колоса, альтернариоз, фомоз',
        'conditions': 'Расход рабочей жидкости 300-400 л/га.',
        'restrictions': 'Срок ожидания 40 дней. Кратность обработок — 1-2.'
    },
    'Гласис, ВР': {
        'phase': 'Введение в рабочий раствор в первую очередь перед добавлением пестицидов.',
        'objects': 'Коррекция pH воды, снижение солей жесткости, увеличение проникающей способности',
        'conditions': 'Дозировка 0,8-2,5 л/1000 л (до изменения цвета воды на малиновый или pH 5,5).',
        'restrictions': 'Регулятор кислотности всегда заливается первым в баковую смесь!'
    }
}

# We can parse the file using python or regex substitution
# Let's inspect how items are written in PRICE_CATALOG
# Each item is a dict like {'name': '...', 'dv': '...', ...}
# We can replace or add 'regulation': {...} to each matched item.

for name, reg in regs.items():
    # Find item block starting with {'name': 'name', ...}
    # Let's find the exact item substring
    escaped_name = re.escape(name)
    pattern = r"(\{\s*'name':\s*'" + escaped_name + r"'[^}]*)\}"
    
    def repl(m):
        block = m.group(1)
        if 'regulation:' in block:
            # update existing regulation
            return block + '}'
        else:
            reg_str = f", 'regulation': {{ 'phase': '{reg['phase']}', 'objects': '{reg['objects']}', 'conditions': '{reg['conditions']}', 'restrictions': '{reg['restrictions']}' }}"
            return block + reg_str + '}'

    content, count = re.subn(pattern, repl, content)
    print(f'Updated {name}: {count} replacements')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Catalog update completed successfully.')
