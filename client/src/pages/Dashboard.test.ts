import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  dashboardActions,
  dashboardColumnAttributes,
  dashboardColumnLayout,
  dashboardModules,
  dashboardReferenceLayout,
  dashboardSubtitle,
  dashboardTitle,
  farmAttentionTone,
  firstNameFromDisplayName,
  taskProgressStep,
  timeOfDayGreeting,
} from "./Dashboard";

describe("главная страница рабочего кабинета", () => {
  it("использует утверждённую формулировку заголовка и подзаголовка", () => {
    expect(dashboardTitle).toBe("АгроПомощник");
    expect(dashboardSubtitle).toBe("Схемы защиты");
  });

  it("определяет приветствие по времени суток", () => {
    expect(timeOfDayGreeting(8)).toBe("Доброе утро");
    expect(timeOfDayGreeting(14)).toBe("Добрый день");
    expect(timeOfDayGreeting(20)).toBe("Добрый вечер");
    expect(timeOfDayGreeting(3)).toBe("Добрый вечер");
  });

  it("фиксирует двухколоночную геометрию эталонного Overview и DOM-регионы", () => {
    expect(dashboardColumnLayout.fullWidth).toEqual(["hero"]);
    expect(dashboardColumnLayout.left).toEqual([
      "actions",
      "plan",
      "clients",
      "sales",
      "quickAccess",
    ]);
    expect(dashboardColumnLayout.right).toEqual([
      "attention",
      "pipeline",
      "notifications",
    ]);
    expect(dashboardColumnAttributes).toEqual({
      hero: "full-width",
      actions: "left-column",
      plan: "left-column",
      clients: "left-column",
      sales: "left-column",
      quickAccess: "left-column",
      attention: "right-column",
      pipeline: "right-column",
      notifications: "right-column",
    });
  });

  it("защищает реальный JSX/CSS-контракт двух колонок", () => {
    const dashboardSource = readFileSync(
      new URL("./Dashboard.tsx", import.meta.url),
      "utf8"
    );
    const cssSource = readFileSync(
      new URL("../index.css", import.meta.url),
      "utf8"
    );

    expect(dashboardSource).toContain(
      "data-dashboard-region={dashboardColumnAttributes.hero}"
    );
    expect(dashboardSource).toContain(
      "data-dashboard-region={dashboardColumnAttributes.actions}"
    );
    expect(dashboardSource).toContain(
      "data-dashboard-region={dashboardColumnAttributes.plan}"
    );
    expect(dashboardSource).toContain(
      "data-dashboard-region={dashboardColumnAttributes.clients}"
    );
    expect(dashboardSource).toContain(
      "data-dashboard-region={dashboardColumnAttributes.sales}"
    );
    expect(dashboardSource).toContain(
      "data-dashboard-region={dashboardColumnAttributes.quickAccess}"
    );
    expect(dashboardSource).toContain('data-dashboard-region="right-column"');
    expect(dashboardSource).toContain("data.sales.planScopeLabel");
    expect(dashboardSource).toContain("План продаж не задан");
    expect(dashboardSource).toContain('data-testid="dashboard-reference-hero-row"');
    expect(dashboardSource).toContain('data-testid="dashboard-workday-main-grid"');
    expect(dashboardSource).toContain('data-testid="dashboard-workday-right-rail"');
    expect(cssSource).toContain("grid-template-columns: 260px minmax(0, 1fr)");
    expect(cssSource).toContain("grid-template-columns: minmax(0, 1fr) 280px");
    expect(cssSource).toContain("grid-template-columns: repeat(6, minmax(0, 1fr))");
    expect(cssSource).toContain("grid-column: 1;");
    expect(cssSource).toContain(
      ".dashboard-reference-workday .dashboard-workday-side {"
    );
    expect(cssSource).toContain("grid-column: 2;");
  });

  it("показывает только имя сотрудника в приветствии", () => {
    expect(firstNameFromDisplayName("Шамиль Вильданов")).toBe("Шамиль");
    expect(firstNameFromDisplayName("  Шамиль  ")).toBe("Шамиль");
    expect(firstNameFromDisplayName(null)).toBe("коллега");
  });

  it("отображает статусы задач как последовательные этапы рабочего процесса", () => {
    expect(taskProgressStep("todo")).toBe(0);
    expect(taskProgressStep("in_progress")).toBe(1);
    expect(taskProgressStep("done")).toBe(3);
  });

  it("разделяет финансовые и операционные причины внимания к хозяйству", () => {
    expect(farmAttentionTone("Просрочен платеж по договору")).toBe("finance");
    expect(farmAttentionTone("Нет активности 30 дней")).toBe("operation");
  });

  it("сохраняет шесть основных модулей в согласованном порядке", () => {
    expect(dashboardModules.map(module => module.title)).toEqual([
      "Схемы защиты",
      "Хозяйства",
      "Генератор КП",
      "Заявки",
      "Продажи",
      "Тестирование",
    ]);
  });

  it("назначает каждому модулю отдельный цветовой токен", () => {
    expect(new Set(dashboardModules.map(module => module.tone)).size).toBe(6);
  });

  it("сохраняет референсную структуру Overview и шесть быстрых действий", () => {
    expect(dashboardReferenceLayout).toEqual([
      "hero",
      "actions",
      "plan",
      "clients",
      "sales",
      "quickAccess",
      "attention",
      "pipeline",
      "notifications",
    ]);
    expect(dashboardActions.map(action => action.title)).toEqual([
      "Новый клиент",
      "Встреча",
      "Звонок",
      "Подобрать препарат",
      "Рассчитать норму",
      "Создать КП",
    ]);
    expect(new Set(dashboardActions.map(action => action.href)).size).toBe(4);
  });

  it("сохраняет уникальные рабочие маршруты всех карточек", () => {
    const hrefs = dashboardModules.map(module => module.href);
    expect(new Set(hrefs).size).toBe(6);
    expect(hrefs).toContain("/farms");
    expect(hrefs).toContain("/proposals/new");
    expect(hrefs).toContain("/sales");
  });
});
