import { describe, expect, it } from "vitest";
import { SITUATIONAL_QUESTIONS } from "@/data/situations";

describe("ситуация с гербицидами сплошного действия", () => {
  it("различает Кэйталин и Кэйталин Экстра по соли и норме", () => {
    const question = SITUATIONAL_QUESTIONS.find((item) => item.id === "situation-29");
    expect(question).toBeDefined();
    expect(question?.kind).toBe("choice");
    if (!question || question.kind !== "choice") return;

    expect(question.correct).toBe("Кэйталин, ВР");
    expect(question.prompt).toContain("калийной соли глифосата");
    expect(question.prompt).toContain("1,4–4,0 л/га");
    expect(question.wrong).toContain("Кэйталин Экстра, ВДГ");
    expect(question.explanation).toContain("изопропиламинную соль");
    expect(question.explanation).toContain("1,0–3,0 кг/га");
  });
});
