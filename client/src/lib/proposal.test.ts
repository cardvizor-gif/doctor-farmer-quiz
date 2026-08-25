import { describe, expect, it } from "vitest";
import { buildAgroHelperContextQuery, buildProposalContextQuery, buildProposalTitle, calculateProductRequirement, calculateProposalTotal, getSchemeForProposal, parseProposalContext } from "./proposal";

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
});
