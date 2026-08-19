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

          {/* Кнопка в шапке удалена по требованию пользователя */}

        </div>
      </header>

      {/* Мобильная панель быстрого переключения удалена по требованию пользователя */}

      {/* Hero-секция с белым фоном и отчётливой зелёной мозаикой пиктограмм */}
      <section className="relative overflow-hidden py-14 sm:py-22 md:py-28 flex-1 flex items-center max-w-5xl mx-auto px-4 sm:px-6 w-full text-center z-10 bg-white text-[#12352a] shadow-lg rounded-3xl my-6 mx-4 sm:mx-auto border border-[#dde5dc]">
        
        {/* Мозаика из зелёных пиктограмм культур на белом фоне */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none" aria-hidden="true">
          <div className="absolute inset-0 grid grid-cols-3 sm:grid-cols-4 grid-rows-3 gap-3 sm:gap-6 p-5 sm:p-8 opacity-[0.22]">
            {[
              ["/manus-storage/df-green-wheat_icon_5f103e9a.png", "Пшеница"],
              ["/manus-storage/df-green-barley_icon_4f609506.png", "Ячмень"],
              ["/manus-storage/df-green-corn_icon_6c35bf86.png", "Кукуруза"],
              ["/manus-storage/df-green-oats_icon_f913a11f.png", "Овёс"],
              ["/manus-storage/df-green-rapeseed_icon_f8c194b4.png", "Рапс"],
              ["/manus-storage/df-green-sunflower_icon_011ba21e.png", "Подсолнечник"],
              ["/manus-storage/df-green-pea_icon_fa7f50ea.png", "Горох"],
              ["/manus-storage/df-green-corn_icon_6c35bf86.png", "Кукуруза"],
              ["/manus-storage/df-green-oats_icon_f913a11f.png", "Овёс"],
              ["/manus-storage/df-green-sunflower_icon_011ba21e.png", "Подсолнечник"],
              ["/manus-storage/df-green-rapeseed_icon_f8c194b4.png", "Рапс"],
              ["/manus-storage/df-green-barley_icon_4f609506.png", "Ячмень"],
            ].map(([src, alt], index) => (
              <div key={`${src}-${index}`} className={`flex items-center justify-center ${index % 3 === 1 ? "translate-y-3 sm:translate-y-5" : ""}`}>
                <img src={src} alt={alt} className="h-full w-full object-contain drop-shadow-[0_2px_6px_rgba(25,79,56,0.12)]" />
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
              <div role="button" className="bg-[#194f38] hover:bg-[#12352a] text-white font-bold text-sm px-8 py-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group w-full sm:w-auto">
                <span>АгроПомощник ДФ</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
            <Link href="/quiz">
              <div role="button" className="bg-white hover:bg-[#e8efe5] text-[#194f38] font-bold text-sm px-8 py-4 rounded-xl transition-all flex items-center justify-center gap-2 border border-[#dde5dc] shadow-xs w-full sm:w-auto">
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
