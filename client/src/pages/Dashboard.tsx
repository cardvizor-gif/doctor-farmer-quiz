import { useState } from "react";
import { Link } from "wouter";
import { BookOpen, Building2, ClipboardList, FileText, HelpCircle, Layers3, Sprout, Trophy } from "lucide-react";
import { DoctorFarmerLogo } from "@/components/DoctorFarmerLogo";
import { SupportModal } from "@/components/SupportModal";

export const dashboardTitle = "Рабочий кабинет";
export const dashboardSubtitle = "Хозяйства, схемы защиты, КП и заявки — в одном рабочем кабинете.";

export const dashboardModules = [
  {
    title: "АгроПомощник",
    hint: "Схемы защиты",
    action: "Открыть",
    href: "/agro-helper",
    icon: Layers3,
    tone: "emerald",
  },
  {
    title: "Хозяйства",
    hint: "Карточки клиентов",
    action: "Открыть",
    href: "/farms",
    icon: Building2,
    tone: "sage",
  },
  {
    title: "Генератор КП",
    hint: "Расчёт и печать",
    action: "Создать",
    href: "/proposals/new",
    icon: FileText,
    tone: "gold",
  },
  {
    title: "Заявки",
    hint: "Отгрузки и история",
    action: "Открыть",
    href: "/order-requests",
    icon: ClipboardList,
    tone: "orange",
  },
  {
    title: "База знаний",
    hint: "Препараты и нормы",
    action: "Открыть",
    href: "/knowledge-base",
    icon: BookOpen,
    tone: "blue",
  },
  {
    title: "Тестирование",
    hint: "Проверка знаний",
    action: "Начать",
    href: "/quiz",
    icon: Trophy,
    tone: "violet",
  },
] as const;

const toneClasses = {
  emerald: "dashboard-module-icon-emerald",
  sage: "dashboard-module-icon-sage",
  gold: "dashboard-module-icon-gold",
  orange: "dashboard-module-icon-orange",
  blue: "dashboard-module-icon-blue",
  violet: "dashboard-module-icon-violet",
} as const;

export default function Dashboard() {
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  return (
    <div className="dashboard-home">
      <div className="dashboard-mobile-brand">
        <DoctorFarmerLogo className="h-9 w-auto" clickable={false} />
      </div>

      <section className="dashboard-intro" aria-labelledby="dashboard-title">
        <div className="dashboard-intro-copy">
          <h1 id="dashboard-title">{dashboardTitle}</h1>
          <p className="dashboard-intro-text">{dashboardSubtitle}</p>
        </div>
        <div className="dashboard-quick-actions" aria-label="Быстрые действия">
          <Link href="/farms" className="dashboard-quick-action dashboard-quick-action-primary">Новое хозяйство</Link>
          <Link href="/proposals/new" className="dashboard-quick-action">Новое КП</Link>
        </div>
      </section>

      <section className="dashboard-section" aria-labelledby="dashboard-modules-title">
        <div className="dashboard-section-heading">
          <div>
            <h2 id="dashboard-modules-title">Инструменты</h2>
          </div>
        </div>

        <div className="dashboard-module-grid">
          {dashboardModules.map((module) => {
            const Icon = module.icon;
            return (
              <Link key={module.href} href={module.href} className="dashboard-module-card">
                <span className={`dashboard-module-icon ${toneClasses[module.tone]}`} aria-hidden="true">
                  <Icon className="h-12 w-12" strokeWidth={1.7} />
                </span>
                <span className="dashboard-module-copy">
                  <strong>{module.title}</strong>
                  <small>{module.hint}</small>
                </span>
                <span className="dashboard-module-action">{module.action}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="dashboard-support-strip" aria-label="Поддержка">
        <div>
          <strong>Нужна помощь по кабинету?</strong>
          <span>Задайте вопрос внутренней поддержке.</span>
        </div>
        <button type="button" onClick={() => setIsSupportOpen(true)} aria-label="Открыть поддержку">
          <HelpCircle className="h-5 w-5" />
          <span>Поддержка</span>
        </button>
      </section>

      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
    </div>
  );
}
