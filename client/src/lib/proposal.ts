import type { CropProtectionScheme } from "@/data/protectionSchemes";
import { findSpkUralLogistics, type ProductLogistics } from "@/data/spkUralLogistics";
import { EXCLUDED_FROM_AUTO_PRICING, findSpkUralPrice, type PaymentTerm, type PriceRecord } from "@/data/spkUralPrice";

export type AddedSchemeProduct = {
  name: string;
  rate: string;
  dv: string;
  group: string;
};

export type ManualRateOverrides = Record<string, string>;

export const maxDiscountForPaymentTerm: Record<PaymentTerm, number> = {
  prepayment: 2,
  payment5050: 2,
  payment7030: 3,
  deferred: 5,
};

export function addProductToScheme(scheme: CropProtectionScheme, stepIndex: number, product: AddedSchemeProduct): CropProtectionScheme {
  const step = scheme.steps[stepIndex];
  if (!step || step.products.some((item) => item.name === product.name)) return scheme;
  return {
    ...scheme,
    steps: scheme.steps.map((currentStep, index) => index === stepIndex ? {
      ...currentStep,
      products: [...currentStep.products, { ...product, note: "Добавлено менеджером" }],
    } : currentStep),
  };
}

export function applyRateOverrides(scheme: CropProtectionScheme, overrides: ManualRateOverrides): CropProtectionScheme {
  return {
    ...scheme,
    steps: scheme.steps.map((step, stepIndex) => ({
      ...step,
      products: step.products.map((product, productIndex) => {
        const override = overrides[`${stepIndex}-${productIndex}`]?.trim();
        return override ? { ...product, rate: override } : product;
      }),
    })),
  };
}

export function buildProposalSaveButtonLabel(input: { isSaving: boolean; hasFarm: boolean; pricingComplete: boolean; hasManualPrice: boolean }) {
  if (input.isSaving) return "Сохраняем КП…";
  if (!input.hasFarm) return "Выберите хозяйство для сохранения КП";
  if (!input.pricingComplete) return "Не все позиции имеют цену";
  if (input.hasManualPrice) return "Сохранить КП с ручными ценами";
  return "Сохранить КП";
}

