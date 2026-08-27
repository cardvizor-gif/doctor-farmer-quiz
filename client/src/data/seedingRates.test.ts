import { describe, expect, it } from "vitest";
import { PROTECTION_SCHEMES } from "./protectionSchemes";
import { getSeedingRate } from "./seedingRates";

describe("seeding rate defaults", () => {
  it("defines a working seed rate for every scheme that contains a per-ton seed treatment", () => {
    const cropIdsWithSeedTreatment = PROTECTION_SCHEMES
      .filter((scheme) => scheme.steps.some((step) => step.products.some((product) => /(л|кг)\s*\/\s*т/i.test(product.rate))))
      .map((scheme) => scheme.cropId)
      .sort();

    expect(cropIdsWithSeedTreatment).toEqual(["barley", "flax_classic", "oats", "peas", "wheat_spring", "wheat_winter"]);
    expect(cropIdsWithSeedTreatment.every((cropId) => getSeedingRate(cropId)?.tonsPerHectare)).toBe(true);
  });
});
