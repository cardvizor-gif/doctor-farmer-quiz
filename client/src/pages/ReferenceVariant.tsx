import {
  Bell,
  BookOpen,
  Building2,
  ChartNoAxesColumnIncreasing,
  CheckCircle2,
  ChevronDown,
  CircleGauge,
  Clock3,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Leaf,
  Menu,
  MoreHorizontal,
  Search,
  Settings,
  Sparkles,
  Sprout,
  UsersRound,
  X,
} from "lucide-react";
import { useState } from "react";

type NavigationItem = {
  id: "overview" | "agro" | "farms" | "proposals" | "knowledge" | "quiz";
  label: string;
  icon: typeof LayoutDashboard;
};

export const referenceNavigation: NavigationItem[] = [
  { id: "overview", label: "Обзор", icon: LayoutDashboard },
  { id: "agro", label: "АгроПомощник", icon: Sprout },
  { id: "farms", label: "Хозяйства", icon: Building2 },
  { id: "proposals", label: "Генератор КП", icon: FileText },
  { id: "knowledge", label: "База знаний", icon: BookOpen },
  { id: "quiz", label: "Тестирование", icon: GraduationCap },
];

const chartBars = [56, 34, 24, 55, 74, 32, 47, 59, 33, 45, 69, 31, 42, 62, 26, 39, 52, 69];

const highlightCards = [
  {
    tone: "mint",
    icon: Leaf,
    kicker: "АгроПомощник",
    title: "АгроПомощник",
    body: "Подбор схемы защиты по культуре, технологии и площади",
    metrics: [["Схемы", "29"], ["Реестр", "144"], ["КП", "14"]],
  },
  {
    tone: "blush",
    icon: Building2,
    kicker: "Рабочий фокус",
    title: "Хозяйства",
    body: "Соберите культуру, площадь и контакт в одну карточку хозяйства.",
    metrics: [],
  },
  {
    tone: "sand",
    icon: FileText,
    kicker: "Генератор КП",
    title: "Генератор КП",
    body: "Прозрачный расчёт схемы, фасовок и коммерческого предложения.",
    metrics: [],
  },
];

const workItems = [
  { label: "Подобрать схему защиты", detail: "Культура · технология · площадь", state: "Открыть" },
  { label: "Подготовить коммерческое предложение", detail: "Расчёт по выбранной схеме", state: "Открыть" },
  { label: "Проверить регламенты препаратов", detail: "База знаний АгроПомощник DF", state: "Открыть" },
];

export function resolveReferenceTarget(title: string): NavigationItem["id"] {
  if (title === "АгроПомощник") return "agro";
  if (title === "Хозяйства") return "farms";
  return "proposals";
}

