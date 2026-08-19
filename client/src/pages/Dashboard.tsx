import { Link } from "wouter";
import { ArrowRight, ShieldCheck, Award, BookOpen, Layers } from "lucide-react";
import { DoctorFarmerLogo } from "@/components/DoctorFarmerLogo";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#f4f7f1] text-[#15211c] flex flex-col font-sans selection:bg-[#66a46c] selection:text-white relative overflow-hidden">
      
      {/* Техно-аграрный геометрический водяной паттерн (кубизм / ботанические контуры культур) */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.09] z-0 flex flex-col justify-between overflow-hidden select-none" aria-hidden="true">
        <svg className="w-full h-full absolute inset-0 text-[#194f38]" viewBox="0 0 1200 1000" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Геометрический контур колоса пшеницы (кубистический стиль) */}
          <path d="M150 100 L180 70 L210 100 L180 130 Z M180 70 L180 160 M165 95 L195 95 M160 120 L200 120" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M150 180 L180 150 L210 180 L180 210 Z M180 150 L180 240 M165 175 L195 175 M160 200 L200 200" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>

          {/* Геометрический контур корзинки подсолнечника */}
          <circle cx="950" cy="180" r="50" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6"/>
          <path d="M950 130 L950 230 M900 180 L1000 180 M915 145 L985 215 M915 215 L985 145" stroke="currentColor" strokeWidth="1.5"/>

          {/* Геометрический контур кукурузы с початком */}
          <path d="M220 700 L250 650 L280 700 L250 820 Z M250 670 Q235 720 250 780" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          <path d="M235 680 L220 660 M265 680 L285 660 M240 720 L220 710 M260 720 L285 710" stroke="currentColor" strokeWidth="1.5"/>

          {/* Техно-аграрная сетка и абстрактные многоугольники */}
          <polygon points="850,600 920,540 980,620 900,680" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4"/>
          <polygon points="100,450 160,400 210,480 140,510" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="880" cy="800" r="70" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M810 800 H950 M880 730 V870" stroke="currentColor" strokeWidth="1.5"/>

          {/* Линии полей и технологические векторы */}
          <path d="M0 350 Q300 320 600 360 T1200 340" stroke="currentColor" strokeWidth="2" fill="none"/>
          <path d="M0 600 Q400 570 800 610 T1200 590" stroke="currentColor" strokeWidth="2" fill="none"/>
          <path d="M0 850 Q350 820 750 860 T1200 840" stroke="currentColor" strokeWidth="2" fill="none"/>
        </svg>
      </div>

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

      {/* Hero-секция с техно-аграрным паттерном */}
      <section className="relative overflow-hidden py-12 sm:py-20 md:py-24 flex-1 flex items-center max-w-5xl mx-auto px-4 sm:px-6 w-full text-center z-10">
        {/* Узнаваемые контурные водяные знаки внутри hero: пшеница, подсолнечник, кукуруза и рапс */}
        <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.12] text-[#194f38]" aria-hidden="true">
          <svg className="w-full h-full" viewBox="0 0 900 430" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            {/* Пшеница слева */}
            <g stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M105 385 C108 310 108 220 112 95" />
              <path d="M112 145 L78 118 L105 164 M112 188 L76 160 L105 207 M112 232 L79 210 L106 251" />
              <path d="M112 126 L145 100 L119 151 M112 171 L150 145 L119 195 M112 216 L147 190 L117 238" />
              <path d="M112 95 L112 60" />
            </g>
            {/* Подсолнечник справа */}
            <g stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="758" cy="145" r="38" />
              <circle cx="758" cy="145" r="15" strokeDasharray="3 5" />
              <path d="M758 107 V183 M720 145 H796 M731 118 L785 172 M731 172 L785 118" />
              <path d="M758 183 C758 238 744 286 718 333" />
              <path d="M741 248 C705 224 683 228 665 247 C696 257 718 259 741 248 Z" />
              <path d="M745 285 C780 262 804 267 821 289 C789 296 768 298 745 285 Z" />
            </g>
            {/* Кукуруза снизу справа */}
            <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M650 400 C659 348 664 306 662 258" />
              <path d="M662 287 C623 268 596 274 575 301 C610 308 638 306 662 287 Z" />
              <path d="M663 330 C700 308 728 317 746 344 C712 348 686 344 663 330 Z" />
              <path d="M662 258 L650 230 M662 258 L679 229" />
              <path d="M650 230 L662 218 L674 230 L662 242 Z" />
            </g>
            {/* Рапс / геометрические цветы снизу слева */}
            <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M254 390 C260 346 258 300 266 248" />
              <circle cx="266" cy="246" r="9" /><circle cx="239" cy="270" r="8" /><circle cx="292" cy="275" r="8" />
              <path d="M266 246 L239 270 M266 246 L292 275 M266 246 L266 220" />
              <path d="M228 391 H316 M228 373 H316" strokeDasharray="6 8" />
            </g>
            {/* Кубистическая сетка полей */}
            <g stroke="currentColor" strokeWidth="1.4" strokeDasharray="5 7">
              <path d="M30 405 H870" /><path d="M420 90 V395" /><path d="M470 90 V395" />
              <path d="M360 390 L470 325 L580 390" /><path d="M360 370 L470 305 L580 370" />
            </g>
          </svg>
        </div>
        <div className="w-full space-y-6 sm:space-y-8 max-w-3xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#e8efe5] text-[#194f38] text-xs font-bold tracking-wide uppercase border border-[#dde5dc] mx-auto shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-[#2e7d52]" /> Рабочий кабинет команды
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#12352a] leading-[1.15]">
            Профессиональная <br />
            <span className="text-[#2e7d52]">экспертиза на поле</span>
          </h1>

          <p className="text-[#6f7a73] text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-medium">
            Единый цифровой инструмент для точного подбора регламентов защиты растений и оперативной аттестации продуктовых знаний команды.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/agro-helper">
              <button className="bg-[#194f38] hover:bg-[#12352a] text-white font-bold text-sm px-8 py-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group w-full sm:w-auto">
                <span>АгроПомощник ДФ</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <Link href="/quiz">
              <button className="bg-white hover:bg-[#e8efe5] text-[#194f38] font-bold text-sm px-8 py-4 rounded-xl transition-all flex items-center justify-center gap-2 border border-[#dde5dc] shadow-xs w-full sm:w-auto">
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
