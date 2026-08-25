with open('/home/ubuntu/doctor-farmer-quiz/client/src/pages/Dashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

new_mosaic = '''<div className="absolute inset-0 grid grid-cols-3 sm:grid-cols-4 grid-rows-3 gap-3 sm:gap-6 p-5 sm:p-8 opacity-[0.16]">
            {[
              "Пшеница", "Ячмень", "Кукуруза", "Овёс", "Рапс", "Подсолнечник", "Горох", "Кукуруза", "Овёс", "Подсолнечник", "Рапс", "Ячмень"
            ].map((name, index) => (
              <div key={`${name}-${index}`} className={`flex items-center justify-center text-[#194f38] ${index % 3 === 1 ? "translate-y-3 sm:translate-y-5" : ""}`}>
                <svg className="w-12 h-12 sm:w-16 sm:h-16 text-[#194f38]/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
            ))}
          </div>'''

import re
inner_pattern = r'<div className="absolute inset-0 grid grid-cols-3.*?</div>\s*</div>'
if re.search(inner_pattern, content, re.DOTALL):
    content = re.sub(inner_pattern, new_mosaic, content, flags=re.DOTALL)
    with open('/home/ubuntu/doctor-farmer-quiz/client/src/pages/Dashboard.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Мозаика успешно обновлена на SVG!')
else:
    print('Паттерн не найден')
