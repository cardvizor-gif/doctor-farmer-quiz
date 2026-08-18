import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ArrowRight, Cpu, FileSpreadsheet, Award, Lock } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#090D0B] text-[#E4E9E6] flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* Шапка с крупным векторным логотипом и темным статусным стилем */}
      <header className="border-b border-[#1A2620] bg-[#090D0B]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 sm:h-28 flex items-center justify-between">
          <div className="flex items-center gap-5">
            {/* Крупный точный векторный знак без рамки */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center p-1" aria-label="Doctor Farmer">
              <img 
                src="/manus-storage/doctor-farmer-exact-logo_4dbedae6.svg" 
                alt="Doctor Farmer" 
                className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(37,99,235,0.25)]" 
              />
            </div>
            <div className="leading-none space-y-2">
              <div className="font-mono text-xs font-bold tracking-[0.28em] text-emerald-400 uppercase">DOCTOR FARMER</div>
              <h1 className="font-extrabold text-xl sm:text-3xl tracking-tight text-white">Платформа экспертных решений</h1>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <span className="font-mono text-xs text-emerald-300/80 bg-emerald-950/40 px-4 py-2 rounded-full border border-emerald-800/40 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              SECURE FIELD ENVIRONMENT • 2026
            </span>
          </div>
        </div>
      </header>

      {/* Основной контент тёмного лендинга */}
      <main className="max-w-7xl mx-auto px-6 py-12 sm:py-16 flex-1 w-full space-y-12">
        
        {/* Главный Hero-блок (темный статусный дизайн) */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#111C16] via-[#0D1611] to-[#080C0A] border border-[#1E3026] p-8 sm:p-16 shadow-2xl">
          <div className="absolute -right-20 -top-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute right-10 bottom-0 opacity-15 pointer-events-none hidden lg:block">
            <img 
              src="/manus-storage/doctor-farmer-exact-logo_4dbedae6.svg" 
              alt="Watermark" 
              className="w-96 h-96 object-contain filter grayscale invert opacity-20" 
            />
          </div>
          
          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-amber-300 bg-amber-950/50 px-4 py-1.5 rounded-full border border-amber-600/30">
              <Lock className="w-3.5 h-3.5" /> ВНУТРЕННИЙ СЛУЖЕБНЫЙ КОМПЛЕКС
            </div>
            <h2 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] text-white">
              Агрономическая экспертиза нового поколения.
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 leading-relaxed font-light max-w-2xl">
              Интегрированная система для точного подбора схем защиты растений по регламентам прайса и оперативного контроля продуктовых знаний команды.
            </p>
          </div>
        </div>

        {/* Две ключевые рабочие карточки (Премиальный темный стиль) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Модуль 1: АгроПомощник */}
          <div className="group relative rounded-3xl bg-gradient-to-b from-[#121E18] to-[#0A100C] border border-[#1E3026] p-8 sm:p-10 shadow-xl hover:border-emerald-500/50 transition-all duration-300 flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full pointer-events-none group-hover:bg-emerald-500/10 transition-all"></div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-wider text-amber-400 bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-600/30">
                  ПЕРЕДОВЙ ИНСТРУМЕНТ
                </span>
                <span className="w-12 h-12 rounded-2xl bg-emerald-950/60 text-emerald-400 flex items-center justify-center border border-emerald-800/40 text-xl font-bold">
                  🌱
                </span>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  АгроПомощник ДФ
                </h3>
                <p className="text-gray-400 text-sm sm:text-base leading-relaxed font-light">
                  Интерактивный подбор схем защиты культур с проверкой официальных регистраций из прайса, фильтрацией задач и калькулятором расхода.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="bg-[#080D0B] p-3.5 rounded-xl border border-[#17251E] flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-xs text-gray-300 font-mono">10+ культур и технологий</span>
                </div>
                <div className="bg-[#080D0B] p-3.5 rounded-xl border border-[#17251E] flex items-center gap-3">
                  <Cpu className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-xs text-gray-300 font-mono">Калькулятор площади</span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <Link href="/agro-helper">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-base py-6 rounded-2xl shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-3 transition-all">
                  Открыть АгроПомощник <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Модуль 2: Тест знаний */}
          <div className="group relative rounded-3xl bg-gradient-to-b from-[#121E18] to-[#0A100C] border border-[#1E3026] p-8 sm:p-10 shadow-xl hover:border-blue-500/50 transition-all duration-300 flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full pointer-events-none group-hover:bg-blue-500/10 transition-all"></div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-wider text-blue-400 bg-blue-950/40 px-3 py-1.5 rounded-lg border border-blue-600/30">
                  АТТЕСТАЦИЯ И ЭКСПЕРТИЗА
                </span>
                <span className="w-12 h-12 rounded-2xl bg-blue-950/60 text-blue-400 flex items-center justify-center border border-blue-800/40 text-xl font-bold">
                  📝
                </span>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Тест на знание прайса
                </h3>
                <p className="text-gray-400 text-sm sm:text-base leading-relaxed font-light">
                  Проверка знаний продуктовой линейки компании с фиксированным таймером, звуковым сигналом, разбором ошибок и автоотчётом.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="bg-[#080D0B] p-3.5 rounded-xl border border-[#17251E] flex items-center gap-3">
                  <Award className="w-5 h-5 text-blue-400 shrink-0" />
                  <span className="text-xs text-gray-300 font-mono">6 тематических пулов</span>
                </div>
                <div className="bg-[#080D0B] p-3.5 rounded-xl border border-[#17251E] flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
                  <span className="text-xs text-gray-300 font-mono">Автоотчёт руководителю</span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <Link href="/quiz">
                <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base py-6 rounded-2xl shadow-lg shadow-blue-900/30 flex items-center justify-center gap-3 transition-all">
                  Начать тест знаний <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>

        </div>

        {/* Статусная строка информации */}
        <div className="border border-[#1E3026] rounded-2xl p-6 bg-[#0B130F] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-950 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span>Корпоративный комплекс продуктовой экспертизы и агрономической поддержки Doctor Farmer.</span>
          </div>
          <span className="font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded border border-emerald-800/50">
            SYSTEM STATUS: ONLINE • 2026
          </span>
        </div>

      </main>
    </div>
  );
}
