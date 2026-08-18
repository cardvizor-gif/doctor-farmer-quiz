import React from "react";
import { Link } from "wouter";
import { ArrowRight, ShieldCheck, Award, Layers, BookOpen } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans selection:bg-emerald-100">
      
      {/* Тонкая верхняя навигация как в референсе */}
      <header className="w-full border-b border-gray-100 bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Логотип */}
          <div className="flex items-center gap-3">
            <img 
              src="/manus-storage/doctor-farmer-hq-mark_7e96d17e.png" 
              alt="Doctor Farmer" 
              className="w-10 h-10 object-contain" 
            />
            <span className="font-bold tracking-tight text-xl text-gray-900 font-sans">
              agronomic
            </span>
          </div>

          {/* Меню навигации */}
          <nav className="hidden md:flex items-center space-x-8 text-sm text-gray-600 font-medium">
            <span className="cursor-pointer hover:text-emerald-700 transition-colors">Agriculture</span>
            <span className="cursor-pointer hover:text-emerald-700 transition-colors">Corporation</span>
            <span className="cursor-pointer hover:text-emerald-700 transition-colors">Deploy</span>
            <span className="cursor-pointer hover:text-emerald-700 transition-colors">Solutions</span>
          </nav>

          {/* Правая кнопка */}
          <div className="flex items-center gap-4">
            <span className="hidden lg:inline-block text-sm text-gray-500 font-medium">Support</span>
            <Link href="/agro-helper">
              <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-6 py-2.5 rounded-full transition-all shadow-xs">
                Open App
              </button>
            </Link>
          </div>

        </div>
      </header>

      {/* Hero-секция в точном соответствии с референсом */}
      <section className="relative overflow-hidden pt-12 pb-24 md:pt-20 md:pb-32 bg-white flex-1 flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Левая часть: заголовок и CTA */}
          <div className="lg:col-span-6 space-y-6 z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold tracking-wide uppercase">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Doctor Farmer Agronomy System
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-[1.12]">
              Clean your Agronomic <br />
              <span className="text-emerald-700">Technology Systems</span>
            </h1>

            <p className="text-gray-600 text-base sm:text-lg max-w-lg leading-relaxed">
              The status of professional agricultural regulation, fox genetics and farm chemistry management.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link href="/agro-helper">
                <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-base px-8 py-3.5 rounded-full transition-all shadow-md flex items-center justify-center gap-2 group">
                  <span>АгроПомощник</span>
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

          {/* Правая часть: векторная иллюстрация растений и почвенного среза как в референсе */}
          <div className="lg:col-span-6 relative flex justify-center lg:justify-end">
            <div className="w-full max-w-lg relative">
              {/* Облака на фоне */}
              <div className="absolute -top-12 right-12 w-32 h-12 bg-sky-50 rounded-full blur-xl opacity-70"></div>
              <div className="absolute top-0 right-32 w-24 h-8 bg-sky-100 rounded-full blur-md opacity-60"></div>

              {/* Стилизованная svg-иллюстрация побегов и почвенного среза */}
              <div className="relative z-10 pt-8">
                <svg viewBox="0 0 500 320" className="w-full h-auto drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Зеленый холм */}
                  <path d="M50 210 C150 180, 350 180, 480 220 L480 230 C350 190, 150 190, 50 230 Z" fill="#4ade80" opacity="0.4" />
                  <path d="M20 220 C120 185, 380 185, 490 225 L490 240 C380 200, 120 200, 20 240 Z" fill="#22c55e" />

                  {/* Растения на холме */}
                  {/* 1. Дерево с кроной-кругом */}
                  <g transform="translate(60, 120)">
                    <rect x="25" y="40" width="8" height="60" rx="4" fill="#365314" />
                    <circle cx="29" cy="35" r="30" fill="#15803d" />
                    <circle cx="20" cy="25" r="10" fill="#86efac" opacity="0.6" />
                    <circle cx="38" cy="20" r="8" fill="#4ade80" opacity="0.6" />
                  </g>

                  {/* 2. Маленький росток */}
                  <g transform="translate(130, 175)">
                    <path d="M10 35 Q10 20, 5 10" stroke="#365314" strokeWidth="3" strokeLinecap="round" />
                    <path d="M10 25 C5 25, 0 20, 5 15 C10 10, 15 20, 10 25 Z" fill="#16a34a" />
                    <path d="M10 20 C15 20, 20 15, 15 10 C10 5, 5 15, 10 20 Z" fill="#4ade80" />
                  </g>

                  {/* 3. Тонкий стебель */}
                  <g transform="translate(180, 160)">
                    <line x1="10" y1="50" x2="10" y2="20" stroke="#365314" strokeWidth="3" strokeLinecap="round" />
                    <ellipse cx="4" cy="25" rx="6" ry="3" fill="#15803d" />
                    <ellipse cx="16" cy="32" rx="6" ry="3" fill="#22c55e" />
                    <circle cx="10" cy="15" r="5" fill="#78350f" />
                  </g>

                  {/* 4. Высокое колосовидное растение */}
                  <g transform="translate(225, 125)">
                    <line x1="12" y1="85" x2="12" y2="20" stroke="#365314" strokeWidth="3.5" strokeLinecap="round" />
                    <path d="M12 20 Q5 25, 12 30 Q20 25, 12 20 Z" fill="#bef264" />
                    <path d="M12 35 Q5 40, 12 45 Q20 40, 12 35 Z" fill="#a3e635" />
                    <path d="M12 50 Q5 55, 12 60 Q20 55, 12 50 Z" fill="#84cc16" />
                    <path d="M12 65 Q5 70, 12 75 Q20 70, 12 65 Z" fill="#65a30d" />
                  </g>

                  {/* 5. Раскидистое растение */}
                  <g transform="translate(285, 155)">
                    <path d="M15 55 Q15 30, 15 15" stroke="#365314" strokeWidth="3" />
                    <path d="M15 35 Q5 30, 2 20 Q15 25, 15 35 Z" fill="#16a34a" />
                    <path d="M15 25 Q25 20, 28 10 Q15 15, 15 25 Z" fill="#22c55e" />
                  </g>

                  {/* 6. Высокий папоротник / укроп */}
                  <g transform="translate(340, 110)">
                    <line x1="10" y1="100" x2="10" y2="10" stroke="#166534" strokeWidth="3.5" strokeLinecap="round" />
                    <path d="M10 20 L2 15 L10 25 L18 15 Z" fill="#15803d" />
                    <path d="M10 35 L0 30 L10 40 L20 30 Z" fill="#16a34a" />
                    <path d="M10 50 L2 45 L10 55 L18 45 Z" fill="#22c55e" />
                    <path d="M10 65 L0 60 L10 70 L20 60 Z" fill="#4ade80" />
                    <path d="M10 80 L2 75 L10 85 L18 75 Z" fill="#86efac" />
                  </g>

                  {/* Почвенный срез (как в референсе) */}
                  <path d="M0 230 C120 210, 380 210, 500 230 L500 320 L0 320 Z" fill="#582f1d" />
                  <path d="M0 245 C130 230, 370 230, 500 245 L500 320 L0 320 Z" fill="#3d1c0b" />
                  
                  {/* Текстура почвы (точки/комки) */}
                  <circle cx="80" cy="260" r="4" fill="#78350f" opacity="0.6" />
                  <circle cx="120" cy="280" r="6" fill="#78350f" opacity="0.5" />
                  <circle cx="210" cy="265" r="5" fill="#78350f" opacity="0.7" />
                  <circle cx="290" cy="290" r="7" fill="#78350f" opacity="0.6" />
                  <circle cx="380" cy="270" r="4" fill="#78350f" opacity="0.5" />
                  <circle cx="430" cy="295" r="5" fill="#78350f" opacity="0.7" />
                </svg>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Быстрые карточки модулей снизу */}
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
            <span className="cursor-pointer hover:text-gray-900">Privacy</span>
            <span className="cursor-pointer hover:text-gray-900">Terms</span>
            <span className="cursor-pointer hover:text-gray-900">Contact</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
