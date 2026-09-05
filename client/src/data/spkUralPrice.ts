export type PaymentTerm = "prepayment" | "payment3070" | "deferred";
export type PriceUnit = "unit" | "package";

export type PriceRecord = {
  productName: string;
  sourceCode: number;
  sourceRow: number;
  sourceRate: string;
  priceUnit: PriceUnit;
  prepayment: number;
  payment3070: number;
  deferred: number;
};

export const SPK_URAL_PRICE_SOURCE = {
  title: "Актуальный прайс АгроПомощник DF",
  sheet: "актуальная версия",
  priceNote: "Цены определяются выбранным условием оплаты",
} as const;

export const PAYMENT_TERMS: Record<PaymentTerm, { label: string; description: string }> = {
  prepayment: { label: "100% предоплата", description: "Цена по колонке «100% / предоплата»" },
  payment3070: { label: "Оплата 30/70", description: "Цена по колонке «30/70»" },
  deferred: { label: "Отсрочка / под урожай", description: "Цена по колонке «Отсрочка / под урожай»" },
};

export const EXCLUDED_FROM_AUTO_PRICING = ["Агроника, КС"] as const;

// Извлечено из файла «СПКУРАЛ.xlsx», лист «прайс». Для бинарной упаковки цена относится к одной заводской упаковке; для остальных позиций — к расчётной единице продукта из прайса.
export const SPK_URAL_PRICE: PriceRecord[] = [
  { productName: "Актеон, ВР", sourceCode: 14, sourceRow: 19, sourceRate: "0,3–0,35", priceUnit: "unit", prepayment: 1295.1, payment3070: 1386, deferred: 1580 },
  { productName: "Алтын, КЭ", sourceCode: 53, sourceRow: 50, sourceRate: "0,1–0,2", priceUnit: "unit", prepayment: 368.9, payment3070: 394.7, deferred: 450 },
  { productName: "Богдэн, ВДГ", sourceCode: 18, sourceRow: 21, sourceRate: "0,015–0,050", priceUnit: "unit", prepayment: 2300, payment3070: 2461, deferred: 3300 },
  { productName: "Вернер, КС", sourceCode: 69, sourceRow: 66, sourceRate: "0,2–0,5", priceUnit: "unit", prepayment: 1188.5, payment3070: 1271.9, deferred: 1450 },
  { productName: "Гуарил, ВДГ", sourceCode: 21, sourceRow: 23, sourceRate: "0,12", priceUnit: "unit", prepayment: 2901.6, payment3070: 3105.3, deferred: 3540 },
  { productName: "Клегал, МКЭ", sourceCode: 24, sourceRow: 26, sourceRate: "0,4–0,8", priceUnit: "unit", prepayment: 880, payment3070: 942, deferred: 1120 },
  { productName: "КлопЭфир Интенсив", sourceCode: 7, sourceRow: 12, sourceRate: "12–16 га", priceUnit: "package", prepayment: 3442.6, payment3070: 3684.2, deferred: 4200 },
  { productName: "Контур Антистресс, ВР", sourceCode: 2, sourceRow: 6, sourceRate: "0,1–0,2", priceUnit: "unit", prepayment: 557.7, payment3070: 596.8, deferred: 780 },
  { productName: "Контур Профи, ВР", sourceCode: 4, sourceRow: 8, sourceRate: "0,1–0,2", priceUnit: "unit", prepayment: 557.7, payment3070: 596.8, deferred: 780 },
  { productName: "Кэйталин, ВР", sourceCode: 38, sourceRow: 38, sourceRate: "1,4–4,0", priceUnit: "unit", prepayment: 400, payment3070: 428, deferred: 488 },
  { productName: "Меклонил, МЭ", sourceCode: 62, sourceRow: 61, sourceRate: "0,8–3,5", priceUnit: "unit", prepayment: 2745.9, payment3070: 2938.6, deferred: 3350 },
  { productName: "Неон-99", sourceCode: 82, sourceRow: 80, sourceRate: "0,1–0,2", priceUnit: "unit", prepayment: 311.5, payment3070: 333.3, deferred: 380 },
  { productName: "Орель, ВР", sourceCode: 30, sourceRow: 31, sourceRate: "0,75–1,0", priceUnit: "unit", prepayment: 712.3, payment3070: 762.3, deferred: 869 },
  { productName: "ПроТэб, КМЭ", sourceCode: 78, sourceRow: 73, sourceRate: "0,3–0,6", priceUnit: "unit", prepayment: 1213.1, payment3070: 1298.2, deferred: 1480 },
  { productName: "Сотейра, ВРК", sourceCode: 37, sourceRow: 37, sourceRate: "1,0–1,2", priceUnit: "unit", prepayment: 721.3, payment3070: 771.9, deferred: 880 },
  { productName: "Софт, КЭ", sourceCode: 23, sourceRow: 25, sourceRate: "0,4–1,2", priceUnit: "unit", prepayment: 901.6, payment3070: 964.9, deferred: 1100 },
  { productName: "Тайпан, КЭ", sourceCode: 40, sourceRow: 40, sourceRate: "0,25–0,35", priceUnit: "unit", prepayment: 1163.9, payment3070: 1245.6, deferred: 1420 },
  { productName: "Тайсон, КС", sourceCode: 57, sourceRow: 54, sourceRate: "0,2–0,4", priceUnit: "unit", prepayment: 3442.6, payment3070: 3684.2, deferred: 4200 },
  { productName: "Тиматерр, КС", sourceCode: 56, sourceRow: 53, sourceRate: "0,04–0,11", priceUnit: "unit", prepayment: 737.7, payment3070: 789.5, deferred: 900 },
  { productName: "Тифи, ВДГ", sourceCode: 43, sourceRow: 42, sourceRate: "0,01–0,025", priceUnit: "unit", prepayment: 6200, payment3070: 6635, deferred: 8200 },
  { productName: "Фэнсди, КС", sourceCode: 58, sourceRow: 55, sourceRate: "0,1–0,2", priceUnit: "unit", prepayment: 1049.2, payment3070: 1122.8, deferred: 1280 },
  { productName: "Царумин, ВРК", sourceCode: 17, sourceRow: 20, sourceRate: "0,5–1,5", priceUnit: "unit", prepayment: 600, payment3070: 644, deferred: 754 },
  { productName: "Элант Экстра, СЭ", sourceCode: 51, sourceRow: 47, sourceRate: "0,3–0,5", priceUnit: "unit", prepayment: 422.1, payment3070: 451.8, deferred: 515 },
];

const normalize = (value: string) => value.toLocaleLowerCase("ru-RU").replace(/ё/g, "е").replace(/\*/g, "").replace(/[^a-zа-я0-9]+/gi, " ").trim();

export function findSpkUralPrice(productName: string) {
  const normalized = normalize(productName);
  return SPK_URAL_PRICE.find(item => normalize(item.productName) === normalized) ?? null;
}
