import { describe, expect, it } from "vitest";
import { dashboardActions, dashboardModules, dashboardReferenceLayout, dashboardSubtitle, dashboardTitle, farmAttentionTone, firstNameFromDisplayName, taskProgressStep, timeOfDayGreeting } from "./Dashboard";

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

  it("сохраняет референсную структуру Overview и пять быстрых действий", () => {
    expect(dashboardReferenceLayout).toEqual(["hero", "summary", "actions", "plan", "attention", "pipeline", "notifications"]);
    expect(dashboardActions.map((action) => action.title)).toEqual(["Новое хозяйство", "Новая задача", "Создать КП", "Новая заявка", "Подобрать схему"]);
    expect(new Set(dashboardActions.map((action) => action.href)).size).toBe(5);
  });

  it("сохраняет уникальные рабочие маршруты всех карточек", () => {
    const hrefs = dashboardModules.map((module) => module.href);
    expect(new Set(hrefs).size).toBe(6);
    expect(hrefs).toContain("/farms");
    expect(hrefs).toContain("/proposals/new");
    expect(hrefs).toContain("/sales");
  });
});
