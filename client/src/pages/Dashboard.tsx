import { useState } from "react";
import { Link } from "wouter";
import {
  AlertCircle,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarCheck2,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Flag,
  HelpCircle,
  Layers3,
  ListTodo,
  MoreVertical,
  Phone,
  Plus,
  ShieldAlert,
  Sprout,
} from "lucide-react";
import { SupportModal } from "@/components/SupportModal";
import { trpc } from "@/lib/trpc";

export const dashboardTitle = "АгроПомощник";
export const dashboardSubtitle = "Схемы защиты";

export function timeOfDayGreeting(hour: number) {
  if (hour >= 5 && hour < 12) return "Доброе утро";
  if (hour >= 12 && hour < 18) return "Добрый день";
  return "Добрый вечер";
}

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

export const dashboardActions = [
  { title: "Новое хозяйство", href: "/farms", icon: Building2, tone: "green" },
  { title: "Новая задача", href: "/sales", icon: ListTodo, tone: "mint" },
  { title: "Создать КП", href: "/proposals/new", icon: FileText, tone: "blue" },
  {
    title: "Новая заявка",
    href: "/order-requests",
    icon: ClipboardCheck,
    tone: "teal",
  },
  {
    title: "Подобрать схему",
    href: "/agro-helper",
    icon: Sprout,
    tone: "sage",
  },
] as const;

export const dashboardReferenceLayout = [
  "hero",
  "summary",
  "actions",
  "plan",
  "attention",
  "pipeline",
  "notifications",
] as const;

function formatTaskClock(value: Date | string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTaskDate(value: Date | string | null | undefined) {
  if (!value) return "Срок не задан";
  return new Date(value).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
  });
}

function taskStatusLabel(status: string) {
  if (status === "in_progress") return "В работе";
  if (status === "done") return "Готово";
  if (status === "cancelled") return "Отменено";
  return "Запланировано";
}

export function taskProgressStep(status: string) {
  if (status === "done") return 3;
  if (status === "in_progress") return 1;
  if (status === "cancelled") return 0;
  return 0;
}

export function farmAttentionTone(nextAction: string | null | undefined) {
  return /оплат|платеж|долг|дебитор/i.test(nextAction ?? "")
    ? "finance"
    : "operation";
}

function taskIcon(title: string) {
  if (/заявк/i.test(title)) return ClipboardCheck;
  if (/кп|предлож/i.test(title)) return FileText;
  if (/звон|контакт|связ/i.test(title)) return Phone;
  return BriefcaseBusiness;
}

