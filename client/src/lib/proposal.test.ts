import { describe, expect, it } from "vitest";
import { addProductToScheme, buildAgroHelperContextQuery, buildProposalContextQuery, buildProposalTitle, calculateProductRequirement, calculateProposalTotal, calculateSchemePricing, getSchemeForProposal, parseProposalContext } from "./proposal";

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

  it("calculates a confirmed price from the selected payment condition", () => {
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

  it("adds a manager-selected product to a scheme and recalculates the commercial total", () => {
    const scheme = { cropId: "test", technology: "Классическая", title: "Тест", description: "", steps: [{ stage: "Гербицидная обработка", task: "Гербицидная защита", products: [{ name: "Тифи, ВДГ", rate: "0,012 кг/га", dv: "", group: "Гербицид" }] }] };
    const edited = addProductToScheme(scheme, 0, { name: "Клегал, МКЭ", rate: "0,6 л/га", dv: "", group: "Гербицид" });
    const baseline = calculateSchemePricing(scheme, 100, "deferred");
    const recalculated = calculateSchemePricing(edited, 100, "deferred");

    expect(edited.steps[0]?.products).toHaveLength(2);
    expect(edited.steps[0]?.products[1]?.note).toBe("Добавлено менеджером");
    expect(recalculated.maxTotal).toBeGreaterThan(baseline.maxTotal);
    expect(JSON.parse(JSON.stringify(edited)).steps[0].products[1].name).toBe("Клегал, МКЭ");
  });

  it("adds products from seed-treatment, herbicide, fungicide and insecticide categories into one working scheme", () => {
    const scheme = {
      cropId: "test",
      technology: "Классическая",
      title: "Тест",
      description: "",
      steps: [
        { stage: "Протравливание семян — 0,2 т/га", task: "Протравливание", products: [] },
        { stage: "Гербицидная обработка", task: "Гербицидная защита", products: [] },
        { stage: "Фунгицидная обработка", task: "Фунгицидная защита", products: [] },
        { stage: "Инсектицидная обработка", task: "Инсектицидная защита", products: [] },
      ],
    };
    const edits = [
      { stepIndex: 0, product: { name: "Меклонил, МЭ", rate: "1,5 л/т", dv: "", group: "Протравитель" } },
      { stepIndex: 1, product: { name: "Клегал, МКЭ", rate: "0,6 л/га", dv: "", group: "Гербицид (злак)" } },
      { stepIndex: 2, product: { name: "ПроТэб, КМЭ", rate: "0,4 л/га", dv: "", group: "Фунгицид" } },
      { stepIndex: 3, product: { name: "Тайсон, КС", rate: "0,3 л/га", dv: "", group: "Инсектицид" } },
    ];
    const edited = edits.reduce((current, edit) => addProductToScheme(current, edit.stepIndex, edit.product), scheme);
    const pricing = calculateSchemePricing(edited, 100, "deferred");

    expect(edited.steps.map((step) => step.products[0]?.name)).toEqual(["Меклонил, МЭ", "Клегал, МКЭ", "ПроТэб, КМЭ", "Тайсон, КС"]);
    expect(pricing.complete).toBe(true);
    expect(pricing.lines).toHaveLength(4);
    expect(pricing.maxTotal).toBeGreaterThan(0);
  });

  it("uses the confirmed five-litre Tyson packaging without inventing pallet loading", () => {
    const scheme = { cropId: "test", technology: "Классическая", title: "Тест", description: "", steps: [{ stage: "Инсектицидная обработка", task: "Инсектицидная защита", products: [{ name: "Тайсон, КС", rate: "0,3 л/га", dv: "", group: "Инсектицид" }] }] };
    const pricing = calculateSchemePricing(scheme, 100, "deferred");

    expect(pricing.lines[0]?.maxPackages).toBe(6);
    expect(pricing.lines[0]?.maxPallets).toBeNull();
    expect(pricing.unconfirmedLogisticsProducts).toEqual(["Тайсон, КС"]);
  });
});
