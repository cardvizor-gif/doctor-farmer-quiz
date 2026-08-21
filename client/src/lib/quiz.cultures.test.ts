import { describe, expect, it } from "vitest";
import { DRUGS } from "@/data/drugs";
import { buildQuestions } from "@/lib/quiz";

const nonCropGroups = new Set(["Вспомогательный", "Фумигант"]);
const functionOnlyAnswers = /ПАВ|суперсмачиватель|умягчитель воды|пеногаситель|антистрессант|стимулятор питания|зернохранилища/i;

describe("рубрика Культуры применения", () => {
  it("не создаёт вопросы для функциональных вспомогательных средств", () => {
    const questions = buildQuestions(["cult"]);
    expect(questions.some((question) => question.prompt.includes("Неон-99 Турбо"))).toBe(false);
    expect(questions.some((question) => question.prompt.includes("Гласис, ВР"))).toBe(false);
    expect(questions.length).toBeGreaterThan(0);
  });

  it("формирует три отличающихся варианта только из культурных значений", () => {
    const questions = buildQuestions(["cult"]);
    expect(questions.length).toBeGreaterThan(0);

    for (const question of questions) {
      if (question.kind !== "choice") continue;
      expect(question.wrong).toHaveLength(3);
      expect(functionOnlyAnswers.test(question.correct)).toBe(false);
      expect(question.wrong.some((answer) => functionOnlyAnswers.test(answer))).toBe(false);
      expect(new Set([question.correct, ...question.wrong]).size).toBe(4);
    }

    expect(DRUGS.filter((drug) => !nonCropGroups.has(drug.group)).length).toBeGreaterThan(0);
  });
});
