import { farmInputSchema, farmSalesStages, type FarmInput } from "./farm";

export const FARM_IMPORT_COLUMNS = [
  "Название хозяйства *",
  "Район",
  "Населённый пункт",
  "Контактное лицо",
  "Должность",
  "Телефон",
  "E-mail",
  "Площадь, га",
  "Культуры и площадь по ним",
  "Технология",
  "Статус работы",
  "Потенциал, ₽",
  "Следующее действие",
  "Дата следующего действия",
  "Рабочие заметки",
] as const;

export type FarmImportColumn = (typeof FARM_IMPORT_COLUMNS)[number];
export type FarmImportPreviewRow = {
  rowNumber: number;
  name: string;
  totalArea: number;
  errors: string[];
  farm?: FarmInput;
};

const stageByImportValue: Record<string, FarmInput["salesStage"]> = {
  "новый контакт": "lead",
  lead: "lead",
  диагностика: "diagnostics",
  diagnostics: "diagnostics",
  "кп готовится": "proposal",
  proposal: "proposal",
  согласование: "negotiation",
  negotiation: "negotiation",
  клиент: "client",
  client: "client",
};

function asText(value: unknown) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function asNumber(value: unknown) {
  const text = asText(value).replace(/[\s\u00a0₽]/g, "").replace(",", ".");
  if (!text) return 0;
  const result = Number(text);
  return Number.isFinite(result) ? result : Number.NaN;
}

function normalizeStage(value: unknown): FarmInput["salesStage"] {
  const normalized = asText(value).toLocaleLowerCase("ru-RU");
  return stageByImportValue[normalized] ?? "lead";
}

export function getMissingFarmImportColumns(headers: string[]) {
  return FARM_IMPORT_COLUMNS.slice(0, 1).filter((column) => !headers.includes(column));
}

export function previewFarmImportRows(rows: Record<string, unknown>[]): FarmImportPreviewRow[] {
  return rows.flatMap((row, index) => {
    const isEmptyRow = FARM_IMPORT_COLUMNS.every((column) => !asText(row[column]));
    if (isEmptyRow) return [];
    const candidate = {
      name: asText(row["Название хозяйства *"]),
      district: asText(row["Район"]) || null,
      settlement: asText(row["Населённый пункт"]) || null,
      contactName: asText(row["Контактное лицо"]) || null,
      contactRole: asText(row["Должность"]) || null,
      phone: asText(row["Телефон"]) || null,
      email: asText(row["E-mail"]),
      totalArea: asNumber(row["Площадь, га"]),
      crops: asText(row["Культуры и площадь по ним"]) || null,
      technology: asText(row["Технология"]) || null,
      salesStage: normalizeStage(row["Статус работы"]),
      potentialValue: asNumber(row["Потенциал, ₽"]),
      nextAction: asText(row["Следующее действие"]) || null,
      nextActionAt: asText(row["Дата следующего действия"]) || null,
      notes: asText(row["Рабочие заметки"]) || null,
    };
    const parsed = farmInputSchema.safeParse(candidate);
    return {
      rowNumber: index + 2,
      name: candidate.name || "Без названия",
      totalArea: Number.isFinite(candidate.totalArea) ? candidate.totalArea : 0,
      errors: parsed.success ? [] : parsed.error.issues.map((issue) => issue.message),
      farm: parsed.success ? parsed.data : undefined,
    };
  });
}

export const FARM_IMPORT_MAX_ROWS = 500;
export const FARM_SALES_STAGE_VALUES = farmSalesStages;
