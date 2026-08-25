import { describe, expect, it } from "vitest";
import { farmInputSchema, proposalInputSchema } from "../shared/farm";

describe("farm and proposal input schemas", () => {
  it("sets safe defaults for a new farm card", () => {
    const result = farmInputSchema.parse({ name: "ООО АгроПоле" });

    expect(result.salesStage).toBe("lead");
    expect(result.totalArea).toBe(0);
    expect(result.potentialValue).toBe(0);
  });

  it("rejects an empty farm name and negative area", () => {
    expect(farmInputSchema.safeParse({ name: " ", totalArea: -1 }).success).toBe(false);
  });

  it("requires a valid farm and positive area for a proposal", () => {
    expect(proposalInputSchema.safeParse({ farmId: 0, title: "КП", crop: "Пшеница", area: 0, schemeJson: "{}" }).success).toBe(false);
    expect(proposalInputSchema.parse({ farmId: 4, title: "Схема защиты", crop: "Озимая пшеница", area: 120, schemeJson: "{}" }).status).toBe("draft");
  });
});
