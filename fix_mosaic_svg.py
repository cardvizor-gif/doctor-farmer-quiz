with open('/home/ubuntu/doctor-farmer-quiz/client/src/pages/Dashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Определим массив различных агрономических SVG путей для разных культур (пшеница, кукуруза, росток, лист, колос, семена)
svg_paths = [
    # Колос / Пшеница
    '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />',
    # Росток / Культура
    '<path d="M12 22V12M12 12C12 7 7 4 2 6c0 5 3 9 10 6zM12 12c0-5 5-8 10-6 0 5-3 9-10 6z" />',
    # Лист / Подсолнечник
    '<path d="M2 22s4-15 10-15 10 15 10 15-4-2-10-2-10 2-10 2zM12 7v15" />',
    # Поле / Стебель
    '<path d="M12 2a10 10 0 0 1 7.5 16.5M12 2a10 10 0 0 0-7.5 16.5M12 12v10" />',
]

# Вместо жесткого одного пути сделаем маппинг по индексу в Dashboard.tsx
old_svg = '''<svg className="w-full h-full text-[#194f38]/60 p-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>'''

new_svg_dynamic = '''<svg className="w-full h-full text-[#194f38]/50 p-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  {index % 4 === 0 && <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />}
                  {index % 4 === 1 && <path d="M12 22V12C12 7 8 4 4 6c1 5 4 8 8 6zm0 0c0-5 4-8 8-6-1 5-4 8-8 6z" />}
                  {index % 4 === 2 && <path d="M2 22s3-10 10-10 10 10 10 10-3-2-10-2-10 2-10 2zM12 12v10" />}
                  {index % 4 === 3 && <path d="M12 2a10 10 0 0 1 7 17M12 2a10 10 0 0 0-7 17M12 10v12" />}
                </svg>'''

if old_svg in content:
    content = content.replace(old_svg, new_svg_dynamic)
    with open('/home/ubuntu/doctor-farmer-quiz/client/src/pages/Dashboard.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Мозаика успешно заменена на разнообразные агрономические SVG!')
else:
    print('Не найден старый SVG блок')
