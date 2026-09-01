import { describe, expect, it } from "vitest";
import { dashboardModules } from "./Dashboard";

describe("главная страница рабочего кабинета", () => {
  it("сохраняет шесть основных модулей в согласованном порядке", () => {
    expect(dashboardModules.map((module) => module.title)).toEqual([
      "АгроПомощник",
      "Хозяйства",
      "Генератор КП",
      "Заявки",
      "База знаний",
      "Тестирование",
    ]);
  });

  it("сохраняет уникальные рабочие маршруты всех карточек", () => {
    const hrefs = dashboardModules.map((module) => module.href);
    expect(new Set(hrefs).size).toBe(6);
    expect(hrefs).toContain("/farms");
    expect(hrefs).toContain("/proposals/new");
  });
});
