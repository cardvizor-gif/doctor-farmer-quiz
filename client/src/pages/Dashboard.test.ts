import { describe, expect, it } from "vitest";
import { dashboardModules, dashboardSubtitle, dashboardTitle, farmAttentionTone, firstNameFromDisplayName, taskProgressStep } from "./Dashboard";

describe("главная страница рабочего кабинета", () => {
  it("использует утверждённую формулировку заголовка и подзаголовка", () => {
    expect(dashboardTitle).toBe("АгроПомощник");
    expect(dashboardSubtitle).toBe("Схемы защиты");
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
    expect(dashboardModules.map((module) => module.title)).toEqual([
      "Схемы защиты",
      "Хозяйства",
      "Генератор КП",
      "Заявки",
      "Продажи",
      "Тестирование",
    ]);
  });

  it("назначает каждому модулю отдельный цветовой токен", () => {
    expect(new Set(dashboardModules.map((module) => module.tone)).size).toBe(6);
  });

  it("сохраняет уникальные рабочие маршруты всех карточек", () => {
    const hrefs = dashboardModules.map((module) => module.href);
    expect(new Set(hrefs).size).toBe(6);
    expect(hrefs).toContain("/farms");
    expect(hrefs).toContain("/proposals/new");
    expect(hrefs).toContain("/sales");
  });
});
