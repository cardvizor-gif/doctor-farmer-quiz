with open('/home/ubuntu/doctor-farmer-quiz/client/src/pages/Dashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Импортируем иконки в начале файла если нужно, либо используем прямые относительные пути public / импорты
# В Vite файлы из src/assets можно импортировать или положить в public/crops
# Давайте перенесем обработанные иконки в client/public/crops, чтобы они были доступны по простому URL /crops/oats.png
import shutil
import os

os.makedirs('/home/ubuntu/doctor-farmer-quiz/client/public/crops', exist_ok=True)
for name in ['oats.png', 'corn.png', 'pea.png', 'rapeseed.png', 'barley.png']:
    src = f'/home/ubuntu/doctor-farmer-quiz/client/src/assets/crops/{name}'
    dst = f'/home/ubuntu/doctor-farmer-quiz/client/public/crops/{name}'
    if os.path.exists(src):
        shutil.copyfile(src, dst)

new_mosaic = '''<div className="absolute inset-0 grid grid-cols-3 sm:grid-cols-4 grid-rows-3 gap-4 sm:gap-8 p-6 sm:p-10 opacity-[0.16] pointer-events-none">
            {[
              "/crops/oats.png", "/crops/corn.png", "/crops/pea.png", "/crops/rapeseed.png",
              "/crops/barley.png", "/crops/oats.png", "/crops/corn.png", "/crops/pea.png",
              "/crops/rapeseed.png", "/crops/barley.png", "/crops/oats.png", "/crops/corn.png"
            ].map((src, index) => (
              <div key={`${src}-${index}`} className={`flex items-center justify-center ${index % 3 === 1 ? "translate-y-4 sm:translate-y-6" : ""}`}>
                <img src={src} alt="Crop icon" className="h-14 w-14 sm:h-20 sm:w-20 object-contain filter drop-shadow-[0_2px_8px_rgba(25,79,56,0.15)]" />
              </div>
            ))}
          </div>'''

import re
# Заменим блок мозаики
pattern = r'<div className="absolute inset-0 grid grid-cols-3.*?(?=</div>\s*</div>\s*</section>)'
# Найдем точнее по div сетки
match_div = re.search(r'<div className="absolute inset-0 grid grid-cols-3.*?</div\s*>\s*</div>', content, re.DOTALL)
if match_div:
    content = content.replace(match_div.group(0), new_mosaic)
    with open('/home/ubuntu/doctor-farmer-quiz/client/src/pages/Dashboard.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Мозаика успешно обновлена на пользовательские иконки культур!')
else:
    print('Паттерн мозаики не найден')
