import React from "react";
import { Link } from "wouter";
import { ArrowRight, ShieldCheck, Award, BookOpen, Layers } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans selection:bg-emerald-100">
      
      {/* Тонкая верхняя навигация по образцу */}
      <header className="w-full border-b border-gray-100 bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Логотип и название компании */}
          <div className="flex items-center gap-3">
            <img 
              src="/manus-storage/Screenshot_1_c8d1047c.png" 
              alt="Doctor Farmer" 
              className="w-10 h-10 object-contain" 
            />
            <span className="font-bold tracking-tight text-lg sm:text-xl text-gray-900 font-sans">
              Doctor Farmer
            </span>
          </div>

          {/* Меню навигации */}
          <nav className="hidden md:flex items-center space-x-8 text-sm text-gray-600 font-medium">
            <Link href="/agro-helper">
              <span className="cursor-pointer hover:text-emerald-700 transition-colors">АгроПомощник</span>
            </Link>
            <Link href="/quiz">
              <span className="cursor-pointer hover:text-emerald-700 transition-colors">Тест на знание прайса</span>
            </Link>
          </nav>

          {/* Правая кнопка */}
          <div className="flex items-center gap-4">
            <span className="hidden lg:inline-block text-xs font-mono text-gray-500 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
              Служебный комплекс
            </span>
            <Link href="/agro-helper">
              <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-6 py-2.5 rounded-full transition-all shadow-xs">
                Открыть АгроПомощник
              </button>
            </Link>
          </div>

        </div>
      </header>

      {/* Hero-секция с иллюстрацией узнаваемых сельскохозяйственных культур */}
      <section className="relative overflow-hidden pt-12 pb-24 md:pt-20 md:pb-32 bg-white flex-1 flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Левая часть: наш заголовок и кнопки перехода */}
          <div className="lg:col-span-6 space-y-6 z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold tracking-wide uppercase">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Рабочий кабинет команды
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-[1.12]">
              Профессиональная <br />
              <span className="text-emerald-700">экспертиза на поле</span>
            </h1>

            <p className="text-gray-600 text-base sm:text-lg max-w-lg leading-relaxed">
              Единый цифровой инструмент для точного подбора регламентов защиты растений и оперативной аттестации продуктовых знаний команды.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link href="/agro-helper">
                <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-base px-8 py-3.5 rounded-full transition-all shadow-md flex items-center justify-center gap-2 group">
                  <span>АгроПомощник ДФ</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <Link href="/quiz">
                <button className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium text-base px-8 py-3.5 rounded-full transition-all flex items-center justify-center gap-2">
                  <Award className="w-5 h-5 text-emerald-600" />
                  <span>Тест на знание прайса</span>
                </button>
              </Link>
            </div>
          </div>

          {/* Правая часть: векторная иллюстрация узнаваемых сельхозкультур (пшеница, подсолнух, кукуруза, рапс, бобовые) и почвенного среза */}
          <div className="lg:col-span-6 relative flex justify-center lg:justify-end">
            <div className="w-full max-w-lg relative">
              {/* Облака на фоне */}
              <div className="absolute -top-12 right-12 w-32 h-12 bg-sky-50 rounded-full blur-xl opacity-70"></div>
              <div className="absolute top-0 right-32 w-24 h-8 bg-sky-100 rounded-full blur-md opacity-60"></div>

              {/* Детализированная иллюстрация сельхозкультур */}
              <div className="relative z-10 pt-8">
                <svg viewBox="0 0 520 320" className="w-full h-auto drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Зеленый холм */}
                  <path d="M40 210 C140 175, 380 175, 500 220 L500 235 C380 190, 140 190, 40 235 Z" fill="#4ade80" opacity="0.35" />
                  <path d="M10 225 C120 185, 400 185, 510 230 L510 245 C400 200, 120 200, 10 245 Z" fill="#22c55e" />

                  {/* 1. Подсолнух (круглая корзинка с лепестками и стеблем с листьями) */}
                  <g transform="translate(45, 105)">
                    {/* Листья */}
                    <path d="M20 70 Q5 65, 2 55 Q15 60, 20 70 Z" fill="#15803d" />
                    <path d="M28 85 Q42 80, 48 70 Q35 75, 28 85 Z" fill="#16a34a" />
                    {/* Стебель */}
                    <rect x="22" y="50" width="6" height="75" rx="3" fill="#365314" />
                    {/* Цветок (корзинка) */}
                    <circle cx="25" cy="35" r="22" fill="#eab308" />
                    <circle cx="25" cy="35" r="14" fill="#713f12" />
                    {/* Лучи-лепестки */}
                    <path d="M25 8 L25 15 M25 55 L25 62 M2 35 L9 35 M41 35 L48 35 M9 19 L14 24 M36 46 L41 51 M9 51 L14 46 M36 24 L41 19" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" />
                  </g>

                  {/* 2. Зерновая культура (Пшеница с колосьями) */}
                  <g transform="translate(120, 95)">
                    {/* Стебель */}
                    <line x1="15" y1="130" x2="15" y2="25" stroke="#365314" strokeWidth="3.5" strokeLinecap="round" />
                    {/* Листья */}
                    <path d="M15 90 Q0 80, -5 70 Q10 80, 15 90 Z" fill="#16a34a" />
                    <path d="M15 70 Q30 60, 35 50 Q20 60, 15 70 Z" fill="#22c55e" />
                    {/* Колос сверху */}
                    <ellipse cx="15" cy="22" rx="7" ry="18" fill="#ca8a04" />
                    <path d="M15 4 L15 40" stroke="#facc15" strokeWidth="2" />
                    <path d="M12 10 L8 5 M18 10 L22 5 M12 20 L7 15 M18 20 L23 15 M12 30 L8 25 M18 30 L22 25" stroke="#eab308" strokeWidth="1.5" strokeLinecap="round" />
                  </g>

                  {/* 3. Кукуруза (высокий стебель с початком и метелкой) */}
                  <g transform="translate(185, 75)">
                    {/* Стебель */}
                    <rect x="18" y="30" width="8" height="135" rx="4" fill="#365314" />
                    {/* Длинные широкие листья */}
                    <path d="M18 90 Q-5 85, -15 95 Q0 100, 18 105 Z" fill="#15803d" />
                    <path d="M26 110 Q50 100, 60 110 Q40 120, 26 110 Z" fill="#16a34a" />
                    {/* Початок кукурузы */}
                    <g transform="translate(24, 85)">
                      <ellipse cx="8" cy="18" rx="8" ry="16" fill="#facc15" />
                      <path d="M8 2 L8 34" stroke="#ca8a04" strokeWidth="1.5" />
                      <path d="M2 10 L14 10 M2 18 L14 18 M2 26 L14 26" stroke="#eab308" strokeWidth="1" />
                      <path d="M12 30 Q16 40, 20 45" stroke="#16a34a" strokeWidth="2" fill="none" />
                    </g>
                    {/* Метелка сверху */}
                    <path d="M22 30 Q22 10, 15 2 M22 25 Q28 10, 32 2 M22 20 Q22 5, 22 0" stroke="#a3e635" strokeWidth="2" strokeLinecap="round" />
                  </g>

                  {/* 4. Рапс (разветвленный стебель с желтыми цветами) */}
                  <g transform="translate(275, 110)">
                    {/* Стебли */}
                    <path d="M20 100 Q20 60, 20 30 M20 70 Q5 50, 2 35 M20 60 Q35 45, 40 30" stroke="#365314" strokeWidth="3" fill="none" />
                    {/* Листья внизу */}
                    <path d="M20 85 Q5 80, 0 75 Q12 80, 20 85 Z" fill="#15803d" />
                    <path d="M20 90 Q35 85, 42 78 Q30 85, 20 90 Z" fill="#16a34a" />
                    {/* Желтые соцветия */}
                    <circle cx="20" cy="24" r="7" fill="#fde047" />
                    <circle cx="2" cy="30" r="6" fill="#fde047" />
                    <circle cx="40" cy="24" r="6" fill="#fde047" />
                  </g>

                  {/* 5. Масличный лён / бобовые (нежный кустик с мелкими цветами/стручками) */}
                  <g transform="translate(350, 130)">
                    <path d="M15 80 Q15 50, 10 30 M15 65 Q25 45, 28 35" stroke="#365314" strokeWidth="2.5" fill="none" />
                    <ellipse cx="6" cy="45" rx="5" ry="2" fill="#16a34a" />
                    <ellipse cx="22" cy="50" rx="5" ry="2" fill="#16a34a" />
                    <ellipse cx="10" cy="28" rx="4" ry="2" fill="#86efac" />
                    <ellipse cx="28" cy="32" rx="4" ry="2" fill="#86efac" />
                  </g>

                  {/* 6. Зернобобовые (чечевица / горох с усиками) */}
                  <g transform="translate(425, 115)">
                    <line x1="12" y1="95" x2="12" y2="35" stroke="#365314" strokeWidth="3" strokeLinecap="round" />
                    <path d="M12 70 Q2 60, 0 50 Q8 60, 12 70 Z" fill="#15803d" />
                    <path d="M12 55 Q22 45, 26 38 Q18 48, 12 55 Z" fill="#22c55e" />
                    {/* Стручки */}
                    <ellipse cx="8" cy="40" rx="6" ry="2.5" fill="#84cc16" transform="rotate(-20 8 40)" />
                    <ellipse cx="18" cy="52" rx="6" ry="2.5" fill="#84cc16" transform="rotate(25 18 52)" />
                  </g>

                  {/* Почвенный срез */}
                  <path d="M0 235 C130 215, 390 215, 520 235 L520 320 L0 320 Z" fill="#582f1d" />
                  <path d="M0 250 C140 235, 380 235, 520 250 L520 320 L0 320 Z" fill="#3d1c0b" />
                  
                  {/* Корневая система и питательные элементы в почве */}
                  <path d="M57 180 Q60 220, 50 260 M57 200 Q70 230, 85 270" stroke="#78350f" strokeWidth="2" fill="none" opacity="0.8" />
                  <path d="M135 155 Q135 210, 120 255 M135 180 Q150 220, 160 275" stroke="#78350f" strokeWidth="2" fill="none" opacity="0.8" />
                  <path d="M203 165 Q200 215, 220 265 M203 190 Q180 235, 170 280" stroke="#78350f" strokeWidth="2" fill="none" opacity="0.8" />
                  <path d="M295 140 Q290 200, 310 260" stroke="#78350f" strokeWidth="2" fill="none" opacity="0.8" />
                  
                  {/* Текстура почвы (комки/минералы) */}
                  <circle cx="85" cy="275" r="5" fill="#78350f" opacity="0.6" />
                  <circle cx="145" cy="290" r="7" fill="#78350f" opacity="0.5" />
                  <circle cx="230" cy="280" r="6" fill="#78350f" opacity="0.7" />
                  <circle cx="315" cy="295" r="8" fill="#78350f" opacity="0.6" />
                  <circle cx="400" cy="275" r="5" fill="#78350f" opacity="0.5" />
                  <circle cx="460" cy="290" r="6" fill="#78350f" opacity="0.7" />
                </svg>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Карточки модулей снизу */}
      <section className="bg-gray-50 py-16 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <Link href="/agro-helper">
              <div className="bg-white p-8 rounded-2xl border border-gray-200 hover:border-emerald-500 transition-all shadow-xs hover:shadow-md cursor-pointer group flex flex-col justify-between h-full">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">АгроПомощник ДФ</h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-6">
                    Интерактивный подбор схем защиты растений с учётом технологий возделывания, точных норм из прайса и калькулятора площади.
                  </p>
                </div>
                <div className="flex items-center text-emerald-600 font-semibold text-sm gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Перейти к подбору схем</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

            <Link href="/quiz">
              <div className="bg-white p-8 rounded-2xl border border-gray-200 hover:border-emerald-500 transition-all shadow-xs hover:shadow-md cursor-pointer group flex flex-col justify-between h-full">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 mb-6 group-hover:scale-110 transition-transform">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Тест на знание прайса</h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-6">
                    Проверка продуктовой экспертизы сотрудников с фиксированным таймером, звуковым оповещением и детальным разбором ошибок.
                  </p>
                </div>
                <div className="flex items-center text-sky-600 font-semibold text-sm gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Пройти аттестацию</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* Футер */}
      <footer className="bg-white border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div>© Doctor Farmer. Все права защищены.</div>
          <div className="flex items-center space-x-6">
            <span className="cursor-pointer hover:text-gray-900">Политика конфиденциальности</span>
            <span className="cursor-pointer hover:text-gray-900">Поддержка</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