export default function ReferenceVariant() {
  const [activeItem, setActiveItem] = useState<NavigationItem["id"]>("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const activeNavigation = referenceNavigation.find((item) => item.id === activeItem) ?? referenceNavigation[0];

  const selectNavigation = (item: NavigationItem) => {
    setActiveItem(item.id);
    setMenuOpen(false);
  };

  return (
    <div className="reference-variant">
      <aside className={`reference-rail ${menuOpen ? "is-open" : ""}`} aria-label="Навигация демонстрационного варианта">
        <div className="reference-brand-row">
          <div className="reference-brand-mark" aria-hidden="true">DF</div>
          <span className="reference-brand-wordmark">АгроПомощник<br />DF</span>
          <button className="reference-mobile-close" type="button" onClick={() => setMenuOpen(false)} aria-label="Закрыть меню">
            <X size={19} />
          </button>
        </div>

        <nav className="reference-nav">
          {referenceNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            return (
              <button
                className={`reference-nav-button ${isActive ? "is-active" : ""}`}
                key={item.id}
                type="button"
                onClick={() => selectNavigation(item)}
                title={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon size={18} strokeWidth={1.9} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="reference-rail-footer">
          <button className="reference-nav-button" type="button" title="Настройки" aria-label="Настройки демонстрационного варианта">
            <Settings size={18} strokeWidth={1.9} />
            <span>Настройки</span>
          </button>
          <a className="reference-live-link" href="/">Открыть рабочую версию</a>
        </div>
      </aside>

      {menuOpen && <button className="reference-menu-backdrop" type="button" aria-label="Закрыть меню" onClick={() => setMenuOpen(false)} />}

      <div className="reference-workspace">
        <header className="reference-topbar">
          <div className="reference-greeting">
            <button className="reference-menu-button" type="button" onClick={() => setMenuOpen(true)} aria-label="Открыть меню">
              <Menu size={20} />
            </button>
            <div>
              <p>Добрый вечер, Шамиль!</p>
              <h1>{activeNavigation.label === "Обзор" ? "Рабочая панель" : activeNavigation.label}</h1>
            </div>
          </div>

          <button type="button" className="reference-search" aria-label="Поиск в демонстрационном варианте">
            <span>Поиск по кабинету</span>
            <Search size={17} />
          </button>

          <div className="reference-user-actions">
            <button type="button" className="reference-icon-action" aria-label="Уведомления"><Bell size={18} /></button>
            <button type="button" className="reference-profile" aria-label="Профиль пользователя">
              <span>Ш</span><ChevronDown size={14} />
            </button>
          </div>
        </header>

        <main className="reference-content">
          <section className="reference-main-column">
            <section className="reference-chart-card" aria-label="Демонстрационный график рабочих модулей">
              <div className="reference-card-heading">
                <div>
                  <p className="reference-label">Рабочая панель</p>
                  <h2>Динамика задач по модулям</h2>
                </div>
                <div className="reference-legend" aria-label="Легенда графика">
                  <span><i className="is-navy" />Схемы</span>
                  <span><i className="is-mint" />КП</span>
                  <span><i className="is-sand" />Задачи</span>
                </div>
              </div>
              <div className="reference-chart-stage">
                <div className="reference-chart-axis"><span>80</span><span>60</span><span>40</span><span>20</span></div>
                <div className="reference-bars" aria-hidden="true">
                  {chartBars.map((height, index) => (
                    <i key={`${height}-${index}`} className={`reference-bar tone-${index % 3}`} style={{ height: `${height}%` }} />
                  ))}
                </div>
              </div>
              <p className="reference-chart-note">Визуальный макет: показатели намеренно не связаны с данными хозяйств или КП.</p>
            </section>

            <section className="reference-highlight-grid" aria-label="Основные точки входа">
              {highlightCards.map((card) => {
                const Icon = card.icon;
                return (
                  <article className={`reference-highlight-card tone-${card.tone}`} key={card.title}>
                    <div className="reference-highlight-top">
                      <span className="reference-highlight-icon"><Icon size={18} /></span>
                      <button type="button" aria-label={`Меню ${card.title}`}><MoreHorizontal size={18} /></button>
                    </div>
                    {card.tone === "mint" ? (
                      <>
                        <div className="reference-highlight-copy">
                          <p>{card.kicker}</p>
                          <h3>{card.title}</h3>
                          <span>{card.body}</span>
                        </div>
                        <div className="reference-card-metrics">
                          {card.metrics.map(([label, value]) => <span key={label}><small>{label}</small><strong>{value}</strong></span>)}
                        </div>
                      </>
                    ) : card.tone === "blush" ? (
                      <div className="reference-focus-layout">
                        <span className="reference-focus-moon"><Clock3 size={15} /></span>
                        <div className="reference-highlight-copy"><p>{card.kicker}</p><h3>Карточка<br />хозяйства</h3><span>{card.body}</span></div>
                        <div className="reference-focus-foot"><i>Сегодня</i><span>Открыть →</span></div>
                      </div>
                    ) : (
                      <div className="reference-kpi-layout">
                        <div className="reference-highlight-copy"><p>{card.kicker}</p><strong className="reference-kpi-number">36</strong><span>новых расчётов в этом сезоне</span></div>
                        <div className="reference-kpi-foot"><i>▲ 3,4%</i><span>к прошлому месяцу</span></div>
                      </div>
                    )}
                  </article>
                );
              })}
            </section>

            <section className="reference-lower-grid">
              <article className="reference-standup-card">
                <div className="reference-card-heading compact">
                  <div>
                    <p className="reference-label">Понедельник</p>
                    <h2>Планёрка</h2>
                  </div>
                  <button type="button" aria-label="Дополнительные действия"><MoreHorizontal size={18} /></button>
                </div>
                <div className="reference-people-row"><span>Ш</span><span>А</span><span>М</span><span>Т</span><button type="button" aria-label="Пригласить участника">+</button></div>
                <div className="reference-meeting-line"><Clock3 size={16} /><div><span>Еженедельная планёрка</span><strong>09:00 – 10:00</strong></div><button type="button" aria-label="Открыть планёрку">↗</button></div>
                <button type="button" className="reference-invite-action"><UsersRound size={15} /> Пригласить участника</button>
              </article>

              <article className="reference-progress-card">
                <div className="reference-card-heading compact"><div><p className="reference-label">В работе</p><h2>Текущие задачи</h2></div><span className="reference-count">2</span></div>
                <div className="reference-progress-list">
                  {workItems.slice(0, 2).map((item, index) => (
                    <button type="button" className="reference-progress-row" key={item.label}>
                      <span><strong>{item.label}</strong><small>{item.detail}</small></span><em>{index === 0 ? "81%" : "68%"}</em><i><b style={{ width: index === 0 ? "81%" : "68%" }} /></i>
                    </button>
                  ))}
                </div>
              </article>

              <article className="reference-quick-card">
                <div className="reference-card-heading compact">
                  <div><p className="reference-label">Сводка</p><h2>Ключевые цифры</h2></div>
                  <CircleGauge size={19} />
                </div>
                <div className="reference-quick-tiles">
                  <button type="button" onClick={() => setActiveItem("knowledge")}><BookOpen size={18} /><strong>19</strong><span>регламентов</span></button>
                  <button type="button" onClick={() => setActiveItem("quiz")}><CheckCircle2 size={18} /><strong>14</strong><span>тестов</span></button>
                </div>
                <div className="reference-project-strip"><span className="reference-project-orb" /><div><strong>22 проекта</strong><p>Защита культур в работе</p></div><span>Подробнее →</span></div>
              </article>
            </section>
          </section>

          <aside className="reference-insights">
            <div className="reference-insights-head">
              <span className="reference-insights-icon"><ChartNoAxesColumnIncreasing size={20} /></span>
              <button type="button" aria-label="Меню аналитики"><MoreHorizontal size={19} /></button>
            </div>
            <div className="reference-aside-title"><p className="reference-label">Команда и процессы</p><h2>Статистика</h2></div>

            <div className="reference-donut-wrap">
              <div className="reference-donut"><div><strong>DF</strong><span>demo</span></div></div>
              <div className="reference-donut-legend"><span><i className="is-mint" />Рабочие модули</span><span><i className="is-sand" />Обучение</span></div>
            </div>

            <section className="reference-spark-card">
              <div className="reference-card-heading compact"><div><p className="reference-label">Активность</p><h3>Рабочая неделя</h3></div><MoreHorizontal size={18} /></div>
              <svg className="reference-sparkline" viewBox="0 0 280 96" role="img" aria-label="Декоративная линия активности">
                <path d="M0 70 L20 64 L38 66 L58 42 L78 58 L97 44 L116 62 L136 30 L155 45 L177 39 L197 61 L218 35 L238 48 L260 28 L280 40" fill="none" stroke="#85baa9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M0 70 L20 64 L38 66 L58 42 L78 58 L97 44 L116 62 L136 30 L155 45 L177 39 L197 61 L218 35 L238 48 L260 28 L280 40 L280 96 L0 96Z" fill="url(#referenceArea)" opacity=".32" />
                <defs><linearGradient id="referenceArea" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#85baa9" /><stop offset="1" stopColor="#85baa9" stopOpacity="0" /></linearGradient></defs>
              </svg>
              <p>Здесь может быть подключена аналитика после утверждения визуального направления.</p>
            </section>

            <section className="reference-support-card">
              <span className="reference-support-icon"><Sparkles size={17} /></span>
              <div><strong>Поддержка АгроПомощник DF</strong><p>Подготовьте обращение в один клик.</p></div>
              <a href="/knowledge-base" aria-label="Открыть базу знаний"><Search size={17} /></a>
            </section>
          </aside>
        </main>
      </div>
    </div>
  );
}
