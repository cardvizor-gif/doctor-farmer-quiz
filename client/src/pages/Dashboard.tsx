import React from "react";
import { Link } from "wouter";
import { ArrowRight, ShieldCheck, Award, BookOpen, Layers } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#0E5B6B] text-white flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      
      {/* Верхняя навигация в стиле референса */}
      <header className="w-full border-b border-white/10 bg-[#0E5B6B]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Логотип и название компании */}
          <div className="flex items-center gap-3">
            <img 
              src="/manus-storage/Screenshot_1_c8d1047c.png" 
              alt="Doctor Farmer" 
              className="w-10 h-10 object-contain bg-white/10 rounded-xl p-1" 
            />
            <span className="font-bold tracking-tight text-lg sm:text-xl text-white font-sans">
              Doctor Farmer
            </span>
          </div>

          {/* Меню навигации */}
          <nav className="hidden md:flex items-center space-x-8 text-sm text-emerald-100 font-medium">
            <Link href="/agro-helper">
              <span className="cursor-pointer hover:text-orange-400 transition-colors">АгроПомощник</span>
            </Link>
            <Link href="/quiz">
              <span className="cursor-pointer hover:text-orange-400 transition-colors">Тест на знание прайса</span>
            </Link>
          </nav>

          {/* Правая кнопка */}
          <div className="flex items-center gap-4">
            <span className="hidden lg:inline-block text-xs font-mono text-emerald-200 bg-white/10 px-3 py-1 rounded-full border border-white/20">
              Служебный комплекс
            </span>
            <Link href="/agro-helper">
              <button className="bg-[#E86C30] hover:bg-[#d45b20] text-white font-medium text-sm px-6 py-2.5 rounded-full transition-all shadow-xs">
                Открыть АгроПомощник
              </button>
            </Link>
          </div>

        </div>
      </header>

      {/* Hero-секция с главной иллюстрацией пользователя */}
      <section className="relative overflow-hidden pt-10 pb-20 md:pt-16 md:pb-28 flex-1 flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Левая часть: заголовки и кнопки */}
          <div className="lg:col-span-6 space-y-6 z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 text-orange-300 text-xs font-semibold tracking-wide uppercase border border-white/15">
              <ShieldCheck className="w-4 h-4 text-orange-400" /> Рабочий кабинет команды
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.12]">
              Профессиональная <br />
              <span className="text-[#F4A261]">экспертиза на поле</span>
            </h1>

            <p className="text-emerald-100 text-base sm:text-lg max-w-lg leading-relaxed font-normal">
              Единый цифровой инструмент для точного подбора регламентов защиты растений и оперативной аттестации продуктовых знаний команды.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link href="/agro-helper">
                <button className="bg-[#E86C30] hover:bg-[#d45b20] text-white font-medium text-base px-8 py-3.5 rounded-full transition-all shadow-md flex items-center justify-center gap-2 group">
                  <span>АгроПомощник ДФ</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <Link href="/quiz">
                <button className="bg-white/10 hover:bg-white/20 text-white font-medium text-base px-8 py-3.5 rounded-full transition-all flex items-center justify-center gap-2 border border-white/20">
                  <Award className="w-5 h-5 text-orange-300" />
                  <span>Тест на знание прайса</span>
                </button>
              </Link>
            </div>
          </div>

          {/* Правая часть: загруженная иллюстрация пользователя как главный визуальный центр */}
          <div className="lg:col-span-6 relative flex justify-center lg:justify-end">
            <div className="w-full max-w-xl relative p-3 bg-white/5 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-sm">
              <img 
                src="/manus-storage/8bc6dbd5-1270-4733-b922-88eb93484a1b_6292d44e.webp" 
                alt="Agronomic Style Illustration" 
                className="w-full h-auto rounded-2xl object-cover shadow-lg"
              />
            </div>
          </div>

        </div>
      </section>

      {/* Карточки модулей снизу в единой палитре */}
      <section className="bg-[#094854] py-16 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <Link href="/agro-helper">
              <div className="bg-[#0E5B6B] p-8 rounded-2xl border border-white/15 hover:border-orange-400 transition-all shadow-md cursor-pointer group flex flex-col justify-between h-full">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400 mb-6 group-hover:scale-110 transition-transform border border-orange-500/30">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">АгроПомощник ДФ</h3>
                  <p className="text-emerald-100 text-sm leading-relaxed mb-6 font-normal">
                    Интерактивный подбор схем защиты растений с учётом технологий возделывания, точных норм из прайса и калькулятора площади.
                  </p>
                </div>
                <div className="flex items-center text-orange-300 font-semibold text-sm gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Перейти к подбору схем</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

            <Link href="/quiz">
              <div className="bg-[#0E5B6B] p-8 rounded-2xl border border-white/15 hover:border-orange-400 transition-all shadow-md cursor-pointer group flex flex-col justify-between h-full">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400 mb-6 group-hover:scale-110 transition-transform border border-orange-500/30">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Тест на знание прайса</h3>
                  <p className="text-emerald-100 text-sm leading-relaxed mb-6 font-normal">
                    Проверка продуктовой экспертизы сотрудников с фиксированным таймером, звуковым оповещением и детальным разбором ошибок.
                  </p>
                </div>
                <div className="flex items-center text-orange-300 font-semibold text-sm gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Пройти аттестацию</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* Футер */}
      <footer className="bg-[#094854] border-t border-white/10 py-8 text-emerald-200">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
          <div>© Doctor Farmer. Все права защищены.</div>
          <div className="flex items-center space-x-6">
            <span className="cursor-pointer hover:text-white">Политика конфиденциальности</span>
            <span className="cursor-pointer hover:text-white">Поддержка</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
