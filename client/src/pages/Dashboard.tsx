import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Award, BookOpen, Building2, FileText, HelpCircle, Layers3, Sprout } from "lucide-react";
import { DoctorFarmerLogo } from "@/components/DoctorFarmerLogo";
import { SupportModal } from "@/components/SupportModal";

const modules = [
  {
    title: "АгроПомощник",
    description: "Подберите готовую схему защиты по культуре, технологии и площади.",
    action: "Открыть схему",
    href: "/agro-helper",
    icon: Layers3,
    tone: "emerald",
  },
  {
    title: "Хозяйства",
    description: "Ведите карточки клиентов, площади, культуры и следующие действия.",
    action: "Открыть реестр",
    href: "/farms",
    icon: Building2,
    tone: "sage",
  },
  {
    title: "Генератор КП",
    description: "Сформируйте расчёт по схеме, прайсу, фасовкам и условиям оплаты.",
    action: "Создать КП",
    href: "/proposals/new",
    icon: FileText,
    tone: "gold",
  },
  {
    title: "База знаний",
    description: "Используйте справочник препаратов, действующих веществ и регламентов.",
    action: "Открыть справочник",
    href: "/knowledge-base",
    icon: BookOpen,
    tone: "blue",
  },
  {
    title: "Тестирование",
    description: "Проверьте продуктовую экспертизу и закрепите материал по культурам.",
    action: "Начать тест",
    href: "/quiz",
    icon: Award,
    tone: "violet",
  },
] as const;

const toneClasses = {
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100 group-hover:bg-emerald-600",
  sage: "bg-lime-50 text-lime-700 ring-lime-100 group-hover:bg-lime-600",
  gold: "bg-amber-50 text-amber-700 ring-amber-100 group-hover:bg-amber-500",
  blue: "bg-sky-50 text-sky-700 ring-sky-100 group-hover:bg-sky-600",
  violet: "bg-violet-50 text-violet-700 ring-violet-100 group-hover:bg-violet-600",
} as const;

export default function Dashboard() {
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  return (
    <div className="min-h-screen bg-transparent text-[#25243a] selection:bg-violet-200">
      <header className="sticky top-0 z-30 border-b border-[#dde5dc] bg-[#fbfcf9]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:h-20 sm:px-6">
          <Link href="/" className="shrink-0" aria-label="Doctor Farmer — рабочий кабинет">
            <DoctorFarmerLogo className="h-10 w-auto sm:h-12" clickable={false} />
          </Link>
          <nav className="hidden items-center gap-5 text-[11px] font-bold uppercase tracking-[0.09em] text-[#315443] lg:flex">
            {modules.map((module) => <Link key={module.href} href={module.href} className="transition-colors hover:text-[#c99228]">{module.title}</Link>)}
          </nav>
          <Link href="/proposals/new" className="rounded-lg border border-[#194f38] px-3 py-2 text-xs font-bold text-[#194f38] transition-colors hover:bg-[#194f38] hover:text-white sm:px-4">
            Новое КП
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-0 py-0">
        <section className="overview-hero mb-7">
          <div className="overview-hero-copy">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-violet-100">
              <Sprout className="h-3.5 w-3.5 text-lime-300" /> Doctor Farmer · рабочий кабинет
            </div>
            <h2>Управляйте полями,<br />схемами и КП в одном месте</h2>
            <p>Рабочее пространство менеджера и агронома: контекст хозяйства, защита культуры, прозрачный расчёт и обучение команды.</p>
            <div className="mt-6 flex flex-wrap gap-2"><Link href="/farms" className="overview-hero-action">Открыть хозяйства</Link><Link href="/proposals/new" className="overview-hero-quiet">Создать КП</Link></div>
          </div>
          <div className="overview-hero-stat-grid">
            <div><strong>5</strong><span>рабочих модулей</span></div>
            <div><strong>1</strong><span>единый кабинет</span></div>
          </div>
        </section>

        <section aria-label="Основные модули рабочего кабинета" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Link key={module.href} href={module.href} className="group min-h-[238px] rounded-2xl border border-[#e5e4ec] bg-white p-5 shadow-[0_8px_24px_rgba(39,37,61,0.045)] transition-all duration-200 hover:-translate-y-1 hover:border-[#c8c5df] hover:shadow-[0_16px_32px_rgba(39,37,61,0.10)]">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 transition-colors duration-200 group-hover:text-white ${toneClasses[module.tone]}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-7 text-lg font-extrabold tracking-tight text-[#12352a]">{module.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[#66766b]">{module.description}</p>
                <div className="mt-7 flex items-center gap-2 border-t border-[#e5ece4] pt-4 text-xs font-bold text-[#194f38]">
                  <span>{module.action}</span><ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </section>

        <section className="mt-7 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-[#edebf7] p-4 text-sm text-[#56516f]"><strong className="block text-[#2d2a50]">Для агронома</strong><span className="mt-1 block">Схемы защиты, нормы и регламенты применения.</span></div>
          <div className="rounded-xl bg-[#fff2db] p-4 text-sm text-[#77603c]"><strong className="block text-[#573e1a]">Для менеджера</strong><span className="mt-1 block">Хозяйства, расчёт КП, фасовки и условия оплаты.</span></div>
          <div className="rounded-xl bg-[#e8f1ff] p-4 text-sm text-[#465f7d]"><strong className="block text-[#253d60]">Для команды</strong><span className="mt-1 block">База знаний и проверка продуктовой экспертизы.</span></div>
        </section>
      </main>

      <footer className="border-t border-[#e5e4ec] bg-transparent px-0 py-5 text-xs text-[#858498]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 sm:flex-row">
          <span>Doctor Farmer · рабочий портал</span>
          <button type="button" onClick={() => setIsSupportOpen(true)} className="inline-flex items-center gap-1 font-semibold text-[#194f38] hover:underline"><HelpCircle className="h-3.5 w-3.5" />Поддержка</button>
        </div>
      </footer>

      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
    </div>
  );
}
