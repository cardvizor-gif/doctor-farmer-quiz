with open('/home/ubuntu/doctor-farmer-quiz/client/src/pages/Dashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Заменим каждую строку в массиве на простую SVG-иконку колоса, сохранив всю внешнюю обертку div
import re

# Найдем массив картинок в Dashboard.tsx
old_array_pattern = r'\[\s*\["/manus-storage/.*?\],?\s*\]\.map'
# Заменим картинки на SVG в рендере
old_img_block = '<img src={src} alt={alt} className="h-full w-full object-contain drop-shadow-[0_2px_6px_rgba(25,79,56,0.12)]" />'
new_svg_block = '''<svg className="w-full h-full text-[#194f38]/60 p-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>'''

if old_img_block in content:
    content = content.replace(old_img_block, new_svg_block)
    # также заменим список путей на список названий
    content = content.replace('"/manus-storage/df-green-wheat_icon_5f103e9a.png", "Пшеница"', '"Пшеница"')
    content = content.replace('"/manus-storage/df-green-barley_icon_4f609506.png", "Ячмень"', '"Ячмень"')
    content = content.replace('"/manus-storage/df-green-corn_icon_6c35bf86.png", "Кукуруза"', '"Кукуруза"')
    content = content.replace('"/manus-storage/df-green-oats_icon_f913a11f.png", "Овёс"', '"Овёс"')
    content = content.replace('"/manus-storage/df-green-rapeseed_icon_f8c194b4.png", "Рапс"', '"Рапс"')
    content = content.replace('"/manus-storage/df-green-sunflower_icon_011ba21e.png", "Подсолнечник"', '"Подсолнечник"')
    content = content.replace('"/manus-storage/df-green-pea_icon_fa7f50ea.png", "Горох"', '"Горох"')
    
    # заменим map деструктуризацию ([src, alt], index) на (name, index)
    content = content.replace('.map(([src, alt], index) => (', '.map((name, index) => (')
    content = content.replace('key={`${src}-${index}`}', 'key={`${name}-${index}`}')
    
    with open('/home/ubuntu/doctor-farmer-quiz/client/src/pages/Dashboard.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Успешно заменено на встроенные SVG в Dashboard.tsx!')
else:
    print('Не найден тег img мозаики')
