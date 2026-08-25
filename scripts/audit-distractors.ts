import { DRUGS } from "../client/src/data/drugs";
import { buildQuestions } from "../client/src/lib/quiz";
import { SITUATIONAL_QUESTIONS } from "../client/src/data/situations";

const questions = buildQuestions(["dv", "prep", "cult", "group", "norma"]);
const byName = new Map(DRUGS.map((drug) => [drug.name, drug]));
const byDv = new Map<string, (typeof DRUGS)[number][]>();
const byCult = new Map<string, (typeof DRUGS)[number][]>();
const byNorma = new Map<string, (typeof DRUGS)[number][]>();
for (const drug of DRUGS) {
  byDv.set(drug.dv, [...(byDv.get(drug.dv) ?? []), drug]);
  byCult.set(drug.cult, [...(byCult.get(drug.cult) ?? []), drug]);
  byNorma.set(drug.norma, [...(byNorma.get(drug.norma) ?? []), drug]);
}

function findDrug(questionId: string) {
  const parts = questionId.split("-");
  return DRUGS.find((drug) => String(drug.n) === parts[1]);
}

function sameGroupCount(drug: (typeof DRUGS)[number], names: string[]) {
  return names.filter((name) => byName.get(name)?.group === drug.group).length;
}

for (const type of ["dv", "prep", "cult", "norma", "group"] as const) {
  const subset = questions.filter((question) => question.type === type && question.kind === "choice");
  const counts = subset.map((question) => {
    const drug = findDrug(question.id);
    if (!drug) return 0;
    if (type === "group") return question.wrong.length;
    if (type === "prep") return sameGroupCount(drug, question.wrong);
    if (type === "dv") return question.wrong.reduce((total, answer) => total + (byDv.get(answer)?.some((item) => item.group === drug.group) ? 1 : 0), 0);
    if (type === "cult") return question.wrong.filter((answer) => byCult.get(answer)?.some((item) => item.group === drug.group)).length;
    return question.wrong.filter((answer) => byNorma.get(answer)?.some((item) => item.group === drug.group)).length;
  });
  const average = counts.reduce((sum, count) => sum + count, 0) / counts.length;
  console.log(`${type}: ${subset.length} questions; average same-group distractors=${average.toFixed(2)}; min=${Math.min(...counts)}; max=${Math.max(...counts)}`);
}

const situationByName = new Map(DRUGS.map((drug) => [drug.name, drug]));
let situationMismatches = 0;
let missingProducts = 0;
for (const question of SITUATIONAL_QUESTIONS) {
  const correctDrug = situationByName.get(question.correct);
  const wrongGroups = question.wrong.map((answer) => situationByName.get(answer)?.group ?? "нет в прайсе");
  if (!correctDrug || wrongGroups.some((group) => group === "нет в прайсе" || group !== correctDrug.group)) {
    situationMismatches += 1;
    console.log(`situation ${question.id}: correct=${question.correct} (${correctDrug?.group ?? "нет в прайсе"}); wrong=${question.wrong.join(" | ")}; groups=${wrongGroups.join(" | ")}`);
  }
  if (!correctDrug) missingProducts += 1;
  missingProducts += question.wrong.filter((answer) => !situationByName.has(answer)).length;
}
console.log(`situations: ${SITUATIONAL_QUESTIONS.length}; category/missing-product issues=${situationMismatches}; missing product references=${missingProducts}`);

for (const question of questions.filter((item) => item.type === "dv").slice(0, 8)) {
  const drug = findDrug(question.id);
  console.log(JSON.stringify({ prompt: question.prompt.split("\n")[0], group: drug?.group, correct: question.correct, wrong: question.wrong }));
}
