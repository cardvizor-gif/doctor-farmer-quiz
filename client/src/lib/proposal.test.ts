import { describe, expect, it } from "vitest";
import { buildAgroHelperContextQuery, buildProposalContextQuery, buildProposalTitle, calculateProductRequirement, calculateProposalTotal, calculateSchemePricing, getSchemeForProposal, parseProposalContext } from "./proposal";

describe("proposal helpers", () => {
  it("calculates the total only from positive values", () => {
    expect(calculateProposalTotal(125, 4850)).toBe(606250);
    expect(calculateProposalTotal(-125, 4850)).toBe(0);
  });

  it("selects an exact scheme and builds a readable proposal title", () => {
    const schemes = [{ cropId: "wheat", technology: "Классическая", title: "Схема защиты пшеницы", description: "", steps: [] }];
    const scheme = getSchemeForProposal(schemes, "wheat", "Классическая");

    expect(scheme?.title).toBe("Схема защиты пшеницы");
    expect(buildProposalTitle(scheme!, "ООО АгроПоле")).toContain("ООО АгроПоле");
  });

  it("calculates products for hectare, seed and package-cover norms", () => {
    expect(calculateProductRequirement("0,4-0,5 л/га", 100).label).toBe("40–50 л");
    expect(calculateProductRequirement("0,4-0,5 л/т", 100, "Протравливание — 0,22 т/га").label).toBe("8,8–11 л");
    expect(calculateProductRequirement("10-12 га", 100).label).toBe("9–10 уп.");
  });

  it("preserves a farm, scheme and area in the cross-module context", () => {
    const proposalContext = parseProposalContext(`?${buildProposalContextQuery({ farmId: 7, cropId: "wheat_winter", technology: "Классическая", area: 125 })}`);

    expect(proposalContext).toEqual({ farmId: 7, cropId: "wheat_winter", technology: "Классическая", area: 125 });
    expect(buildAgroHelperContextQuery({ farmId: 7, area: 125 })).toBe("farmId=7&area=125");
  });

  it("calculates a confirmed price from the SPK Ural payment condition", () => {
    const scheme = { cropId: "wheat", technology: "Классическая", title: "Тест", description: "", steps: [{ stage: "Кущение", task: "Тест", products: [{ name: "КлопЭфир Интенсив", rate: "14 га", dv: "", group: "Гербицид" }] }] };
    const pricing = calculateSchemePricing(scheme, 100, "deferred");

    expect(pricing.complete).toBe(true);
    expect(pricing.minTotal).toBe(33600);
    expect(pricing.maxPerHectare).toBe(336);
  });

  it("marks Agronika as temporarily excluded without blocking the confirmed part of a calculation", () => {
    const scheme = { cropId: "test", technology: "Классическая", title: "Тест", description: "", steps: [{ stage: "Тест", task: "Тест", products: [{ name: "Агроника, КС", rate: "0,4 л/га", dv: "", group: "Фунгицид" }] }] };

    const pricing = calculateSchemePricing(scheme, 100, "deferred");
    expect(pricing.complete).toBe(true);
    expect(pricing.excludedProducts).toEqual(["Агроника, КС"]);
  });

  it("rounds a confirmed product to packaging and applies a capped commercial discount", () => {
    const scheme = { cropId: "test", technology: "Классическая", title: "Тест", description: "", steps: [{ stage: "Тест", task: "Тест", products: [{ name: "Контур Антистресс, ВР", rate: "0,2 л/га", dv: "", group: "Удобрение" }] }] };
    const pricing = calculateSchemePricing(scheme, 380, "deferred", 3);

    expect(pricing.lines[0]?.minPackages).toBe(8);
    expect(pricing.lines[0]?.minPurchaseQuantity).toBe(80);
    expect(pricing.maxPallets).toBe(1);
    expect(pricing.grossMaxTotal).toBe(62400);
    expect(pricing.maxDiscount).toBe(1872);
    expect(pricing.maxTotal).toBe(60528);
  });

  it("removes a manager-excluded position from the commercial total while retaining it in the scheme", () => {
    const scheme = { cropId: "test", technology: "Классическая", title: "Тест", description: "", steps: [{ stage: "Тест", task: "Тест", products: [{ name: "Контур Антистресс, ВР", rate: "0,2 л/га", dv: "", group: "Удобрение" }, { name: "Неон-99", rate: "0,2 л/га", dv: "", group: "ПАВ" }] }] };
    const pricing = calculateSchemePricing(scheme, 100, "deferred", 0, ["0-0"]);

    expect(pricing.managerExcludedProducts).toEqual(["Контур Антистресс, ВР"]);
    expect(pricing.lines[0]?.excludedByManager).toBe(true);
    expect(pricing.lines[0]?.maxTotal).toBeNull();
    expect(pricing.maxTotal).toBe(7600);
  });
});