export default function Dashboard() {
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const { data, isLoading, error } = trpc.dashboard.overview.useQuery(
    undefined,
    { retry: false }
  );

  if (isLoading) {
    return (
      <section className="dashboard-workday-loading">
        <div className="dashboard-workday-skeleton" />
        <p>Формируем рабочий день…</p>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="dashboard-workday-error">
        <ShieldAlert className="mx-auto h-9 w-9 text-[#6ea02d]" />
        <h2>Рабочий стол пока недоступен</h2>
        <p>
          Проверьте назначение сотрудника в рабочее пространство или обратитесь
          к администратору.
        </p>
      </section>
    );
  }

  return (
    <div className="dashboard-workday dashboard-reference-workday">
      <section
        className="dashboard-workday-hero"
        aria-labelledby="workday-title"
      >
        <div className="dashboard-reference-hero-copy">
          <p className="dashboard-workday-kicker">{data.roleLabel}</p>
          <h1 id="workday-title">
            {timeOfDayGreeting(new Date().getHours())},{" "}
            {firstNameFromDisplayName(data.userName)}
          </h1>
          <p className="dashboard-workday-date">
            {new Date().toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <p className="dashboard-workday-scope">{data.scopeLabel}</p>
        </div>
        {data.sales.isConfigured && (
          <Link href="/sales" className="dashboard-sales-plan-inline">
            <strong>{data.sales.percent ?? 0}%</strong>
            <span>Выполнение плана продаж</span>
          </Link>
        )}
      </section>

      <section
        className="dashboard-workday-summary"
        aria-label="Сводка рабочего дня"
      >
        <SummaryCard
          icon={<CalendarCheck2 />}
          value={data.summary.today}
          label="Сегодня"
          suffix="задач"
          tone="green"
        />
        <SummaryCard
          icon={<AlertCircle />}
          value={data.summary.overdue}
          label="Просрочено"
          suffix="задач"
          tone="rose"
        />
        <SummaryCard
          icon={<Flag />}
          value={
            data.isLeadership ? data.summary.farms : data.summary.proposals
          }
          label="На контроле"
          suffix={data.isLeadership ? "хозяйств" : "КП"}
          tone="amber"
        />
      </section>

      <nav className="dashboard-workday-actions" aria-label="Быстрые действия">
        {dashboardActions.map(action => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className={`dashboard-workday-action is-${action.tone}`}
            >
              <Icon aria-hidden="true" />
              <span>{action.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="dashboard-workday-layout">
        <section
          className="dashboard-workday-card dashboard-workday-tasks"
          aria-labelledby="today-plan-title"
        >
          <div className="dashboard-workday-card-heading">
            <div>
              <p className="dashboard-workday-eyebrow">Фокус дня</p>
              <h2 id="today-plan-title">План на сегодня</h2>
            </div>
            <Link
              href="/sales"
              className="dashboard-workday-card-link dashboard-workday-card-link-top"
            >
              Все задачи <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="dashboard-workday-task-list">
            {data.tasks.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 />}
                title="Открытых задач нет"
                text="Создайте следующее действие по хозяйству или откройте раздел продаж."
              />
            ) : (
              data.tasks.slice(0, 5).map(item => {
                const Icon = taskIcon(item.task.title);
                return (
                  <Link
                    key={item.task.id}
                    href="/sales"
                    className="dashboard-workday-task-row dashboard-reference-task-row"
                  >
                    <span className="dashboard-workday-task-time">
                      <strong>{formatTaskClock(item.task.dueAt)}</strong>
                      <small>
                        {item.task.dueAt ? formatTaskDate(item.task.dueAt) : ""}
                      </small>
                    </span>
                    <span
                      className={`dashboard-workday-task-icon ${item.task.status === "in_progress" ? "is-active" : ""}`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="dashboard-workday-task-copy">
                      <strong>{item.task.title}</strong>
                      <small>
                        {item.task.description ||
                          `${item.workspace.name} · ${item.region.name}`}
                      </small>
                    </span>
                    <span
                      className={`dashboard-workday-status dashboard-workday-status-${item.task.status}`}
                    >
                      {taskStatusLabel(item.task.status)}
                    </span>
                    <span className="dashboard-workday-task-open">Открыть</span>
                    <MoreVertical
                      className="dashboard-workday-task-more"
                      aria-hidden="true"
                    />
                  </Link>
                );
              })
            )}
          </div>
          <Link
            href="/sales"
            className="dashboard-workday-card-link dashboard-workday-card-link-bottom"
          >
            Показать все задачи <span aria-hidden="true">⌄</span>
          </Link>
        </section>

        <aside className="dashboard-workday-side">
          <section
            className="dashboard-workday-card"
            aria-labelledby="farms-attention-title"
          >
            <div className="dashboard-workday-card-heading">
              <div>
                <p className="dashboard-workday-eyebrow">Контроль клиентов</p>
                <h2 id="farms-attention-title">
                  Хозяйства, требующие внимания
                </h2>
              </div>
              <Link
                href="/farms"
                className="dashboard-workday-card-link dashboard-workday-card-link-top"
              >
                Все <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="dashboard-workday-farm-list">
              {data.attention.attentionFarms.length === 0 ? (
                <p className="dashboard-workday-empty-note">
                  Хозяйств с ближайшим действием нет.
                </p>
              ) : (
                data.attention.attentionFarms.slice(0, 3).map(farm => (
                  <Link
                    key={farm.id}
                    href="/farms"
                    className={`dashboard-workday-farm-row is-${farmAttentionTone(farm.nextAction)}`}
                  >
                    <span className="dashboard-workday-farm-marker">
                      <Building2 />
                    </span>
                    <span>
                      <strong>{farm.name}</strong>
                      <small>
                        {farm.district || farm.settlement || "Регион не указан"}
                      </small>
                    </span>
                    <span className="dashboard-workday-farm-reason">
                      {farm.nextAction || "Следующее действие не задано"}
                    </span>
                    <span aria-hidden="true">›</span>
                  </Link>
                ))
              )}
            </div>
          </section>

          <section
            className="dashboard-workday-card"
            aria-labelledby="pipeline-title"
          >
            <div className="dashboard-workday-card-heading">
              <div>
                <p className="dashboard-workday-eyebrow">Коммерческий контур</p>
                <h2 id="pipeline-title">КП и заявки в работе</h2>
              </div>
              <Link
                href="/sales"
                className="dashboard-workday-card-link dashboard-workday-card-link-top"
              >
                Все <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="dashboard-workday-pipeline-list">
              <Link
                href="/proposals/new"
                className="dashboard-workday-pipeline-row"
              >
                <FileText />
                <span>
                  <strong>Коммерческие предложения</strong>
                  <small>Открытые и отправленные КП</small>
                </span>
                <b>{data.attention.openProposals}</b>
                <span aria-hidden="true">›</span>
              </Link>
              <Link
                href="/order-requests"
                className="dashboard-workday-pipeline-row"
              >
                <ClipboardList />
                <span>
                  <strong>Заявки клиентов</strong>
                  <small>На рассмотрении и в работе</small>
                </span>
                <b>{data.attention.openOrders}</b>
                <span aria-hidden="true">›</span>
              </Link>
            </div>
          </section>

          <section
            className="dashboard-workday-card"
            aria-labelledby="notifications-title"
          >
            <div className="dashboard-workday-card-heading">
              <div>
                <p className="dashboard-workday-eyebrow">Последние события</p>
                <h2 id="notifications-title">Последние обращения</h2>
              </div>
              <Link
                href="/news"
                className="dashboard-workday-card-link dashboard-workday-card-link-top"
              >
                Все <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="dashboard-workday-notifications">
              {data.notifications.length === 0 ? (
                <p className="dashboard-workday-empty-note">
                  Новых событий пока нет.
                </p>
              ) : (
                data.notifications.slice(0, 3).map(notification => (
                  <a
                    key={notification.id}
                    href={notification.href || "/news"}
                    className={`dashboard-workday-notification ${notification.isRead ? "" : "is-unread"}`}
                  >
                    <span className="dashboard-workday-notification-dot" />
                    <span>
                      <strong>{notification.title}</strong>
                      <small>{notification.body}</small>
                    </span>
                    <span className="dashboard-workday-notification-arrow">
                      ›
                    </span>
                  </a>
                ))
              )}
            </div>
          </section>
        </aside>
      </div>

      <section
        className="dashboard-workday-reference-links"
        aria-label="Справочный доступ"
      >
        <Link className="is-catalog" href="/catalog">
          <ClipboardList />
          Каталог препаратов
        </Link>
        <Link className="is-calculator" href="/agro-helper">
          <Sprout />
          Калькулятор нормы
        </Link>
        <Link className="is-regulations" href="/knowledge-base">
          <Layers3 />
          Регламенты
        </Link>
        <Link className="is-analytics" href="/sales">
          <BriefcaseBusiness />
          Аналитика
        </Link>
      </section>

      <section className="dashboard-support-strip" aria-label="Поддержка">
        <div>
          <strong>Нужна помощь по кабинету?</strong>
          <span>Задайте вопрос внутренней поддержке.</span>
        </div>
        <button
          type="button"
          onClick={() => setIsSupportOpen(true)}
          aria-label="Открыть поддержку"
        >
          <HelpCircle className="h-5 w-5" />
          <span>Поддержка</span>
        </button>
      </section>
      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
      />
    </div>
  );
}

function SummaryCard({
  icon,
  value,
  label,
  suffix,
  tone,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  suffix: string;
  tone: "green" | "rose" | "amber";
}) {
  return (
    <article className={`dashboard-workday-summary-card is-${tone}`}>
      <span>{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <em>{suffix}</em>
      </div>
    </article>
  );
}

function EmptyState({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="dashboard-workday-empty">
      <span>{icon}</span>
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}