export function parseAreaInput(rawValue: string) {
  const normalized = rawValue.trim().replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function calculateProposalTotal(area: number, costPerHectare: number) {
  const normalizedArea = Number.isFinite(area) && area > 0 ? area : 0;
  const normalizedCost = Number.isFinite(costPerHectare) && costPerHectare > 0 ? costPerHectare : 0;
  return Math.round(normalizedArea * normalizedCost * 100) / 100;
}

export function getSchemeForProposal(schemes: CropProtectionScheme[], cropId: string, technology: string) {
  return schemes.find(scheme => scheme.cropId === cropId && scheme.technology === technology)
    ?? schemes.find(scheme => scheme.cropId === cropId)
    ?? null;
}

export function buildProposalTitle(scheme: CropProtectionScheme, farmName: string) {
  return `КП · ${scheme.title} · ${farmName}`;
}

type ProposalContext = {
  farmId?: number | null;
  cropId?: string | null;
  technology?: string | null;
  area?: number | null;
};

export function buildProposalContextQuery(context: ProposalContext) {
  const params = new URLSearchParams();
  if (context.farmId && context.farmId > 0) params.set("farmId", String(context.farmId));
  if (context.cropId) params.set("cropId", context.cropId);
  if (context.technology) params.set("technology", context.technology);
  if (context.area && context.area > 0) params.set("area", String(context.area));
  return params.toString();
}

export function buildAgroHelperContextQuery(context: Pick<ProposalContext, "farmId" | "area">) {
  const params = new URLSearchParams();
  if (context.farmId && context.farmId > 0) params.set("farmId", String(context.farmId));
  if (context.area && context.area > 0) params.set("area", String(context.area));
  return params.toString();
}

export function parseProposalContext(search: string) {
  const params = new URLSearchParams(search);
  const farmId = Number(params.get("farmId"));
  const area = Number(params.get("area"));
  return {
    farmId: Number.isInteger(farmId) && farmId > 0 ? farmId : null,
    cropId: params.get("cropId") || null,
    technology: params.get("technology") || null,
    area: Number.isFinite(area) && area > 0 ? area : null,
  };
}

export type ProductRequirement = {
  label: string;
  basis: "area" | "seed" | "coverage" | "unknown";
  minQuantity: number | null;
  maxQuantity: number | null;
  unit: string | null;
};

const formatNumber = (value: number) => new Intl.NumberFormat("ru-RU", { maximumFractionDigits: value < 10 ? 2 : 1 }).format(value);

const formatRange = (min: number, max: number, unit: string) => min === max
  ? `${formatNumber(min)} ${unit}`
  : `${formatNumber(min)}–${formatNumber(max)} ${unit}`;

export function calculateProductRequirement(rate: string, area: number, seedTons?: number): ProductRequirement {
  if (!Number.isFinite(area) || area <= 0) return { label: "Укажите площадь", basis: "unknown", minQuantity: null, maxQuantity: null, unit: null };
  const normalizedRate = rate.replace(/,/g, ".").replace(/–/g, "-").trim();
  const perUnitMatch = normalizedRate.match(/(\d+(?:\.\d+)?)(?:\s*-\s*(\d+(?:\.\d+)?))?\s*(л|кг)\s*\/\s*(га|т)/i);

  if (perUnitMatch) {
    const first = Number(perUnitMatch[1]);
    const second = perUnitMatch[2] ? Number(perUnitMatch[2]) : first;
    const unit = perUnitMatch[3].toLowerCase();
    const denominator = perUnitMatch[4].toLowerCase();
    if (denominator === "га") return { label: formatRange(first * area, second * area, unit), basis: "area", minQuantity: first * area, maxQuantity: second * area, unit };
    if (typeof seedTons !== "number" || !Number.isFinite(seedTons) || seedTons <= 0) return { label: "Укажите тоннаж семян", basis: "seed", minQuantity: null, maxQuantity: null, unit };
    return { label: formatRange(first * seedTons, second * seedTons, unit), basis: "seed", minQuantity: first * seedTons, maxQuantity: second * seedTons, unit };
  }

  const coverageMatch = normalizedRate.match(/(\d+(?:\.\d+)?)(?:\s*-\s*(\d+(?:\.\d+)?))?\s*га/i);
  if (coverageMatch) {
    const firstCoverage = Number(coverageMatch[1]);
    const secondCoverage = coverageMatch[2] ? Number(coverageMatch[2]) : firstCoverage;
    const minPackages = Math.ceil(area / Math.max(firstCoverage, secondCoverage));
    const maxPackages = Math.ceil(area / Math.min(firstCoverage, secondCoverage));
    return { label: formatRange(minPackages, maxPackages, "уп."), basis: "coverage", minQuantity: minPackages, maxQuantity: maxPackages, unit: "уп." };
  }

  return { label: "Проверьте норму вручную", basis: "unknown", minQuantity: null, maxQuantity: null, unit: null };
}

export type SchemePriceLine = {
  key: string;
  productName: string;
  excludedByManager: boolean;
  requirement: ProductRequirement;
  price: PriceRecord | null;
  catalogPricePerUnit: number | null;
  logistics: ProductLogistics | null;
  pricePerUnit: number | null;
  isManualPrice: boolean;
  minPurchaseQuantity: number | null;
  maxPurchaseQuantity: number | null;
  minPackages: number | null;
  maxPackages: number | null;
  minPallets: number | null;
  maxPallets: number | null;
  minTotal: number | null;
  maxTotal: number | null;
};

export type SchemePricing = {
  lines: SchemePriceLine[];
  minTotal: number;
  maxTotal: number;
  minPerHectare: number;
  maxPerHectare: number;
  grossMinTotal: number;
  grossMaxTotal: number;
  minDiscount: number;
  maxDiscount: number;
  discountPercent: number;
  minPallets: number;
  maxPallets: number;
  missingProducts: string[];
  excludedProducts: string[];
  managerExcludedProducts: string[];
  unconfirmedLogisticsProducts: string[];
  complete: boolean;
};

function roundForLogistics(requirement: ProductRequirement, logistics: ProductLogistics | null) {
  if (!logistics || requirement.minQuantity === null || requirement.maxQuantity === null) {
    return { minPurchaseQuantity: requirement.minQuantity, maxPurchaseQuantity: requirement.maxQuantity, minPackages: null, maxPackages: null, minPallets: null, maxPallets: null };
  }

  const compatibleUnit = requirement.unit === logistics.unit || (requirement.basis === "coverage" && logistics.unit === "компл.");
  if (!compatibleUnit) return { minPurchaseQuantity: requirement.minQuantity, maxPurchaseQuantity: requirement.maxQuantity, minPackages: null, maxPackages: null, minPallets: null, maxPallets: null };

  const minPackages = Math.ceil(requirement.minQuantity / logistics.packageSize);
  const maxPackages = Math.ceil(requirement.maxQuantity / logistics.packageSize);
  return {
    minPurchaseQuantity: minPackages * logistics.packageSize,
    maxPurchaseQuantity: maxPackages * logistics.packageSize,
    minPackages,
    maxPackages,
    minPallets: logistics.unitsPerPallet ? Math.ceil(minPackages / logistics.unitsPerPallet) : null,
    maxPallets: logistics.unitsPerPallet ? Math.ceil(maxPackages / logistics.unitsPerPallet) : null,
  };
}

export type ManualPriceOverrides = Record<string, number>;

export function calculateSchemePricing(
  scheme: CropProtectionScheme,
  area: number,
  paymentTerm: PaymentTerm,
  discountPercent = 0,
  excludedLineKeys: string[] = [],
  manualPriceOverrides: ManualPriceOverrides = {},
  seedTons?: number,
  priceRecords?: PriceRecord[],
): SchemePricing {
  const lines: SchemePriceLine[] = [];
  const missingProducts: string[] = [];
  const excludedProducts: string[] = [];
  const managerExcludedProducts: string[] = [];
  const unconfirmedLogisticsProducts: string[] = [];
  const safeDiscount = Math.max(0, Math.min(maxDiscountForPaymentTerm[paymentTerm], Number.isFinite(discountPercent) ? discountPercent : 0));
  let grossMinTotal = 0;
  let grossMaxTotal = 0;
  let minPallets = 0;
  let maxPallets = 0;

  scheme.steps.forEach((step, stageIndex) => {
    step.products.forEach((product, productIndex) => {
      const key = `${stageIndex}-${productIndex}`;
      const requirement = calculateProductRequirement(product.rate, area, seedTons);
      const price = findSpkUralPrice(product.name, priceRecords);
      const logistics = findSpkUralLogistics(product.name);
      const catalogPricePerUnit = price ? (price[paymentTerm] ?? (paymentTerm === "payment7030" ? price.payment3070 : null)) : null;
      const manualPrice = manualPriceOverrides[key];
      const isManualPrice = typeof manualPrice === "number" && Number.isFinite(manualPrice) && manualPrice >= 0;
      const pricePerUnit = isManualPrice ? manualPrice : catalogPricePerUnit;
      const rounded = roundForLogistics(requirement, logistics);
      const excluded = EXCLUDED_FROM_AUTO_PRICING.includes(product.name as typeof EXCLUDED_FROM_AUTO_PRICING[number]);
      const excludedByManager = excludedLineKeys.includes(key);
      const canPrice = Boolean(pricePerUnit !== null && rounded.minPurchaseQuantity !== null && rounded.maxPurchaseQuantity !== null);
      const line: SchemePriceLine = {
        key,
        productName: product.name,
        excludedByManager,
        requirement,
        price,
        catalogPricePerUnit,
        logistics,
        pricePerUnit,
        isManualPrice,
        ...rounded,
        minTotal: canPrice && !excludedByManager ? rounded.minPurchaseQuantity! * pricePerUnit! : null,
        maxTotal: canPrice && !excludedByManager ? rounded.maxPurchaseQuantity! * pricePerUnit! : null,
      };
      if (excludedByManager) managerExcludedProducts.push(product.name);
      else if (excluded && !isManualPrice) excludedProducts.push(product.name);
      else if (!canPrice) missingProducts.push(product.name);
      else {
        grossMinTotal += line.minTotal!;
        grossMaxTotal += line.maxTotal!;
        minPallets += line.minPallets ?? 0;
        maxPallets += line.maxPallets ?? 0;
        if (!logistics || !logistics.unitsPerPallet) unconfirmedLogisticsProducts.push(product.name);
      }
      lines.push(line);
    });
  });

  const minDiscount = grossMinTotal * safeDiscount / 100;
  const maxDiscount = grossMaxTotal * safeDiscount / 100;
  const minTotal = grossMinTotal - minDiscount;
  const maxTotal = grossMaxTotal - maxDiscount;

  return {
    lines,
    minTotal: Math.round(minTotal * 100) / 100,
    maxTotal: Math.round(maxTotal * 100) / 100,
    minPerHectare: area > 0 ? Math.round((minTotal / area) * 100) / 100 : 0,
    maxPerHectare: area > 0 ? Math.round((maxTotal / area) * 100) / 100 : 0,
    grossMinTotal: Math.round(grossMinTotal * 100) / 100,
    grossMaxTotal: Math.round(grossMaxTotal * 100) / 100,
    minDiscount: Math.round(minDiscount * 100) / 100,
    maxDiscount: Math.round(maxDiscount * 100) / 100,
    discountPercent: safeDiscount,
    minPallets,
    maxPallets,
    missingProducts,
    excludedProducts,
    managerExcludedProducts,
    unconfirmedLogisticsProducts,
    complete: area > 0 && missingProducts.length === 0,
  };
}
