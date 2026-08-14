import { buildQuestions } from "../client/src/lib/quiz";

const questions = buildQuestions(["dv", "prep", "cult", "group", "norma", "situation"]);
for (const phrase of ["Турион, КЭ", "Вернер, КС", "Меклонил, МЭ", "Фэнс, КЭ"]) {
  const found = questions.find((question) => question.prompt.includes(phrase) && question.type === "dv");
  if (found && found.kind === "choice") {
    console.log(JSON.stringify({ phrase, prompt: found.prompt, correct: found.correct, wrong: found.wrong }));
  }
}

for (const phrase of ["жёсткая", "десикацию", "выравнять созревание"]) {
  const found = questions.find((question) => question.prompt.includes(phrase));
  if (found && found.kind === "choice") {
    console.log(JSON.stringify({ phrase, prompt: found.prompt, correct: found.correct, wrong: found.wrong }));
  }
}
