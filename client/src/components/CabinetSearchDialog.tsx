import { Search, Sprout } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { cabinetNavigation } from "./CabinetShell";

const searchDescriptions: Record<string, string> = {
  "/": "Главный обзор рабочих инструментов",
  "/agro-helper": "Подбор схем защиты растений",
  "/farms": "Карточки хозяйств и клиентская база",
  "/proposals/new": "Расчёт и подготовка коммерческого предложения",
  "/knowledge-base": "Препараты, регламенты и действующие вещества",
  "/quiz": "Проверка продуктовой экспертизы",
};

export default function CabinetSearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("ru-RU");
    if (!term) return cabinetNavigation;
    return cabinetNavigation.filter((item) => `${item.label} ${searchDescriptions[item.href]}`.toLocaleLowerCase("ru-RU").includes(term));
  }, [query]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(timer);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-[#173f30]/35 px-4 pt-[12vh] backdrop-blur-sm" onMouseDown={onClose} role="presentation">
      <section className="w-full max-w-xl overflow-hidden rounded-3xl border border-white/70 bg-white shadow-[0_24px_70px_rgba(22,61,39,0.28)]" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Поиск по кабинету">
        <div className="flex items-center gap-3 border-b border-[#e6ede4] px-5 py-4">
          <Search className="h-5 w-5 text-[#5c7b63]" />
          <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") onClose(); }} className="min-w-0 flex-1 bg-transparent text-base font-semibold text-[#173f30] outline-none placeholder:text-[#91a18f]" placeholder="Найдите раздел или инструмент" />
          <kbd className="rounded-md border border-[#dce7da] bg-[#f6faf4] px-2 py-1 text-[10px] font-bold text-[#5c7b63]">ESC</kbd>
        </div>
        <div className="p-3">
          <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#7a947b]">Разделы кабинета</p>
          {results.length ? results.map((item) => {
            const Icon = item.icon;
            return <button key={item.href} type="button" onClick={() => { setLocation(item.href); onClose(); }} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-[#eef6e8] focus:bg-[#eef6e8] focus:outline-none">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e9f5dd] text-[#4e7c25]"><Icon className="h-4 w-4" /></span>
              <span className="min-w-0"><strong className="block text-sm text-[#1d4a2b]">{item.label}</strong><span className="mt-0.5 block text-xs text-[#718170]">{searchDescriptions[item.href]}</span></span>
            </button>;
          }) : <div className="px-4 py-10 text-center"><Sprout className="mx-auto mb-3 h-7 w-7 text-[#9ab47b]" /><p className="text-sm font-semibold text-[#305638]">Ничего не найдено</p><p className="mt-1 text-xs text-[#758374]">Попробуйте название раздела или инструмента.</p></div>}
        </div>
      </section>
    </div>
  );
}
