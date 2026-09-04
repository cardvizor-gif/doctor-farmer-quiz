import { describe, expect, it } from "vitest";
import { creditedActiveSeconds } from "./activity";

describe("creditedActiveSeconds", () => {
  const now = new Date("2026-09-04T10:00:00.000Z");

  it("does not backfill time before the first heartbeat", () => {
    expect(creditedActiveSeconds(null, now)).toBe(0);
  });

  it("credits a visible activity interval between 15 and 90 seconds", () => {
    expect(creditedActiveSeconds(new Date(now.getTime() - 60_000), now)).toBe(60);
    expect(creditedActiveSeconds(new Date(now.getTime() - 15_000), now)).toBe(15);
    expect(creditedActiveSeconds(new Date(now.getTime() - 90_000), now)).toBe(90);
  });

  it("does not credit short or stale intervals", () => {
    expect(creditedActiveSeconds(new Date(now.getTime() - 14_000), now)).toBe(0);
    expect(creditedActiveSeconds(new Date(now.getTime() - 91_000), now)).toBe(0);
  });
});
