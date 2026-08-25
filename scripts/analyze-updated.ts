interface EmployeeResult {
  name: string;
  date: string;
  score: number;
  total: number;
  percent: number;
  sections: Record<string, { correct: number; total: number }>;
}

const rawData: EmployeeResult[] = [
  { name: "Дусалаков Далер", date: "17.08.2026, 15:22", score: 16, total: 30, percent: 53, sections: { "Действующее вещество": { correct: 3, total: 5 }, "Практика применения": { correct: 2, total: 5 }, "Группа препарата": { correct: 4, total: 5 }, "Норма расхода": { correct: 2, total: 5 }, "Культуры применения": { correct: 1, total: 5 }, "Препарат по ДВ": { correct: 4, total: 5 } } },
  { name: "Азат", date: "17.08.2026, 15:23", score: 24, total: 30, percent: 80, sections: { "Действующее вещество": { correct: 5, total: 5 }, "Практика применения": { correct: 4, total: 5 }, "Препарат по ДВ": { correct: 4, total: 5 }, "Группа препарата": { correct: 5, total: 5 }, "Культуры применения": { correct: 2, total: 5 }, "Норма расхода": { correct: 4, total: 5 } } },
  { name: "Жанзаков Ерлан", date: "17.08.2026, 15:25", score: 26, total: 30, percent: 87, sections: { "Группа препарата": { correct: 5, total: 5 }, "Культуры применения": { correct: 5, total: 5 }, "Практика применения": { correct: 4, total: 5 }, "Действующее вещество": { correct: 5, total: 5 }, "Норма расхода": { correct: 2, total: 5 }, "Препарат по ДВ": { correct: 5, total: 5 } } },
  { name: "Горбачев Павел", date: "17.08.2026, 15:26", score: 22, total: 30, percent: 73, sections: { "Действующее вещество": { correct: 4, total: 5 }, "Группа препарата": { correct: 5, total: 5 }, "Культуры применения": { correct: 2, total: 5 }, "Норма расхода": { correct: 3, total: 6 }, "Практика применения": { correct: 3, total: 5 }, "Препарат по ДВ": { correct: 5, total: 5 } } },
  { name: "Музафаров Римад", date: "17.08.2026, 15:36", score: 21, total: 30, percent: 70, sections: { "Практика применения": { correct: 3, total: 5 }, "Препарат по ДВ": { correct: 5, total: 5 }, "Норма расхода": { correct: 3, total: 5 }, "Группа препарата": { correct: 4, total: 5 }, "Культуры применения": { correct: 1, total: 5 }, "Действующее вещество": { correct: 5, total: 5 } } },
  { name: "Исмаилов Тимур", date: "17.08.2026, 15:28", score: 17, total: 30, percent: 57, sections: { "Действующее вещество": { correct: 3, total: 5 }, "Норма расхода": { correct: 3, total: 5 }, "Группа препарата": { correct: 3, total: 5 }, "Препарат по ДВ": { correct: 3, total: 5 }, "Практика применения": { correct: 3, total: 5 }, "Культуры применения": { correct: 2, total: 5 } } },
  { name: "Жолшибаев Арман", date: "17.08.2026, 15:28", score: 13, total: 30, percent: 43, sections: { "Препарат по ДВ": { correct: 4, total: 4 }, "Действующее вещество": { correct: 3, total: 4 }, "Практика применения": { correct: 1, total: 3 }, "Группа препарата": { correct: 3, total: 3 }, "Норма расхода": { correct: 1, total: 3 }, "Культуры применения": { correct: 1, total: 4 } } },
  { name: "Михайленко Константин", date: "17.08.2026, 15:31", score: 19, total: 30, percent: 63, sections: { "Культуры применения": { correct: 3, total: 5 }, "Препарат по ДВ": { correct: 5, total: 5 }, "Норма расхода": { correct: 1, total: 4 }, "Действующее вещество": { correct: 4, total: 5 }, "Группа препарата": { correct: 5, total: 5 }, "Практика применения": { correct: 1, total: 5 } } },
  { name: "Хакимов Артур", date: "17.08.2026, 15:33", score: 15, total: 30, percent: 50, sections: { "Культуры применения": { correct: 1, total: 5 }, "Практика применения": { correct: 2, total: 5 }, "Группа препарата": { correct: 4, total: 5 }, "Препарат по ДВ": { correct: 4, total: 5 }, "Норма расхода": { correct: 1, total: 5 }, "Действующее вещество": { correct: 3, total: 5 } } },
  { name: "Мусин Рафис", date: "17.08.2026, 15:35", score: 27, total: 30, percent: 90, sections: { "Препарат по ДВ": { correct: 5, total: 5 }, "Норма расхода": { correct: 5, total: 5 }, "Группа препарата": { correct: 5, total: 5 }, "Практика применения": { correct: 4, total: 5 }, "Культуры применения": { correct: 3, total: 5 }, "Действующее вещество": { correct: 5, total: 5 } } },
];

const sorted = [...rawData].sort((a, b) => b.score - a.score);
console.log("=== ОБНОВЛЕННЫЙ РЕЙТИНГ ===");
sorted.forEach((item, index) => {
  console.log(`${index + 1}. ${item.name} — ${item.score}/30 (${item.percent}%)`);
});

const sectionStats: Record<string, { correct: number; total: number }> = {};
rawData.forEach((item) => {
  for (const [sec, val] of Object.entries(item.sections)) {
    if (!sectionStats[sec]) sectionStats[sec] = { correct: 0, total: 0 };
    sectionStats[sec].correct += val.correct;
    sectionStats[sec].total += val.total;
  }
});

console.log("\n=== ОБНОВЛЕННАЯ СТАТИСТИКА ПО РАЗДЕЛАМ ===");
Object.entries(sectionStats)
  .map(([sec, val]) => ({ sec, percent: Math.round((val.correct / val.total) * 100), ...val }))
  .sort((a, b) => b.percent - a.percent)
  .forEach((item) => {
    console.log(`${item.sec}: ${item.correct}/${item.total} (${item.percent}%)`);
  });
