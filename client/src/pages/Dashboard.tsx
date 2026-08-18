import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, ArrowRight } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#F4F6F2] text-[#142319] flex flex-col font-sans">
      {/* Шапка с идеально чистым собственным знаком и крупным шрифтом */}
      <header className="border-b border-[#D5E1D5] bg-[#FFFFFF] sticky top-0 z-20 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:h-24 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center p-1 bg-emerald-50/50 rounded-2xl border border-emerald-100" aria-label="Doctor Farmer">
              <img 
                src="/manus-storage/doctor-farmer-custom-mark_23712a1e.png" 
                alt="Doctor Farmer Mark" 
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-sm" 
              />
            </div>
            <div className="leading-none space-y-1.5">
              <div className="font-mono text-xs font-bold tracking-[0.24em] text-[#194F38]">DOCTOR FARMER</div>
              <h1 className="font-extrabold text-lg sm:text-2xl tracking-tight text-[#142319]">Рабочий кабинет</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-gray-600 bg-[#EFEFE9] px-3.5 py-2 rounded-lg border border-[#E0E2D6]">
              KNOWLEDGE & FIELD LAB • 2026
            </span>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="max-w-5xl mx-auto px-4 py-8 sm:py-12 flex-1 w-full space-y-8">
        
        {/* Открытый, светлый и дорогой Hero-блок с видимой панорамой и текстом поверх легкой дымки */}
        <div className="relative overflow-hidden rounded-3xl bg-[#0F2D20] text-white p-8 sm:p-14 shadow-xl border border-emerald-900/40">
          <div className="absolute inset-0 opacity-80 pointer-events-none">
            <img 
              src="/manus-storage/doctor-farmer-elite-hero_486afb2e.png" 
              alt="Agronomy Landscape Panorama" 
              className="w-full h-full object-cover object-center scale-100"
            />
          </div>
          {/* Градиент только слева, чтобы текст читался идеально, а справа был виден красивый пейзаж */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0E2E20] via-[#0E2E20]/90 to-transparent pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl space-y-5">
            <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#F3E29F] bg-black/50 px-3.5 py-1.5 rounded-md border border-[#F3E29F]/40 inline-block backdrop-blur-xs">
              ПРОФЕССИОНАЛЬНАЯ АГРОНОМИЧЕСКАЯ СРЕДА
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white drop-shadow-md">
              Знания, которые работают на поле.
            </h2>
            <p className="text-base sm:text-lg text-emerald-100 leading-relaxed max-w-xl font-normal drop-shadow-sm">
              Единый комплекс для экспертов агрослужбы. Используйте АгроПомощник для точного регламентного подбора защиты и тест для аттестации продуктовой экспертизы.
            </p>
          </div>
        </div>

        {/* Карточки основных модулей */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          
          {/* Модуль 1: АгроПомощник */}
          <Card className="border-[#D5E1D5] shadow-md bg-white hover:border-[#194F38] transition-all flex flex-col justify-between rounded-2xl overflow-hidden">
            <CardHeader className="p-6 sm:p-8 pb-4">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#8A6A1F] bg-[#FDF8EC] px-3 py-1 rounded-md border border-[#EEDFA3]">
                  ОСНОВНОЙ РАБОЧИЙ ИНСТРУМЕНТ
                </span>
                <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-lg border border-emerald-200">
                  🌱
                </span>
              </div>
              <CardTitle className="text-2xl font-extrabold text-[#194F38]">
                АгроПомощник ДФ
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 sm:p-8 pt-0 space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
                <p>
                  Интерактивный подбор схем защиты культур с проверкой официальных регистраций из прайса:
                </p>
                <ul className="space-y-2 text-xs sm:text-sm text-gray-700 pl-1 font-mono">
                  <li className="flex items-center gap-2.5">✓ 10+ базовых культур с технологиями</li>
                  <li className="flex items-center gap-2.5">✓ Фильтрация этапов по вредным объектам</li>
                  <li className="flex items-center gap-2.5">✓ Калькулятор площади и канистр</li>
                  <li className="flex items-center gap-2.5">✓ Экспорт готовой схемы в PDF</li>
                </ul>
              </div>
              <div className="pt-4">
                <Link href="/agro-helper">
                  <Button className="w-full bg-[#194F38] text-white hover:bg-[#133C2B] flex items-center justify-center gap-2 text-sm sm:text-base font-semibold py-4 rounded-xl shadow-xs">
                    Открыть АгроПомощник <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Модуль 2: Тест знаний */}
          <Card className="border-[#D5E1D5] shadow-md bg-white hover:border-[#194F38] transition-all flex flex-col justify-between rounded-2xl overflow-hidden">
            <CardHeader className="p-6 sm:p-8 pb-4">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#194F38] bg-emerald-50 px-3 py-1 rounded-md border border-emerald-200">
                  АТТЕСТАЦИЯ И ЭКСПЕРТИЗА
                </span>
                <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-lg border border-emerald-200">
                  📝
                </span>
              </div>
              <CardTitle className="text-2xl font-extrabold text-[#194F38]">
                Тест на знание прайса
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 sm:p-8 pt-0 space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
                <p>
                  Проверка знаний продуктовой линейки компании с фиксированным таймером и разбором ошибок:
                </p>
                <ul className="space-y-2 text-xs sm:text-sm text-gray-700 pl-1 font-mono">
                  <li className="flex items-center gap-2.5">✓ 6 тематических пулов вопросов</li>
                  <li className="flex items-center gap-2.5">✓ Фиксированное время со звонком</li>
                  <li className="flex items-center gap-2.5">✓ Обучающий разбор после теста</li>
                  <li className="flex items-center gap-2.5">✓ Автоотчёт руководителю на почту</li>
                </ul>
              </div>
              <div className="pt-4">
                <Link href="/quiz">
                  <Button variant="outline" className="w-full border-2 border-[#194F38] text-[#194F38] hover:bg-[#194F38]/10 flex items-center justify-center gap-2 text-sm sm:text-base font-semibold py-4 rounded-xl">
                    Начать тест знаний <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Дополнительный информационный блок: Быстрые подсказки */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-[#D5E1D5] rounded-2xl p-5 space-y-2 shadow-xs">
            <div className="font-mono text-xs font-bold text-[#194F38] flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-emerald-100 flex items-center justify-center text-[10px]">01</span> Точный регламент
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Все препараты в АгроПомощнике сверяются с официальным каталогом и подтвержденными культурами.
            </p>
          </div>
          <div className="bg-white border border-[#D5E1D5] rounded-2xl p-5 space-y-2 shadow-xs">
            <div className="font-mono text-xs font-bold text-[#194F38] flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-emerald-100 flex items-center justify-center text-[10px]">02</span> Гибкие замены
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Агроном может заменять препараты прямо в схеме с учетом строгой совместимости задач и фаз.
            </p>
          </div>
          <div className="bg-white border border-[#D5E1D5] rounded-2xl p-5 space-y-2 shadow-xs">
            <div className="font-mono text-xs font-bold text-[#194F38] flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-emerald-100 flex items-center justify-center text-[10px]">03</span> Управленческий отчёт
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Результаты тестов мгновенно доставляются руководителям с детальной разбивкой по темам.
            </p>
          </div>
        </div>

        {/* Нижний колонтитул */}
        <div className="border border-[#D5E1D5] rounded-2xl p-5 bg-white/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 shadow-xs">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#194F38]" />
            <span>Платформа внутренней продуктовой экспертизы и агрономической поддержки Doctor Farmer.</span>
          </div>
          <span className="font-mono text-xs">Field Suite v2.4 • Ready</span>
        </div>

      </main>
    </div>
  );
}
