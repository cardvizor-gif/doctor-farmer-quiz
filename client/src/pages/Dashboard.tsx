import { Link } from "wouter";
import { ArrowRight, ShieldCheck, Award, BookOpen, Layers } from "lucide-react";
import { DoctorFarmerLogo } from "@/components/DoctorFarmerLogo";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#f4f7f1] text-[#15211c] flex flex-col font-sans selection:bg-[#66a46c] selection:text-white">
      
      {/* Верхняя навигация */}
      <header className="w-full border-b border-[#dde5dc] bg-[#fbfcf9] sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-3">
          
          <div className="flex items-center gap-2.5 min-w-0">
            <DoctorFarmerLogo className="h-10 sm:h-12 w-auto" />
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
      <div className="md:hidden bg-[#e8efe5] border-b border-[#dde5dc] px-4 py-2 flex items-center justify-around text-xs font-bold text-[#194f38]">
        <Link href="/agro-helper">
          <span className="flex items-center gap-1.5 py-1 px-3 rounded-lg bg-white shadow-2xs">🌱 АгроПомощник</span>
        </Link>
        <div className="w-px h-4 bg-[#dde5dc]" />
        <Link href="/quiz">
          <span className="flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-white/60">📝 Тестирование</span>
        </Link>
      </div>

      {/* Hero-секция без графики — чистый премиальный фокус на инструментах */}
      <section className="relative overflow-hidden py-12 sm:py-20 md:py-24 flex-1 flex items-center max-w-5xl mx-auto px-4 sm:px-6 w-full text-center">
        <div className="w-full space-y-6 sm:space-y-8 z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#e8efe5] text-[#194f38] text-xs font-bold tracking-wide uppercase border border-[#dde5dc] mx-auto">
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
      <section className="bg-white py-16 sm:py-20 border-t border-[#dde5dc]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <Link href="/agro-helper">
              <div className="bg-[#f4f7f1] p-8 rounded-2xl border border-[#dde5dc] hover:border-[#2e7d52] transition-all shadow-xs cursor-pointer group flex flex-col justify-between h-full">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#e8efe5] flex items-center justify-center text-[#2e7d52] mb-6 group-hover:scale-105 transition-transform border border-[#dde5dc]">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-[#12352a] mb-2">АгроПомощник ДФ</h3>
                  <p className="text-[#6f7a73] text-sm leading-relaxed mb-6 font-medium">
                    Интерактивный подбор схем защиты растений с учётом технологий возделывания, точных норм из прайса, калькулятора площади и сохранения схем.
                  </p>
                </div>
                <div className="flex items-center text-[#194f38] font-bold text-xs uppercase tracking-wider gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Перейти к подбору схем</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

            <Link href="/quiz">
              <div className="bg-[#f4f7f1] p-8 rounded-2xl border border-[#dde5dc] hover:border-[#2e7d52] transition-all shadow-xs cursor-pointer group flex flex-col justify-between h-full">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#e8efe5] flex items-center justify-center text-[#2e7d52] mb-6 group-hover:scale-105 transition-transform border border-[#dde5dc]">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-[#12352a] mb-2">Тестирование</h3>
                  <p className="text-[#6f7a73] text-sm leading-relaxed mb-6 font-medium">
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
      <footer className="bg-[#fbfcf9] border-t border-[#dde5dc] py-8 text-[#6f7a73]">
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
