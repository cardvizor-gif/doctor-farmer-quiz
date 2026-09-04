import { describe, expect, it } from "vitest";
import { dashboardModules, dashboardSubtitle, dashboardTitle } from "./Dashboard";

describe("главная страница рабочего кабинета", () => {
  it("использует утверждённую формулировку заголовка и подзаголовка", () => {
    expect(dashboardTitle).toBe("Рабочий кабинет");
    expect(dashboardSubtitle).toBe("Хозяйства, схемы защиты, КП и заявки — в одном рабочем кабинете.");
  });

  it("сохраняет шесть основных модулей в согласованном порядке", () => {
    expect(dashboardModules.map((module) => module.title)).toEqual([
      "АгроПомощник",
      "Хозяйства",
      "Генератор КП",
      "Заявки",
      "Продажи",
      "Тестирование",
    ]);
  });

  it("сохраняет уникальные рабочие маршруты всех карточек", () => {
    const hrefs = dashboardModules.map((module) => module.href);
    expect(new Set(hrefs).size).toBe(6);
    expect(hrefs).toContain("/farms");
    expect(hrefs).toContain("/proposals/new");
    expect(hrefs).toContain("/sales");
  });
});
