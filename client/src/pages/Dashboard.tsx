import { useState } from "react";
import { Link } from "wouter";
import { AlertCircle, Bell, BriefcaseBusiness, Building2, CalendarCheck2, CheckCircle2, ClipboardList, FileText, Flag, HelpCircle, Layers3, ListTodo, Plus, ShieldAlert } from "lucide-react";
import { SupportModal } from "@/components/SupportModal";
import { trpc } from "@/lib/trpc";

export const dashboardTitle = "АгроПомощник";
export const dashboardSubtitle = "Схемы защиты";

export function firstNameFromDisplayName(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";
  return normalized.split(/\s+/)[0] || "коллега";
}

/** Legacy module metadata kept for existing contracts/tests; the rendered home is role-aware. */
export const dashboardModules = [
  { title: "Схемы защиты", href: "/agro-helper", tone: "emerald" },
  { title: "Хозяйства", href: "/farms", tone: "sage" },
  { title: "Генератор КП", href: "/proposals/new", tone: "gold" },
  { title: "Заявки", href: "/order-requests", tone: "orange" },
  { title: "Продажи", href: "/sales", tone: "blue" },
  { title: "Тестирование", href: "/quiz", tone: "violet" },
] as const;

const quickActions = [
  { title: "Хозяйства", hint: "Клиенты и следующее действие", href: "/farms", icon: Building2, tone: "sage" },
  { title: "Создать КП", hint: "Расчёт по актуальной цене", href: "/proposals/new", icon: FileText, tone: "gold" },
  { title: "Новая заявка", hint: "Передать заказ в работу", href: "/order-requests", icon: ClipboardList, tone: "orange" },
  { title: "Схемы защиты", hint: "Агрономические решения", href: "/agro-helper", icon: Layers3, tone: "emerald" },
] as const;

const toneClasses = {
  emerald: "dashboard-module-icon-emerald",
  sage: "dashboard-module-icon-sage",
  gold: "dashboard-module-icon-gold",
  orange: "dashboard-module-icon-orange",
} as const;

