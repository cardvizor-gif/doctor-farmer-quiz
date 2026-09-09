import type { PriceItem } from "@/data/priceCatalog";
import type { PriceRecord } from "@/data/spkUralPrice";

export type ActiveCatalogProduct = {
  catalogId: string;
  name: string;
  preparativeForm?: string | null;
  category?: string | null;
  productGroup?: string | null;
  active: number;
  registrationStatus?: string | null;
  pricePrepayment?: string | number | null;
  price5050?: string | number | null;
  price7030?: string | number | null;
  priceDeferred?: string | number | null;
  fullDataJson: string;
};

function dataOf(product: ActiveCatalogProduct): Record<string, unknown> {
  try { return JSON.parse(product.fullDataJson || "{}"); } catch { return {}; }
}

const value = (data: Record<string, unknown>, key: string, fallback = "") => String(data[key] ?? fallback).trim();
const list = (raw: string) => raw.split(/[;,]/).map((item) => item.trim()).filter(Boolean);
const price = (raw: string | number | null | undefined) => {
  const parsed = Number(String(raw ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
};

export function catalogProductToPriceItem(product: ActiveCatalogProduct): PriceItem {
  const data = dataOf(product);
  const regulation = {
    phase: value(data, "Фаза и время обработки"),
    objects: value(data, "Вредные объекты"),
    conditions: value(data, "Условия применения"),
    restrictions: value(data, "Ограничения и требования"),
  };
  const hasRegulation = Object.values(regulation).some(Boolean);
  return {
    name: product.name,
    dv: value(data, "Действующее вещество", value(data, "Концентрация / состав")),
    rate: value(data, "Норма для отображения", `${value(data, "Норма от")}–${value(data, "Норма до")} ${value(data, "Единица нормы")}`.trim()),
    category: value(data, "Категория", product.category ?? ""),
    group: value(data, "Группа", product.productGroup ?? ""),
    cultures: list(value(data, "Культуры")),
    ...(hasRegulation ? { regulation } : {}),
  };
}

export function catalogProductToPriceRecord(product: ActiveCatalogProduct): PriceRecord {
  const data = dataOf(product);
  return {
    productName: product.name,
    sourceCode: Number(product.catalogId.replace(/\D/g, "")) || 0,
    sourceRow: 0,
    sourceRate: value(data, "Норма для отображения", `${value(data, "Норма от")}–${value(data, "Норма до")}`),
    priceUnit: /уп|комплект/i.test(value(data, "Единица продажи")) ? "package" : "unit",
    prepayment: price(product.pricePrepayment) ?? 0,
    payment3070: price(product.price7030) ?? 0,
    payment5050: price(product.price5050),
    payment7030: price(product.price7030),
    deferred: price(product.priceDeferred) ?? 0,
  };
}
