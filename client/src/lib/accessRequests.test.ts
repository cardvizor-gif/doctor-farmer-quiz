import { describe, expect, it } from "vitest";
import { countPendingAccessRequests } from "./accessRequests";

describe("countPendingAccessRequests", () => {
  it("counts only access requests awaiting the administrator decision", () => {
    expect(countPendingAccessRequests([
      { status: "pending" },
      { status: "activated" },
      { status: "pending" },
      { status: "rejected" },
    ])).toBe(2);
  });

  it("returns zero when requests have not loaded or none are pending", () => {
    expect(countPendingAccessRequests(undefined)).toBe(0);
    expect(countPendingAccessRequests([{ status: "approved" }])).toBe(0);
  });
});
