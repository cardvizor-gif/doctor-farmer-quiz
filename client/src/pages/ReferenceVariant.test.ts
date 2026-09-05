import { describe, expect, it } from "vitest";
import { referenceNavigation, resolveReferenceTarget } from "./ReferenceVariant";

describe("демонстрационный вариант по референсу", () => {
  it("сохраняет шесть основных точек входа АгроПомощник DF без дублирования", () => {
    expect(referenceNavigation.map((item) => item.id)).toEqual([
      "overview",
      "agro",
      "farms",
      "proposals",
      "knowledge",
      "quiz",
    ]);
    expect(new Set(referenceNavigation.map((item) => item.label)).size).toBe(referenceNavigation.length);
  });

  it("направляет ключевые карточки в соответствующий раздел демонстрационного меню", () => {
    expect(resolveReferenceTarget("АгроПомощник")).toBe("agro");
    expect(resolveReferenceTarget("Хозяйства")).toBe("farms");
    expect(resolveReferenceTarget("Генератор КП")).toBe("proposals");
  });
});
