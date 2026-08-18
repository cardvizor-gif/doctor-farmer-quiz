import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, ArrowRight } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#F7F9F6] text-[#1B2A1E] flex flex-col font-sans">
      {/* Шапка */}
      <header className="border-b border-[#DDE6DD] bg-[#FFFDF8] sticky top-0 z-20 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center" aria-label="Doctor Farmer">
              <img src="/manus-storage/doctor-farmer-mark_1fd4bf89.png" alt="Doctor Farmer" className="w-10 h-10 object-contain" />
            </div>
            <div className="leading-none">
              <div className="font-mono text-[10px] font-bold tracking-[0.18em] text-[#194F38]">DOCTOR FARMER</div>
              <h1 className="mt-1 font-bold text-sm sm:text-base tracking-tight text-[#194F38]">Рабочий кабинет</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-gray-500 bg-[#F5F5ED] px-2.5 py-1 rounded-md border border-[#E6E9DF]">
              KNOWLEDGE & FIELD LAB • 2026
            </span>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="max-w-5xl mx-auto px-4 py-6 sm:py-10 flex-1 w-full space-y-6">
        
        {/* Баннер */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#194F38] to-[#143D2C] text-white p-6 sm:p-8 shadow-md">
          <div className="relative z-10 max-w-2xl space-y-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#E7D68D] bg-[#143D2C]/80 px-2.5 py-1 rounded border border-[#E7D68D]/30 inline-block">
              ПРОФЕССИОНАЛЬНАЯ СРЕДА КОМАНДЫ
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Знания, которые работают на поле.
            </h2>
            <p className="text-sm text-emerald-100/90 leading-relaxed">
              Единый рабочий комплекс для полевых специалистов. Используйте АгроПомощник для точного подбора схем защиты по официальным регламентам и тест для проверки продуктовой экспертизы команды.
            </p>
          </div>
          <div className="absolute right-[-10px] bottom-[-20px] opacity-10 text-9xl pointer-events-none font-bold">
            🌾
          </div>
        </div>

        {/* Карточки основных модулей */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          
          {/* Модуль 1: АгроПомощник */}
          <Card className="border-[#DDE6DD] shadow-xs bg-[#FFFDF8] hover:border-[#194F38]/40 transition-all flex flex-col justify-between">
            <CardHeader className="p-5 sm:p-6 pb-3">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#8A6A1F] bg-[#F8F0CD] px-2.5 py-1 rounded-md border border-[#E7D68D]">
                  ОСНОВНОЙ РАБОЧИЙ ИНСТРУМЕНТ
                </span>
                <span className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base">
                  🌱
                </span>
              </div>
              <CardTitle className="text-xl font-bold text-[#194F38]">
                АгроПомощник ДФ
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 pt-0 space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-2.5 text-xs sm:text-sm text-gray-600 leading-relaxed">
                <p>
                  Интерактивный подбор схем защиты культур с проверкой официальных регистраций из прайса:
                </p>
                <ul className="space-y-1.5 text-xs text-gray-700 pl-1 font-mono">
                  <li className="flex items-center gap-2">✓ 10+ базовых культур с технологиями</li>
                  <li className="flex items-center gap-2">✓ Фильтрация этапов по вредным объектам</li>
                  <li className="flex items-center gap-2">✓ Калькулятор площади и канистр</li>
                  <li className="flex items-center gap-2">✓ Экспорт готовой схемы в PDF</li>
                </ul>
              </div>
              <div className="pt-3">
                <Link href="/agro-helper">
                  <Button className="w-full bg-[#194F38] text-white hover:bg-[#143D2C] flex items-center justify-center gap-2 text-xs sm:text-sm font-medium py-3">
                    Открыть АгроПомощник <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Модуль 2: Тест знаний */}
          <Card className="border-[#DDE6DD] shadow-xs bg-[#FFFDF8] hover:border-[#194F38]/40 transition-all flex flex-col justify-between">
            <CardHeader className="p-5 sm:p-6 pb-3">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#194F38] bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  АТТЕСТАЦИЯ И ЭКСПЕРТИЗА
                </span>
                <span className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base">
                  📝
                </span>
              </div>
              <CardTitle className="text-xl font-bold text-[#194F38]">
                Тест на знание прайса
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 pt-0 space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-2.5 text-xs sm:text-sm text-gray-600 leading-relaxed">
                <p>
                  Проверка знаний продуктовой линейки компании с фиксированным таймером и разбором ошибок:
                </p>
                <ul className="space-y-1.5 text-xs text-gray-700 pl-1 font-mono">
                  <li className="flex items-center gap-2">✓ 6 тематических пулов вопросов</li>
                  <li className="flex items-center gap-2">✓ Фиксированное время со звонком</li>
                  <li className="flex items-center gap-2">✓ Обучающий разбор после теста</li>
                  <li className="flex items-center gap-2">✓ Автоотчёт руководителю на почту</li>
                </ul>
              </div>
              <div className="pt-3">
                <Link href="/quiz">
                  <Button variant="outline" className="w-full border-[#194F38] text-[#194F38] hover:bg-[#194F38]/10 flex items-center justify-center gap-2 text-xs sm:text-sm font-medium py-3">
                    Начать тест знаний <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Дополнительный информационный блок: Быстрые подсказки */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-[#DDE6DD] rounded-xl p-4 space-y-1.5 shadow-xs">
            <div className="font-mono text-[11px] font-bold text-[#194F38] flex items-center gap-1.5">
              <span>01</span> Точный регламент
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Все препараты в АгроПомощнике сверяются с официальным каталогом и подтвержденными культурами.
            </p>
          </div>
          <div className="bg-white border border-[#DDE6DD] rounded-xl p-4 space-y-1.5 shadow-xs">
            <div className="font-mono text-[11px] font-bold text-[#194F38] flex items-center gap-1.5">
              <span>02</span> Гибкие замены
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Агроном может заменять препараты прямо в схеме с учетом строгой совместимости задач и фаз.
            </p>
          </div>
          <div className="bg-white border border-[#DDE6DD] rounded-xl p-4 space-y-1.5 shadow-xs">
            <div className="font-mono text-[11px] font-bold text-[#194F38] flex items-center gap-1.5">
              <span>03</span> Управленческий отчёт
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Результаты тестов мгновенно доставляются руководителям с детальной разбивкой по темам.
            </p>
          </div>
        </div>

        {/* Нижний колонтитул */}
        <div className="border border-[#DDE6DD] rounded-xl p-4 bg-white/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#194F38]" />
            <span>Платформа внутренней продуктовой экспертизы и агрономической поддержки Doctor Farmer.</span>
          </div>
          <span className="font-mono text-[10px]">Field Suite v2.4 • Ready</span>
        </div>

      </main>
    </div>
  );
}
