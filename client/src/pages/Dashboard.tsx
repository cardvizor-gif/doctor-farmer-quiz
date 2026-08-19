import { Link } from "wouter";
import { ArrowRight, ShieldCheck, Award, BookOpen, Layers } from "lucide-react";

const LOGO_IMAGE = "/manus-storage/logo_df_2c260058.jpg";
const ILLUSTRATION_IMAGE = "/manus-storage/agri-transparent_ebc8cf7a.png";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#f4f7f1] text-[#15211c] flex flex-col font-sans selection:bg-[#66a46c] selection:text-white">
      
      {/* Верхняя навигация с адаптивным меню для мобильных */}
      <header className="w-full border-b border-[#dde5dc] bg-[#fbfcf9] sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-3">
          
          <div className="flex items-center gap-2.5 min-w-0">
            <img src={LOGO_IMAGE} alt="Doctor Farmer" className="h-10 sm:h-12 w-auto object-contain" />
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

      {/* Мобильная панель быстрого переключения разделов */}
      <div className="md:hidden bg-[#e8efe5] border-b border-[#dde5dc] px-4 py-2 flex items-center justify-around text-xs font-bold text-[#194f38]">
        <Link href="/agro-helper">
          <span className="flex items-center gap-1.5 py-1 px-3 rounded-lg bg-white shadow-2xs">🌱 АгроПомощник</span>
        </Link>
        <div className="w-px h-4 bg-[#dde5dc]" />
        <Link href="/quiz">
          <span className="flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-white/60">📝 Тестирование</span>
        </Link>
      </div>

      {/* Hero-секция с идеальной мобильной адаптацией */}
      <section className="relative overflow-hidden py-8 sm:py-16 md:py-20 flex-1 flex items-center max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">
          
          <div className="lg:col-span-6 space-y-4 sm:space-y-6 z-10 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e8efe5] text-[#194f38] text-[11px] sm:text-xs font-bold tracking-wide uppercase border border-[#dde5dc]">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#2e7d52]" /> Рабочий кабинет команды
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#12352a] leading-[1.15]">
              Профессиональная <br />
              <span className="text-[#2e7d52]">экспертиза на поле</span>
            </h1>

            <p className="text-[#6f7a73] text-sm sm:text-base md:text-lg max-w-lg mx-auto lg:mx-0 leading-relaxed font-medium">
              Единый цифровой инструмент для точного подбора регламентов защиты растений и оперативной аттестации продуктовых знаний команды.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 sm:gap-4">
              <Link href="/agro-helper">
                <button className="bg-[#194f38] hover:bg-[#12352a] text-white font-bold text-sm px-6 sm:px-8 py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group w-full sm:w-auto">
                  <span>АгроПомощник ДФ</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <Link href="/quiz">
                <button className="bg-white hover:bg-[#e8efe5] text-[#194f38] font-bold text-sm px-6 sm:px-8 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 border border-[#dde5dc] shadow-xs w-full sm:w-auto">
                  <Award className="w-4 h-4 text-[#d5a642]" />
                  <span>Тестирование</span>
                </button>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 relative flex justify-center lg:justify-end">
            <div className="w-full max-w-xs sm:max-w-md lg:max-w-lg relative flex items-center justify-center p-2">
              <img 
                src={ILLUSTRATION_IMAGE} 
                alt="Agronomic Style Illustration" 
                className="w-full h-auto max-h-[320px] sm:max-h-[480px] lg:max-h-[580px] object-contain object-center drop-shadow-sm"
              />
            </div>
          </div>

        </div>
      </section>

      {/* Карточки модулей снизу в палитре теста */}
      <section className="bg-white py-12 sm:py-16 border-t border-[#dde5dc]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            
            <Link href="/agro-helper">
              <div className="bg-[#f4f7f1] p-6 sm:p-8 rounded-2xl border border-[#dde5dc] hover:border-[#2e7d52] transition-all shadow-xs cursor-pointer group flex flex-col justify-between h-full">
                <div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#e8efe5] flex items-center justify-center text-[#2e7d52] mb-4 sm:mb-6 group-hover:scale-105 transition-transform border border-[#dde5dc]">
                    <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-[#12352a] mb-2">АгроПомощник ДФ</h3>
                  <p className="text-[#6f7a73] text-xs sm:text-sm leading-relaxed mb-6 font-medium">
                    Интерактивный подбор схем защиты растений с учётом технологий возделывания, точных норм из прайса и калькулятора площади.
                  </p>
                </div>
                <div className="flex items-center text-[#194f38] font-bold text-xs uppercase tracking-wider gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Перейти к подбору схем</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

            <Link href="/quiz">
              <div className="bg-[#f4f7f1] p-6 sm:p-8 rounded-2xl border border-[#dde5dc] hover:border-[#2e7d52] transition-all shadow-xs cursor-pointer group flex flex-col justify-between h-full">
                <div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#e8efe5] flex items-center justify-center text-[#2e7d52] mb-4 sm:mb-6 group-hover:scale-105 transition-transform border border-[#dde5dc]">
                    <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-[#12352a] mb-2">Тестирование</h3>
                  <p className="text-[#6f7a73] text-xs sm:text-sm leading-relaxed mb-6 font-medium">
                    Проверка продуктовой экспертизы сотрудников с фиксированным таймером, звуковым оповещением и детальным разбором ошибок.
                  </p>
                </div>
                <div className="flex items-center text-[#194f38] font-bold text-xs uppercase tracking-wider gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Пройти аттестацию</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* Футер */}
      <footer className="bg-[#fbfcf9] border-t border-[#dde5dc] py-6 sm:py-8 text-[#6f7a73]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-center sm:text-left">
          <div>© Doctor Farmer. Все права защищены.</div>
          <div className="flex items-center space-x-6">
            <span className="cursor-pointer hover:text-[#15211c]">Политика конфиденциальности</span>
            <span className="cursor-pointer hover:text-[#15211c]">Поддержка</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
