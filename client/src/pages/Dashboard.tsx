import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Award, BookOpen, Building2, FileText, HelpCircle, Layers3, Sprout } from "lucide-react";
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
      <main className="dashboard-v2 mx-auto max-w-7xl px-0 py-0">
        <section className="dashboard-v2-chart" aria-label="Рабочая панель модулей">
          <div className="dashboard-v2-heading"><div><p>Рабочая панель</p><h2>Динамика задач по модулям</h2></div><span><i />Схемы <i />КП <i />Задачи</span></div>
          <div className="dashboard-v2-bars" aria-hidden="true">
            {[48, 31, 23, 45, 62, 29, 40, 54, 31, 37, 48, 25, 46, 60, 34].map((height, index) => <b key={`${height}-${index}`} className={`tone-${index % 3}`} style={{ height: `${height}%` }} />)}
          </div>
        </section>

        <section className="dashboard-v2-highlights" aria-label="Рабочие точки входа">
          <Link href="/agro-helper" className="dashboard-v2-highlight tone-mint"><span className="dashboard-v2-icon"><Sprout className="h-4 w-4" /></span><p>АгроПомощник</p><h2>Схемы защиты</h2><small>Культура, технология и площадь</small><div><strong>29</strong><strong>144</strong><strong>14</strong></div></Link>
          <Link href="/farms" className="dashboard-v2-highlight tone-blush"><span className="dashboard-v2-icon"><Building2 className="h-4 w-4" /></span><p>Рабочий фокус</p><h2>Карточка<br />хозяйства</h2><small>Контакты, культуры, площади и следующие действия.</small><em>Открыть →</em></Link>
          <Link href="/proposals/new" className="dashboard-v2-highlight tone-sand"><span className="dashboard-v2-icon"><FileText className="h-4 w-4" /></span><p>Генератор КП</p><strong className="dashboard-v2-kpi">36</strong><small>новых расчётов в этом сезоне</small><em>▲ 3,4%</em></Link>
        </section>

        <section aria-label="Основные модули рабочего кабинета" className="dashboard-v2-modules grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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

        <section className="dashboard-v2-notes mt-7 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-[#edebf7] p-4 text-sm text-[#56516f]"><strong className="block text-[#2d2a50]">Для агронома</strong><span className="mt-1 block">Схемы защиты, нормы и регламенты применения.</span></div>
          <div className="rounded-xl bg-[#fff2db] p-4 text-sm text-[#77603c]"><strong className="block text-[#573e1a]">Для менеджера</strong><span className="mt-1 block">Хозяйства, расчёт КП, фасовки и условия оплаты.</span></div>
          <div className="rounded-xl bg-[#e8f1ff] p-4 text-sm text-[#465f7d]"><strong className="block text-[#253d60]">Для команды</strong><span className="mt-1 block">База знаний и проверка продуктовой экспертизы.</span></div>
        </section>
      </main>

      <footer className="dashboard-v2-footer border-t border-[#e5e4ec] bg-transparent px-0 py-5 text-xs text-[#858498]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 sm:flex-row">
          <span>Doctor Farmer · рабочий портал</span>
          <button type="button" onClick={() => setIsSupportOpen(true)} className="inline-flex items-center gap-1 font-semibold text-[#194f38] hover:underline"><HelpCircle className="h-3.5 w-3.5" />Поддержка</button>
        </div>
      </footer>

      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
    </div>
  );
}
