import { describe, expect, it } from "vitest";
import { isAllowedCorporateEmail } from "./domain";

describe("isAllowedCorporateEmail", () => {
  it("allows a regular doctorfarmer.ru mailbox", () => {
    expect(isAllowedCorporateEmail("employee@doctorfarmer.ru")).toBe(true);
  });

  it("handles surrounding whitespace and email casing", () => {
    expect(isAllowedCorporateEmail("  Employee@DoctorFarmer.RU ")).toBe(true);
  });

  it("rejects personal providers and lookalike domains", () => {
    expect(isAllowedCorporateEmail("employee@gmail.com")).toBe(false);
    expect(isAllowedCorporateEmail("employee@doctorfarmer.ru.example.com")).toBe(false);
    expect(isAllowedCorporateEmail("employee@sub.doctorfarmer.ru")).toBe(false);
  });

  it("rejects empty or missing email values", () => {
    expect(isAllowedCorporateEmail("")).toBe(false);
    expect(isAllowedCorporateEmail(null)).toBe(false);
    expect(isAllowedCorporateEmail(undefined)).toBe(false);
  });
});
