import type { CropProtectionScheme } from "@/data/protectionSchemes";

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
};

const formatNumber = (value: number) => new Intl.NumberFormat("ru-RU", { maximumFractionDigits: value < 10 ? 2 : 1 }).format(value);

const formatRange = (min: number, max: number, unit: string) => min === max
  ? `${formatNumber(min)} ${unit}`
  : `${formatNumber(min)}–${formatNumber(max)} ${unit}`;

function getSeedTonsPerHectare(stage: string) {
  const tonMatch = stage.match(/(\d+(?:[,.]\d+)?)\s*т\s*\/\s*га/i);
  if (tonMatch) return Number(tonMatch[1].replace(",", "."));
  const kiloMatch = stage.match(/(\d+(?:[,.]\d+)?)\s*кг\s*\/\s*га/i);
  return kiloMatch ? Number(kiloMatch[1].replace(",", ".")) / 1000 : null;
}

export function calculateProductRequirement(rate: string, area: number, stage = ""): ProductRequirement {
  if (!Number.isFinite(area) || area <= 0) return { label: "Укажите площадь", basis: "unknown" };
  const normalizedRate = rate.replace(/,/g, ".").replace(/–/g, "-").trim();
  const perUnitMatch = normalizedRate.match(/(\d+(?:\.\d+)?)(?:\s*-\s*(\d+(?:\.\d+)?))?\s*(л|кг)\s*\/\s*(га|т)/i);

  if (perUnitMatch) {
    const first = Number(perUnitMatch[1]);
    const second = perUnitMatch[2] ? Number(perUnitMatch[2]) : first;
    const unit = perUnitMatch[3].toLowerCase();
    const denominator = perUnitMatch[4].toLowerCase();
    if (denominator === "га") return { label: formatRange(first * area, second * area, unit), basis: "area" };
    const seedTonsPerHectare = getSeedTonsPerHectare(stage);
    if (!seedTonsPerHectare) return { label: "Требуется норма высева, т/га", basis: "seed" };
    const seedTons = seedTonsPerHectare * area;
    return { label: formatRange(first * seedTons, second * seedTons, unit), basis: "seed" };
  }

  const coverageMatch = normalizedRate.match(/(\d+(?:\.\d+)?)(?:\s*-\s*(\d+(?:\.\d+)?))?\s*га/i);
  if (coverageMatch) {
    const firstCoverage = Number(coverageMatch[1]);
    const secondCoverage = coverageMatch[2] ? Number(coverageMatch[2]) : firstCoverage;
    const minPackages = Math.ceil(area / Math.max(firstCoverage, secondCoverage));
    const maxPackages = Math.ceil(area / Math.min(firstCoverage, secondCoverage));
    return { label: formatRange(minPackages, maxPackages, "уп."), basis: "coverage" };
  }

  return { label: "Проверьте норму вручную", basis: "unknown" };
}
