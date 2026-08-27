import { describe, expect, it } from "vitest";
import { accountIdentity, cabinetPageTitle } from "./CabinetShell";

describe("accountIdentity", () => {
  it("uses the authenticated name and email in the account menu", () => {
    expect(accountIdentity({ name: "Шамиль Ахметов", email: "shamil@example.com" })).toEqual({
      name: "Шамиль Ахметов",
      email: "shamil@example.com",
      initials: "ША",
    });
  });

  it("falls back to the email local part when an account has no display name", () => {
    expect(accountIdentity({ email: "manager@example.com" })).toEqual({
      name: "manager",
      email: "manager@example.com",
      initials: "M",
    });
  });

  it("prefers the user-controlled display name over the OAuth account label", () => {
    expect(accountIdentity({ name: "Shafran", displayName: "Шамиль Вильданов", email: "shamil@example.com" })).toMatchObject({
      name: "Шамиль Вильданов",
      initials: "ШВ",
    });
  });

  it("uses a dedicated page title for the internal support ticket list", () => {
    expect(cabinetPageTitle("/support")).toBe("Обращения");
  });
});
