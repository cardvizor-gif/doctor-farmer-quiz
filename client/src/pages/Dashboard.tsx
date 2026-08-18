import { Link } from "wouter";
import { ArrowRight, ShieldCheck, Award, BookOpen, Layers } from "lucide-react";

const LOGO_IMAGE = "/manus-storage/doctor-farmer-mark_1fd4bf89.png";
const ILLUSTRATION_IMAGE = "/manus-storage/8bc6dbd5-1270-4733-b922-88eb93484a1b_6292d44e.webp";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#f4f7f1] text-[#15211c] flex flex-col font-sans selection:bg-[#66a46c] selection:text-white">
      
      {/* Верхняя навигация в едином стиле теста */}
      <header className="w-full border-b border-[#dde5dc] bg-[#fbfcf9] sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <img src={LOGO_IMAGE} alt="Doctor Farmer" className="w-11 h-11 object-contain mix-blend-multiply" />
            <div>
              <span className="font-bold tracking-tight text-sm sm:text-base text-[#12352a]">DOCTOR FARMER</span>
              <span className="block text-[10px] text-[#6f7a73] font-mono tracking-wider">knowledge lab / 2026</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-xs font-semibold text-[#194f38] uppercase tracking-wider">
            <Link href="/agro-helper">
              <span className="cursor-pointer hover:text-[#d5a642] transition-colors">АгроПомощник</span>
            </Link>
            <Link href="/quiz">
              <span className="cursor-pointer hover:text-[#d5a642] transition-colors">Тест на знание прайса</span>
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <span className="hidden lg:inline-block text-[11px] font-mono text-[#6f7a73] bg-[#e8efe5] px-3 py-1 rounded-full border border-[#dde5dc]">
              Внутренний тренинг
            </span>
            <Link href="/agro-helper">
              <button className="bg-[#194f38] hover:bg-[#12352a] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs">
                Открыть АгроПомощник
              </button>
            </Link>
          </div>

        </div>
      </header>

      {/* Hero-секция с эталонным чистым коллажем */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-16 md:pb-24 flex-1 flex items-center max-w-7xl mx-auto px-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
          
          <div className="lg:col-span-6 space-y-6 z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#e8efe5] text-[#194f38] text-xs font-bold tracking-wide uppercase border border-[#dde5dc]">
              <ShieldCheck className="w-4 h-4 text-[#2e7d52]" /> Рабочий кабинет команды
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#12352a] leading-[1.12]">
              Профессиональная <br />
              <span className="text-[#2e7d52]">экспертиза на поле</span>
            </h1>

            <p className="text-[#6f7a73] text-base sm:text-lg max-w-lg leading-relaxed font-medium">
              Единый цифровой инструмент для точного подбора регламентов защиты растений и оперативной аттестации продуктовых знаний команды.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link href="/agro-helper">
                <button className="bg-[#194f38] hover:bg-[#12352a] text-white font-bold text-sm px-8 py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group">
                  <span>АгроПомощник ДФ</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <Link href="/quiz">
                <button className="bg-white hover:bg-[#e8efe5] text-[#194f38] font-bold text-sm px-8 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 border border-[#dde5dc] shadow-xs">
                  <Award className="w-4 h-4 text-[#d5a642]" />
                  <span>Тест на знание прайса</span>
                </button>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 relative flex justify-center lg:justify-end">
            <div className="w-full max-w-xl relative p-3 bg-white rounded-3xl border border-[#dde5dc] shadow-xl">
              <img 
                src={ILLUSTRATION_IMAGE} 
                alt="Agronomic Style Illustration" 
                className="w-full h-auto rounded-2xl object-cover shadow-inner"
              />
            </div>
          </div>

        </div>
      </section>

      {/* Карточки модулей снизу в палитре теста */}
      <section className="bg-white py-16 border-t border-[#dde5dc]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <Link href="/agro-helper">
              <div className="bg-[#f4f7f1] p-8 rounded-2xl border border-[#dde5dc] hover:border-[#2e7d52] transition-all shadow-xs cursor-pointer group flex flex-col justify-between h-full">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#e8efe5] flex items-center justify-center text-[#2e7d52] mb-6 group-hover:scale-105 transition-transform border border-[#dde5dc]">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-[#12352a] mb-2">АгроПомощник ДФ</h3>
                  <p className="text-[#6f7a73] text-sm leading-relaxed mb-6 font-medium">
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
              <div className="bg-[#f4f7f1] p-8 rounded-2xl border border-[#dde5dc] hover:border-[#2e7d52] transition-all shadow-xs cursor-pointer group flex flex-col justify-between h-full">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#e8efe5] flex items-center justify-center text-[#2e7d52] mb-6 group-hover:scale-105 transition-transform border border-[#dde5dc]">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-[#12352a] mb-2">Тест на знание прайса</h3>
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
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
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
