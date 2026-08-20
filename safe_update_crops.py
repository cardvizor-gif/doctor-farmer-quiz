with open('/home/ubuntu/doctor-farmer-quiz/client/src/pages/Dashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Аккуратно заменим рендер иконок в массиве мозаики
# Нам нужно заменить svg внутри мозаики или блок с иконками
old_svg_block = '''<svg className="w-full h-full text-[#194f38]/50 p-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  {index % 4 === 0 && <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />}
                  {index % 4 === 1 && <path d="M12 22V12C12 7 8 4 4 6c1 5 4 8 8 6zm0 0c0-5 4-8 8-6-1 5-4 8-8 6z" />}
                  {index % 4 === 2 && <path d="M2 22s3-10 10-10 10 10 10 10-3-2-10-2-10 2-10 2zM12 12v10" />}
                  {index % 4 === 3 && <path d="M12 2a10 10 0 0 1 7 17M12 2a10 10 0 0 0-7 17M12 10v12" />}
                </svg>'''

new_img_block = '''<img src={
                  index % 5 === 0 ? "/crops/oats.png" :
                  index % 5 === 1 ? "/crops/corn.png" :
                  index % 5 === 2 ? "/crops/pea.png" :
                  index % 5 === 3 ? "/crops/rapeseed.png" : "/crops/barley.png"
                } alt="Crop icon" className="h-full w-full object-contain filter brightness-90 drop-shadow-[0_2px_4px_rgba(25,79,56,0.1)]" />'''

if old_svg_block in content:
    content = content.replace(old_svg_block, new_img_block)
    # Также обновим текст в массиве map, если там были просто названия
    content = content.replace('["Пшеница", "Ячмень", "Кукуруза", "Овёс", "Рапс", "Подсолнечник", "Горох", "Кукуруза", "Овёс", "Подсолнечник", "Рапс", "Ячмень"]', '["oats", "corn", "pea", "rapeseed", "barley", "oats", "corn", "pea", "rapeseed", "barley", "oats", "corn"]')
    with open('/home/ubuntu/doctor-farmer-quiz/client/src/pages/Dashboard.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Мозаика успешно обновлена на пользовательские картинки культур!')
else:
    print('Старый SVG блок не найден')
