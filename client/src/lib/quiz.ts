/* Doctor Farmer Quiz — Corporate Modern Agro style: data-first quiz mechanics with clear, calm interactions. */
import { DRUGS } from "@/data/drugs";

export type Mode = "dv" | "prep" | "cult" | "group" | "norma" | "match";
export type ChoiceQuestion = {
  id: string;
  type: Exclude<Mode, "match">;
  typeLabel: string;
  kind: "choice";
  prompt: string;
  correct: string;
  wrong: string[];
  explanation: string;
};
export type MatchQuestion = {
  id: string;
  type: "match";
  typeLabel: string;
  kind: "match";
  prompt: string;
  items: { name: string; dv: string }[];
  explanation: string;
};
export type Question = ChoiceQuestion | MatchQuestion;

export const MODE_META: Record<Mode, { label: string; short: string; icon: string; color: string; tint: string }> = {
  dv: { label: "Действующее вещество", short: "ДВ препарата", icon: "✦", color: "#166534", tint: "#E8F5E9" },
  prep: { label: "Препарат по ДВ", short: "Препарат по ДВ", icon: "⌕", color: "#0F766E", tint: "#E0F2F1" },
  cult: { label: "Культуры применения", short: "Культуры", icon: "⌁", color: "#B45309", tint: "#FFF7ED" },
  group: { label: "Группа препарата", short: "Группа", icon: "▦", color: "#6D28D9", tint: "#F3E8FF" },
  norma: { label: "Норма расхода", short: "Норма расхода", icon: "◌", color: "#1D4ED8", tint: "#EFF6FF" },
  match: { label: "Сопоставление", short: "Сопоставление", icon: "↔", color: "#A16207", tint: "#FEFCE8" },
};

export const DEFAULT_MODES: Mode[] = ["dv", "prep", "cult", "group", "norma", "match"];

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

type Drug = (typeof DRUGS)[number];
type ChoiceKey = "dv" | "name" | "cult" | "norma";

function wrongAnswers(except: Drug, key: ChoiceKey, count = 3): string[] {
  return shuffle(DRUGS.filter((drug) => drug !== except && drug[key] !== except[key]))
    .slice(0, count)
    .map((drug) => String(drug[key]));
}

export function buildQuestions(modes: Mode[]): Question[] {
  const questions: Question[] = [];
  const groups = Array.from(new Set(DRUGS.map((drug) => drug.group)));

  DRUGS.forEach((drug, drugIndex) => {
    if (modes.includes("dv")) {
      questions.push({
        id: `dv-${drug.n}-${drugIndex}`,
        type: "dv",
        typeLabel: MODE_META.dv.label,
        kind: "choice",
        prompt: `Препарат «${drug.name}»\n\nКакое действующее вещество?`,
        correct: drug.dv,
        wrong: wrongAnswers(drug, "dv"),
        explanation: `${drug.name} (${drug.group}): ${drug.dv}`,
      });
    }
    if (modes.includes("prep")) {
      questions.push({
        id: `prep-${drug.n}-${drugIndex}`,
        type: "prep",
        typeLabel: MODE_META.prep.label,
        kind: "choice",
        prompt: `Действующее вещество:\n«${drug.dv}»\n\nКакой препарат?`,
        correct: drug.name,
        wrong: wrongAnswers(drug, "name"),
        explanation: `${drug.dv} → ${drug.name} (${drug.group})`,
      });
    }
    if (modes.includes("cult")) {
      questions.push({
        id: `cult-${drug.n}-${drugIndex}`,
        type: "cult",
        typeLabel: MODE_META.cult.label,
        kind: "choice",
        prompt: `«${drug.name}»\n\nДля каких культур зарегистрирован?`,
        correct: drug.cult,
        wrong: wrongAnswers(drug, "cult"),
        explanation: `${drug.name}: ${drug.cult}`,
      });
    }
    if (modes.includes("group")) {
      const wrongGroups = shuffle(groups.filter((group) => group !== drug.group)).slice(0, 3);
      if (wrongGroups.length === 3) {
        questions.push({
          id: `group-${drug.n}-${drugIndex}`,
          type: "group",
          typeLabel: MODE_META.group.label,
          kind: "choice",
          prompt: `«${drug.name}»\n\nК какой группе относится?`,
          correct: drug.group,
          wrong: wrongGroups,
          explanation: `${drug.name} — ${drug.group}. ДВ: ${drug.dv}`,
        });
      }
    }
    if (modes.includes("norma")) {
      questions.push({
        id: `norma-${drug.n}-${drugIndex}`,
        type: "norma",
        typeLabel: MODE_META.norma.label,
        kind: "choice",
        prompt: `«${drug.name}»\n\nНорма применения?`,
        correct: drug.norma,
        wrong: wrongAnswers(drug, "norma"),
        explanation: `${drug.name}: норма ${drug.norma}. ДВ: ${drug.dv}`,
      });
    }
  });

  if (modes.includes("match")) {
    const matchable = shuffle([...DRUGS]).slice(0, Math.min(DRUGS.length, 40));
    for (let i = 0; i < matchable.length - 3; i += 4) {
      const group = matchable.slice(i, i + 4);
      questions.push({
        id: `match-${i}`,
        type: "match",
        typeLabel: MODE_META.match.label,
        kind: "match",
        prompt: "Сопоставь каждый препарат с его действующим веществом",
        items: group.map((drug) => ({ name: drug.name, dv: drug.dv })),
        explanation: group.map((drug) => `${drug.name} → ${drug.dv}`).join("\n"),
      });
    }
  }

  return questions;
}

export function formatScore(score: number, total: number): number {
  return total ? Math.round((score / total) * 100) : 0;
}
