import { describe, expect, it } from "vitest";
import { categoriesForStep, productsForCategory } from "./schemeProductCatalog";

describe("scheme product catalog", () => {
  it("selects the relevant treatment categories from a scheme step", () => {
    expect(categoriesForStep("Протравливание семян", "Фунгицид, инсектицид")).toEqual(["seedTreatment", "fungicide", "insecticide"]);
    expect(categoriesForStep("1 обработка", "Гербицидная защита")).toEqual(["herbicide"]);
  });

  it("exposes real catalog products for each selectable category", () => {
    expect(productsForCategory("fungicide").some((product) => product.name === "ПроТэб, КМЭ")).toBe(true);
    expect(productsForCategory("insecticide").some((product) => product.name === "Тайсон, КС")).toBe(true);
    expect(productsForCategory("herbicide").some((product) => product.name === "Клегал, МКЭ")).toBe(true);
    expect(productsForCategory("herbicide").some((product) => product.name === "Сотейра, ВРК")).toBe(true);
  });
});
