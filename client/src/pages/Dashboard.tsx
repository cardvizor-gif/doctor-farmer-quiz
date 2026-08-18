import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ArrowRight, FileSpreadsheet, Award, CheckCircle2 } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Шапка в светлых тонах с крупным логотипом пользователя */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 py-4 sm:h-24 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center p-0.5" aria-label="Doctor Farmer">
              <img 
                src="/manus-storage/doctor-farmer-exact-logo_4dbedae6.svg" 
                alt="Doctor Farmer" 
                className="w-full h-full object-contain" 
              />
            </div>
            <div className="leading-none space-y-1.5">
              <div className="font-mono text-xs font-bold tracking-[0.24em] text-blue-600 uppercase">DOCTOR FARMER</div>
              <h1 className="font-extrabold text-lg sm:text-2xl tracking-tight text-slate-900">Рабочий кабинет</h1>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <span className="font-mono text-xs text-slate-600 bg-slate-100 px-3.5 py-1.5 rounded-full border border-slate-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              FIELD LAB ENVIRONMENT • 2026
            </span>
          </div>
        </div>
      </header>

      {/* Основной контент светлого премиального лендинга */}
      <main className="max-w-7xl mx-auto px-6 py-10 sm:py-16 flex-1 w-full space-y-10">
        
        {/* Главный Hero-блок (светлый, статусный, чистый дизайн) */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-8 sm:p-16 shadow-xl shadow-slate-100">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-blue-50/60 to-transparent pointer-events-none"></div>
          
          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-blue-700 bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> СЛУЖЕБНЫЙ АГРОНОМИЧЕСКИЙ КОМПЛЕКС
            </div>
            <h2 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.15] text-slate-900">
              Профессиональная экспертиза на каждом поле.
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed font-normal max-w-2xl">
              Единый цифровой инструмент для точного подбора регламентов защиты растений и оперативной аттестации продуктовых знаний команды.
            </p>
          </div>
        </div>

        {/* Две ключевые рабочие карточки (Светлый премиальный стиль) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Модуль 1: АгроПомощник */}
          <div className="group relative rounded-3xl bg-white border border-slate-200 p-8 sm:p-10 shadow-lg shadow-slate-100 hover:border-emerald-500/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-semibold">
                  ОСНОВНОЙ РАБОЧИЙ ИНСТРУМЕНТ
                </span>
                <span className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl font-bold shadow-xs">
                  🌱
                </span>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  АгроПомощник ДФ
                </h3>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-normal">
                  Интерактивный подбор схем защиты культур с проверкой официальных регистраций из прайса, фильтрацией задач и калькулятором расхода.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="text-xs text-slate-700 font-mono font-medium">10+ культур и технологий</span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="text-xs text-slate-700 font-mono font-medium">Регламенты и канистры</span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <Link href="/agro-helper">
                <Button className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-base py-6 rounded-2xl shadow-md flex items-center justify-center gap-3 transition-all">
                  Открыть АгроПомощник <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Модуль 2: Тест знаний */}
          <div className="group relative rounded-3xl bg-white border border-slate-200 p-8 sm:p-10 shadow-lg shadow-slate-100 hover:border-blue-500/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 font-semibold">
                  АТТЕСТАЦИЯ И ЭКСПЕРТИЗА
                </span>
                <span className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold shadow-xs">
                  📝
                </span>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Тест на знание прайса
                </h3>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-normal">
                  Проверка знаний продуктовой линейки компании с фиксированным таймером, звуковым сигналом, разбором ошибок и автоотчётом.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 flex items-center gap-3">
                  <Award className="w-5 h-5 text-blue-600 shrink-0" />
                  <span className="text-xs text-slate-700 font-mono font-medium">6 тематических пулов</span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                  <span className="text-xs text-slate-700 font-mono font-medium">Автоотчёт руководителю</span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <Link href="/quiz">
                <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base py-6 rounded-2xl shadow-md flex items-center justify-center gap-3 transition-all">
                  Начать тест знаний <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>

        </div>

        {/* Статусная строка информации */}
        <div className="border border-slate-200 rounded-2xl p-6 bg-white flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-200">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span>Корпоративный комплекс продуктовой экспертизы и агрономической поддержки Doctor Farmer.</span>
          </div>
          <span className="font-mono text-blue-700 bg-blue-50 px-3 py-1 rounded-md border border-blue-200 font-semibold">
            SYSTEM STATUS: ONLINE • 2026
          </span>
        </div>

      </main>
    </div>
  );
}
