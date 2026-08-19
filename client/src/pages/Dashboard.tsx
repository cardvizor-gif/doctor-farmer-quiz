import { Link } from "wouter";
import { ArrowRight, ShieldCheck, Award, BookOpen, Layers } from "lucide-react";
import { DoctorFarmerLogo } from "@/components/DoctorFarmerLogo";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#f4f7f1] text-[#15211c] flex flex-col font-sans selection:bg-[#66a46c] selection:text-white relative overflow-hidden">
      
      {/* Верхняя навигация */}
      <header className="w-full border-b border-[#dde5dc] bg-[#fbfcf9] sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-3">
          
          <div className="flex items-center gap-2.5 min-w-0">
            <Link href="/">
              <DoctorFarmerLogo className="h-10 sm:h-12 w-auto cursor-pointer" />
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-6 text-xs font-semibold text-[#194f38] uppercase tracking-wider">
            <Link href="/agro-helper">
              <span className="cursor-pointer hover:text-[#d5a642] transition-colors">АгроПомощник</span>
            </Link>
            <Link href="/quiz">
              <span className="cursor-pointer hover:text-[#d5a642] transition-colors">Тестирование</span>
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/agro-helper">
              <button className="bg-[#194f38] hover:bg-[#12352a] text-white font-bold text-xs px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl transition-all shadow-xs whitespace-nowrap">
                <span className="hidden sm:inline">Открыть </span>АгроПомощник
              </button>
            </Link>
          </div>

        </div>
      </header>

      {/* Мобильная панель быстрого переключения */}
      <div className="md:hidden bg-[#e8efe5] border-b border-[#dde5dc] px-4 py-2 flex items-center justify-around text-xs font-bold text-[#194f38] relative z-20">
        <Link href="/agro-helper">
          <span className="flex items-center gap-1.5 py-1 px-3 rounded-lg bg-white shadow-2xs">🌱 АгроПомощник</span>
        </Link>
        <div className="w-px h-4 bg-[#dde5dc]" />
        <Link href="/quiz">
          <span className="flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-white/60">📝 Тестирование</span>
        </Link>
      </div>

      {/* Hero-секция с крупными белыми стилизованными силуэтами культур в стиле референса */}
      <section className="relative overflow-hidden py-14 sm:py-22 md:py-28 flex-1 flex items-center max-w-5xl mx-auto px-4 sm:px-6 w-full text-center z-10 bg-[#12352a] text-white shadow-lg rounded-3xl my-6 mx-4 sm:mx-auto">
        
        {/* Крупные фоновые белые силуэты культур в стиле референса (колосья пшеницы, подсолнечник, зерновые) */}
        <div className="absolute inset-0 pointer-events-none z-0 opacity-15 flex items-center justify-between px-8 py-4 select-none overflow-hidden" aria-hidden="true">
          <svg className="w-full h-full absolute inset-0 text-white" viewBox="0 0 1000 450" fill="currentColor" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            {/* Колос пшеницы стиль 1 (слева) */}
            <g transform="translate(60, 40) scale(1.3)">
              <rect x="35" y="10" width="6" height="240" rx="3" />
              <path d="M38 20 C10 10 5 40 38 60 C5 75 10 105 38 120 C5 135 10 165 38 180 C5 195 10 225 38 240 Z" />
              <path d="M41 20 C69 10 74 40 41 60 C74 75 69 105 41 120 C74 135 69 165 41 180 C74 195 69 225 41 240 Z" />
            </g>

            {/* Колос пшеницы стиль 2 (чуть правее) */}
            <g transform="translate(180, 80) scale(1.1)">
              <rect x="35" y="10" width="6" height="200" rx="3" />
              <path d="M38 15 C15 5 10 30 38 45 C10 60 15 85 38 100 C10 115 15 140 38 155 C10 170 15 195 38 210 Z" />
              <path d="M41 15 C64 5 69 30 41 45 C69 60 64 85 41 100 C69 115 64 140 41 155 C69 170 64 195 41 210 Z" />
            </g>

            {/* Подсолнечник / стилизованный элемент (справа 1) */}
            <g transform="translate(740, 60) scale(1.2)">
              <circle cx="50" cy="80" r="35" />
              <path d="M50 15 V145 M15 80 H85 M25 45 L75 115 M25 115 L75 45" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
              <rect x="47" y="140" width="6" height="150" rx="3" />
            </g>

            {/* Колос пшеницы зеркальный (справа 2) */}
            <g transform="translate(860, 50) scale(1.25)">
              <rect x="35" y="10" width="6" height="220" rx="3" />
              <path d="M38 18 C12 8 8 35 38 52 C8 65 12 92 38 108 C8 122 12 148 38 165 C8 178 12 205 38 220 Z" />
              <path d="M41 18 C67 8 71 35 41 52 C71 65 67 92 41 108 C71 122 67 148 41 165 C71 178 67 205 41 220 Z" />
            </g>
          </svg>
        </div>

        <div className="w-full space-y-6 sm:space-y-8 max-w-3xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white text-xs font-bold tracking-wide uppercase border border-white/20 mx-auto shadow-sm backdrop-blur-xs">
            <ShieldCheck className="w-4 h-4 text-[#d5a642]" /> Рабочий кабинет команды
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
            Профессиональная <br />
            <span className="text-[#66a46c]">экспертиза на поле</span>
          </h1>

          <p className="text-white/80 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-medium">
            Единый цифровой инструмент для точного подбора регламентов защиты растений и оперативной аттестации продуктовых знаний команды.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/agro-helper">
              <button className="bg-[#66a46c] hover:bg-[#528a57] text-white font-bold text-sm px-8 py-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group w-full sm:w-auto">
                <span>АгроПомощник ДФ</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <Link href="/quiz">
              <button className="bg-white hover:bg-[#f4f7f1] text-[#12352a] font-bold text-sm px-8 py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm w-full sm:w-auto">
                <Award className="w-4 h-4 text-[#d5a642]" />
                <span>Тестирование</span>
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Карточки модулей снизу */}
      <section className="bg-white py-16 sm:py-20 border-t border-[#dde5dc] relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <Link href="/agro-helper">
              <div className="bg-[#f4f7f1] p-8 rounded-2xl border border-[#dde5dc] hover:border-[#2e7d52] transition-all shadow-xs cursor-pointer group flex flex-col justify-between h-full">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#e8efe5] flex items-center justify-center text-[#2e7d52] mb-6 group-hover:scale-105 transition-transform border border-[#dde5dc]">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-[#12352a] mb-2 flex items-center justify-between">
                    <span>АгроПомощник ДФ</span>
                    <ArrowRight className="w-5 h-5 text-[#2e7d52] group-hover:translate-x-1 transition-transform" />
                  </h3>
                  <p className="text-sm text-[#6f7a73] leading-relaxed font-medium">
                    Интерактивный подбор схем защиты растений по культурам с учётом официальных регламентов, расчётом дозировок на гектары и возможностью экспорта в PDF.
                  </p>
                </div>
                <div className="mt-8 pt-4 border-t border-[#dde5dc] flex items-center gap-2 text-xs font-bold text-[#194f38]">
                  <span>Запустить консультант</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>

            <Link href="/quiz">
              <div className="bg-[#f4f7f1] p-8 rounded-2xl border border-[#dde5dc] hover:border-[#2e7d52] transition-all shadow-xs cursor-pointer group flex flex-col justify-between h-full">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#e8efe5] flex items-center justify-center text-[#2e7d52] mb-6 group-hover:scale-105 transition-transform border border-[#dde5dc]">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-[#12352a] mb-2 flex items-center justify-between">
                    <span>Тестирование</span>
                    <ArrowRight className="w-5 h-5 text-[#2e7d52] group-hover:translate-x-1 transition-transform" />
                  </h3>
                  <p className="text-sm text-[#6f7a73] leading-relaxed font-medium">
                    Проверка продуктовой экспертизы сотрудников с фиксированным таймером, случайным распределением вопросов и автоматическим отчётом на почту руководству.
                  </p>
                </div>
                <div className="mt-8 pt-4 border-t border-[#dde5dc] flex items-center gap-2 text-xs font-bold text-[#194f38]">
                  <span>Начать аттестацию</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* Футер */}
      <footer className="bg-[#fbfcf9] border-t border-[#dde5dc] py-8 px-4 sm:px-6 text-center text-xs text-[#6f7a73] relative z-10">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <DoctorFarmerLogo className="h-6 w-auto" />
            <span className="font-bold text-[#12352a]">DOCTOR FARMER</span>
          </div>
          <p>© 2026 ООО ТД Доктор Фармер. Внутренний корпоративный портал.</p>
        </div>
      </footer>

    </div>
  );
}
