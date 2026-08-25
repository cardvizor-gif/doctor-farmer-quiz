import {
  Bell,
  BookOpen,
  Building2,
  ChartNoAxesColumnIncreasing,
  ChevronDown,
  CircleGauge,
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
    kicker: "Рабочий модуль",
    title: "АгроПомощник",
    body: "Подбор схемы защиты по культуре, технологии и площади.",
    action: "Открыть схему",
  },
  {
    tone: "blush",
    icon: Building2,
    kicker: "Рабочий модуль",
    title: "Хозяйства",
    body: "Карточки клиентов, культуры, площади и следующие действия.",
    action: "Открыть реестр",
  },
  {
    tone: "sand",
    icon: FileText,
    kicker: "Рабочий модуль",
    title: "Генератор КП",
    body: "Прозрачный расчёт схемы, фасовок и коммерческого предложения.",
    action: "Создать КП",
  },
];

const workItems = [
  { label: "Подобрать схему защиты", detail: "Культура · технология · площадь", state: "Открыть" },
  { label: "Подготовить коммерческое предложение", detail: "Расчёт по выбранной схеме", state: "Открыть" },
  { label: "Проверить регламенты препаратов", detail: "База знаний Doctor Farmer", state: "Открыть" },
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
          <span className="reference-brand-wordmark">Doctor<br />Farmer</span>
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
              <p>Демонстрационный вариант · Doctor Farmer</p>
              <h1>{activeNavigation.label}</h1>
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
                    <div className="reference-highlight-copy">
                      <p>{card.kicker}</p>
                      <h3>{card.title}</h3>
                      <span>{card.body}</span>
                    </div>
                    <button type="button" className="reference-text-action" onClick={() => setActiveItem(resolveReferenceTarget(card.title))}>
                      {card.action}
                    </button>
                  </article>
                );
              })}
            </section>

            <section className="reference-lower-grid">
              <article className="reference-work-card">
                <div className="reference-card-heading compact">
                  <div>
                    <p className="reference-label">Рабочий стол</p>
                    <h2>Быстрые действия</h2>
                  </div>
                  <button type="button" aria-label="Дополнительные действия"><MoreHorizontal size={18} /></button>
                </div>
                <div className="reference-work-list">
                  {workItems.map((item) => (
                    <button type="button" className="reference-work-row" key={item.label}>
                      <span className="reference-work-check"><Sparkles size={14} /></span>
                      <span className="reference-work-copy"><strong>{item.label}</strong><small>{item.detail}</small></span>
                      <em>{item.state}</em>
                    </button>
                  ))}
                </div>
              </article>

              <article className="reference-mini-summary">
                <div className="reference-card-heading compact">
                  <div><p className="reference-label">Навигация</p><h2>Ключевые разделы</h2></div>
                  <CircleGauge size={19} />
                </div>
                <div className="reference-summary-grid">
                  <button type="button" onClick={() => setActiveItem("knowledge")}><BookOpen size={18} /><strong>База знаний</strong><span>Регламенты</span></button>
                  <button type="button" onClick={() => setActiveItem("quiz")}><GraduationCap size={18} /><strong>Тестирование</strong><span>Команда</span></button>
                </div>
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
              <div><strong>Поддержка Doctor Farmer</strong><p>Подготовьте обращение в один клик.</p></div>
              <a href="/knowledge-base" aria-label="Открыть базу знаний"><Search size={17} /></a>
            </section>
          </aside>
        </main>
      </div>
    </div>
  );
}