function formatTaskTime(value: Date | string | null | undefined) {
  if (!value) return "Без срока";
  return new Date(value).toLocaleString("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function taskStatusLabel(status: string) {
  if (status === "in_progress") return "В работе";
  if (status === "done") return "Готово";
  if (status === "cancelled") return "Отменено";
  return "Запланировано";
}

export default function Dashboard() {
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const { data, isLoading, error } = trpc.dashboard.overview.useQuery(undefined, { retry: false });

  if (isLoading) return <section className="dashboard-workday-loading"><div className="dashboard-workday-skeleton" /><p>Формируем рабочий день…</p></section>;
  if (error || !data) return <section className="dashboard-workday-error"><ShieldAlert className="mx-auto h-9 w-9 text-[#9fce35]" /><h2>Рабочий стол пока недоступен</h2><p>Проверьте назначение сотрудника в рабочее пространство или обратитесь к администратору.</p></section>;

  return (
    <div className="dashboard-workday">
      <section className="dashboard-workday-hero" aria-labelledby="workday-title">
        <div>
          <p className="dashboard-workday-kicker">{data.roleLabel}</p>
          <h1 id="workday-title">Доброе утро, {firstNameFromDisplayName(data.userName)}</h1>
          <p className="dashboard-workday-date">{new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}</p>
          <p className="dashboard-workday-scope">{data.scopeLabel}</p>
        </div>
        <div className="dashboard-workday-hero-actions">
          <Link href="/sales" className="dashboard-workday-secondary-action"><ListTodo className="h-4 w-4" />Открыть задачи</Link>
          <Link href="/proposals/new" className="dashboard-workday-primary-action"><Plus className="h-4 w-4" />Создать КП</Link>
        </div>
      </section>

      <section className="dashboard-workday-summary" aria-label="Сводка рабочего дня">
        <SummaryCard icon={<CalendarCheck2 />} value={data.summary.today} label="Сегодня" tone="green" />
        <SummaryCard icon={<AlertCircle />} value={data.summary.overdue} label="Просрочено" tone="red" />
        <SummaryCard icon={<Flag />} value={data.isLeadership ? data.summary.farms : data.summary.proposals} label="На контроле" mobileLabel="КП" tone="blue" />
      </section>

      <div className="dashboard-workday-layout">
        <section className="dashboard-workday-card dashboard-workday-tasks" aria-labelledby="today-plan-title">
          <div className="dashboard-workday-card-heading">
            <div><p className="dashboard-workday-eyebrow">Следующий шаг</p><h2 id="today-plan-title">План на сегодня</h2></div>
            <span className="dashboard-workday-count">{data.tasks.length}</span>
          </div>
          <div className="dashboard-workday-task-list">
            {data.tasks.length === 0 ? <EmptyState icon={<CheckCircle2 />} title="Открытых задач нет" text="Создайте следующее действие по хозяйству или откройте раздел продаж." /> : data.tasks.map((item) => (
              <Link key={item.task.id} href="/sales" className="dashboard-workday-task-row">
                <span className={`dashboard-workday-task-icon ${item.task.status === "in_progress" ? "is-active" : ""}`}><BriefcaseBusiness className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1"><strong>{item.task.title}</strong><small>{item.workspace.name} · {formatTaskTime(item.task.dueAt)}</small></span>
                <span className={`dashboard-workday-status dashboard-workday-status-${item.task.status}`}>{taskStatusLabel(item.task.status)}</span>
              </Link>
            ))}
          </div>
          <Link href="/sales" className="dashboard-workday-card-link">Показать все задачи <span aria-hidden="true">→</span></Link>
        </section>

        <aside className="dashboard-workday-side">
          <section className="dashboard-workday-card" aria-labelledby="farms-attention-title">
            <div className="dashboard-workday-card-heading"><div><p className="dashboard-workday-eyebrow">Контроль клиентов</p><h2 id="farms-attention-title">Хозяйства, требующие внимания</h2></div><Link href="/farms" className="dashboard-workday-card-link">Все <span aria-hidden="true">→</span></Link></div>
            <div className="dashboard-workday-farm-list">
              {data.attention.attentionFarms.length === 0 ? <p className="dashboard-workday-empty-note">Хозяйств с ближайшим действием нет.</p> : data.attention.attentionFarms.slice(0, 3).map((farm) => <Link key={farm.id} href="/farms" className="dashboard-workday-farm-row"><span className="dashboard-workday-farm-marker"><Building2 /></span><span><strong>{farm.name}</strong><small>{farm.district || farm.settlement || "Следующее действие требует контроля"}</small></span><span aria-hidden="true">›</span></Link>)}
            </div>
          </section>

          <section className="dashboard-workday-card" aria-labelledby="attention-title">
            <div className="dashboard-workday-card-heading"><div><p className="dashboard-workday-eyebrow">Исключения</p><h2 id="attention-title">Требуют внимания</h2></div><Bell className="h-5 w-5 text-[#9fce35]" /></div>
            <div className="dashboard-workday-attention-list">
              <Link href="/sales" className="dashboard-workday-attention-row is-danger"><AlertCircle /><span><strong>Просроченные задачи</strong><small>{data.attention.overdueTasks} требуют реакции</small></span><b>{data.attention.overdueTasks}</b></Link>
              <Link href="/order-requests" className="dashboard-workday-attention-row is-warning"><ClipboardList /><span><strong>Заявки на рассмотрении</strong><small>{data.attention.openOrders} в рабочем контуре</small></span><b>{data.attention.openOrders}</b></Link>
            </div>
          </section>

          <section className="dashboard-workday-card" aria-labelledby="pipeline-title">
            <div className="dashboard-workday-card-heading"><div><p className="dashboard-workday-eyebrow">Коммерческий контур</p><h2 id="pipeline-title">КП и заявки в работе</h2></div><Link href="/sales" className="dashboard-workday-card-link">Все <span aria-hidden="true">→</span></Link></div>
            <div className="dashboard-workday-pipeline-list"><Link href="/proposals" className="dashboard-workday-pipeline-row"><FileText /><span><strong>КП в работе</strong><small>Требуют следующего шага</small></span><b>{data.attention.openProposals}</b></Link><Link href="/order-requests" className="dashboard-workday-pipeline-row"><ClipboardList /><span><strong>Заявки</strong><small>На рассмотрении и в работе</small></span><b>{data.attention.openOrders}</b></Link></div>
          </section>

          <section className="dashboard-workday-card" aria-labelledby="notifications-title">
            <div className="dashboard-workday-card-heading"><div><p className="dashboard-workday-eyebrow">Последние события</p><h2 id="notifications-title">Уведомления</h2></div><Link href="/news" className="dashboard-workday-card-link">Все</Link></div>
            <div className="dashboard-workday-notifications">
              {data.notifications.length === 0 ? <p className="dashboard-workday-empty-note">Новых событий пока нет.</p> : data.notifications.slice(0, 4).map((notification) => <a key={notification.id} href={notification.href || "/"} className={`dashboard-workday-notification ${notification.isRead ? "" : "is-unread"}`}><span className="dashboard-workday-notification-dot" /><span><strong>{notification.title}</strong><small>{notification.body}</small></span></a>)}
            </div>
          </section>
        </aside>
      </div>

      <section className="dashboard-workday-card dashboard-workday-quick" aria-labelledby="quick-title">
        <div className="dashboard-workday-card-heading"><div><p className="dashboard-workday-eyebrow">Быстрый доступ</p><h2 id="quick-title">Рабочие инструменты</h2></div><span className="dashboard-workday-muted">{data.scopeLabel}</span></div>
        <div className="dashboard-workday-quick-grid">{quickActions.map((action) => { const Icon = action.icon; return <Link key={action.href} href={action.href} className="dashboard-workday-quick-card"><span className={`dashboard-module-icon ${toneClasses[action.tone]}`}><Icon className="h-6 w-6" /></span><span><strong>{action.title}</strong><small>{action.hint}</small></span></Link>; })}</div>
      </section>

      <section className="dashboard-support-strip" aria-label="Поддержка"><div><strong>Нужна помощь по кабинету?</strong><span>Задайте вопрос внутренней поддержке.</span></div><button type="button" onClick={() => setIsSupportOpen(true)} aria-label="Открыть поддержку"><HelpCircle className="h-5 w-5" /><span>Поддержка</span></button></section>
      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
    </div>
  );
}

function SummaryCard({ icon, value, label, mobileLabel, tone }: { icon: React.ReactNode; value: number; label: string; mobileLabel?: string; tone: "green" | "red" | "blue" | "violet" }) {
  return <article className={`dashboard-workday-summary-card is-${tone}`}><span>{icon}</span><strong>{value}</strong><small><span className="dashboard-summary-label-desktop">{label}</span>{mobileLabel && <span className="dashboard-summary-label-mobile">{mobileLabel}</span>}</small></article>;
}

function EmptyState({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="dashboard-workday-empty"><span>{icon}</span><strong>{title}</strong><p>{text}</p></div>;
}
