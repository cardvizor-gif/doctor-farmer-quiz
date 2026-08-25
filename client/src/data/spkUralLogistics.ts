export type ProductLogistics = {
  productName: string;
  sourceName: string;
  packageSize: number;
  unit: "л" | "кг" | "компл.";
  unitsPerBox?: number;
  unitsPerPallet?: number;
  storage?: string;
};

export const SPK_URAL_LOGISTICS_SOURCE = {
  title: "УПАКОВКА 2024–2026",
  file: "Справочнаяинформацияпозагрузкивпаллетах2024-2026.xlsx",
  sheet: "Лист1",
} as const;

// Включены только однозначные соответствия «препарат схемы → строка справки».
// Варианты поставки «Россия/Китай» и неполные строки не подставляются автоматически.
export const SPK_URAL_LOGISTICS: ProductLogistics[] = [
  { productName: "Актеон, ВР", sourceName: "Актеон", packageSize: 10, unit: "л", unitsPerBox: 2, unitsPerPallet: 540, storage: "−10…+30 °C" },
  { productName: "Богдэн, ВДГ", sourceName: "Богдэн", packageSize: 0.5, unit: "кг", unitsPerBox: 1, storage: "−25…+35 °C" },
  { productName: "Вернер, КС", sourceName: "Вернер фунгицид ДФ", packageSize: 5, unit: "л", unitsPerBox: 4, unitsPerPallet: 480, storage: "−5…+25 °C" },
  { productName: "Гуарил, ВДГ", sourceName: "Гуарил", packageSize: 0.5, unit: "кг", unitsPerBox: 1, storage: "−25…+35 °C" },
  { productName: "КлопЭфир Интенсив", sourceName: "Клопэфир Интенсив", packageSize: 1, unit: "компл.", unitsPerPallet: 96, storage: "−5…+25 °C" },
  { productName: "Контур Антистресс, ВР", sourceName: "Контур Антистресс", packageSize: 10, unit: "л", unitsPerBox: 2, unitsPerPallet: 540, storage: "0…+25 °C" },
  { productName: "Контур Профи, ВР", sourceName: "Контур Профи", packageSize: 10, unit: "л", unitsPerBox: 2, unitsPerPallet: 540, storage: "0…+25 °C" },
  { productName: "Кэйталин, ВР", sourceName: "Кэйталин", packageSize: 10, unit: "л", unitsPerBox: 2, unitsPerPallet: 540, storage: "0…+30 °C" },
  { productName: "Неон-99", sourceName: "Неон-99", packageSize: 10, unit: "л", unitsPerBox: 1, unitsPerPallet: 540, storage: "−20…+30 °C" },
  { productName: "Орель, ВР", sourceName: "Орель", packageSize: 10, unit: "л", unitsPerBox: 2, unitsPerPallet: 540, storage: "0…+25 °C" },
  { productName: "ПроТэб, КМЭ", sourceName: "ПроТэб", packageSize: 5, unit: "л", unitsPerBox: 2, unitsPerPallet: 480, storage: "−10…+25 °C" },
  { productName: "Сотейра, ВРК", sourceName: "Сотейра", packageSize: 10, unit: "л", unitsPerBox: 2, unitsPerPallet: 540, storage: "0…+30 °C" },
  { productName: "Софт, КЭ", sourceName: "Софт", packageSize: 10, unit: "л", unitsPerBox: 2, unitsPerPallet: 540, storage: "−10…+30 °C" },
  { productName: "Тайпан, КЭ", sourceName: "Тайпан", packageSize: 5, unit: "л", unitsPerBox: 4, unitsPerPallet: 480, storage: "−15…+30 °C" },
  { productName: "Тайсон, КС", sourceName: "Подтверждённая фасовка", packageSize: 5, unit: "л" },
  { productName: "Тифи, ВДГ", sourceName: "Тифи (Китай)", packageSize: 0.1, unit: "кг", unitsPerBox: 100 },
  { productName: "Фэнсди, КС", sourceName: "ФэнсДи", packageSize: 5, unit: "л", unitsPerBox: 4, unitsPerPallet: 480, storage: "+5…+25 °C" },
  { productName: "Царумин, ВРК", sourceName: "Царумин (Китай)", packageSize: 5, unit: "л", unitsPerBox: 4 },
  { productName: "Элант Экстра, СЭ", sourceName: "Элант Экстра", packageSize: 10, unit: "л", unitsPerBox: 2, unitsPerPallet: 540, storage: "−10…+25 °C" },
];

const normalize = (value: string) => value.toLocaleLowerCase("ru-RU").replace(/ё/g, "е").replace(/\*/g, "").replace(/[^a-zа-я0-9]+/gi, " ").trim();

export function findSpkUralLogistics(productName: string) {
  const normalized = normalize(productName);
  return SPK_URAL_LOGISTICS.find(item => normalize(item.productName) === normalized) ?? null;
}
