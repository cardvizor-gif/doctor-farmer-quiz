import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, ShieldCheck, Award, BookOpen, Layers } from "lucide-react";
import { DoctorFarmerLogo } from "@/components/DoctorFarmerLogo";
import { SupportModal } from "@/components/SupportModal";
import { HelpCircle } from "lucide-react";

export default function Dashboard() {
  const [isSupportOpen, setIsSupportOpen] = useState(false);
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

        </div>
      </header>

      {/* Hero-секция с белым фоном и отчётливой зелёной мозаикой пиктограмм */}
      <section className="relative overflow-hidden py-14 sm:py-22 md:py-28 flex-1 flex items-center max-w-5xl mx-auto px-4 sm:px-6 w-full text-center z-10 bg-white text-[#12352a] shadow-lg rounded-3xl my-6 mx-4 sm:mx-auto border border-[#dde5dc]">
        
        {/* Встроенная векторная мозаика агрономических культур (гарантированно работает везде) */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none" aria-hidden="true">
          <div className="absolute inset-0 grid grid-cols-3 sm:grid-cols-4 grid-rows-3 gap-3 sm:gap-6 p-5 sm:p-8 opacity-[0.20]">
            {[
              "Овёс", "Кукуруза", "Горох", "Рапс", "Ячмень", "Овёс", "Кукуруза", "Горох", "Рапс", "Ячмень", "Овёс", "Кукуруза"
            ].map((name, index) => (
              <div key={`${name}-${index}`} className={`flex items-center justify-center text-[#194f38] ${index % 3 === 1 ? "translate-y-3 sm:translate-y-5" : ""}`}>
                <svg className="w-12 h-12 sm:w-16 sm:h-16 text-[#194f38]/80 drop-shadow-[0_2px_4px_rgba(25,79,56,0.12)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  {index % 5 === 0 && (
                    /* Колос овса / зерновых */
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6M8 9h8M8 15h8" />
                  )}
                  {index % 5 === 1 && (
                    /* Початок кукурузы */
                    <path d="M12 2v20M15 4H9a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM9 9h6M9 13h6M9 17h6" />
                  )}
                  {index % 5 === 2 && (
                    /* Горох в стручке */
                    <path d="M4 20c4 0 8-4 10-10C16 6 18 4 20 2M6 18c3-1 6-4 7-8M9 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm4 4a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                  )}
                  {index % 5 === 3 && (
                    /* Рапс (цветки / стебель) */
                    <path d="M12 22V10M12 10c-3-3-6-3-8-1M12 10c3-3 6-3 8-1M12 6c-2-2-4-2-6 0M12 6c2-2 4-2 6 0" />
                  )}
                  {index % 5 === 4 && (
                    /* Ячмень */
                    <path d="M12 2v20M16 4l-4 4-4-4M16 10l-4 4-4-4M16 16l-4 4-4-4" />
                  )}
                </svg>
              </div>
            ))}
          </div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.98)_0%,rgba(255,255,255,0.85)_48%,rgba(255,255,255,0.45)_100%)]" />
        </div>

        <div className="w-full space-y-6 sm:space-y-8 max-w-3xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e8efe5] text-[#194f38] text-xs font-bold tracking-wide uppercase border border-[#dde5dc] mx-auto shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-[#2e7d52]" /> Рабочий кабинет команды
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold font-dm tracking-tight text-[#12352a] leading-[1.2]">
            Профессиональная <br />
            <span className="text-[#2e7d52]">экспертиза на поле</span>
          </h1>

          <p className="text-[#6f7a73] text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-medium">
            Единое пространство агрономических решений.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/agro-helper">
              <div role="button" className="bg-[#194f38] hover:bg-[#12352a] text-white font-bold text-sm px-8 py-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group w-full sm:w-auto cursor-pointer">
                <span>АгроПомощник ДФ</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
            <Link href="/quiz">
              <div role="button" className="bg-white hover:bg-[#e8efe5] text-[#194f38] font-bold text-sm px-8 py-4 rounded-xl transition-all flex items-center justify-center gap-2 border border-[#dde5dc] shadow-xs w-full sm:w-auto cursor-pointer">
                <Award className="w-4 h-4 text-[#d5a642]" />
                <span>Тестирование</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Карточки модулей снизу */}
      <section className="bg-white py-16 sm:py-20 border-t border-[#dde5dc] relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
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
                    <Award className="w-6 h-6" />
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

            <Link href="/knowledge-base">
              <div className="bg-[#f4f7f1] p-8 rounded-2xl border border-[#dde5dc] hover:border-[#2e7d52] transition-all shadow-xs cursor-pointer group flex flex-col justify-between h-full">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#e8efe5] flex items-center justify-center text-[#2e7d52] mb-6 group-hover:scale-105 transition-transform border border-[#dde5dc]">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-[#12352a] mb-2 flex items-center justify-between">
                    <span>База знаний</span>
                    <ArrowRight className="w-5 h-5 text-[#2e7d52] group-hover:translate-x-1 transition-transform" />
                  </h3>
                  <p className="text-sm text-[#6f7a73] leading-relaxed font-medium">
                    Справочник действующих веществ, препаратов каталога, регламентов применения и агрономических регламентов защиты.
                  </p>
                </div>
                <div className="mt-8 pt-4 border-t border-[#dde5dc] flex items-center gap-2 text-xs font-bold text-[#194f38]">
                  <span>Открыть справочник</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* Футер */}
      <footer className="bg-[#fbfcf9] border-t border-[#dde5dc] py-8 px-4 sm:px-6 text-xs text-[#6f7a73] relative z-10">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <DoctorFarmerLogo className="h-6 w-auto" />
            <span className="font-bold text-[#12352a]">DOCTOR FARMER</span>
          </div>
          <p>© 2026 ООО ТД Доктор Фармер. Внутренний корпоративный портал.</p>
          <span 
            onClick={() => setIsSupportOpen(true)}
            className="cursor-pointer text-[#194f38] font-semibold hover:underline inline-flex items-center gap-1 justify-center"
          >
            <HelpCircle className="w-3.5 h-3.5" /> Поддержка
          </span>
        </div>
      </footer>

      {/* Модальное окно поддержки */}
      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />

    </div>
  );
}
