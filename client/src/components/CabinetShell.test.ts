import { describe, expect, it } from "vitest";
import { accountIdentity, cabinetPageTitle, cabinetTheme, filterCabinetNavigation, mobileNavigation } from "./CabinetShell";

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

  it("shows only assigned workspace sections to a regular employee", () => {
    expect(filterCabinetNavigation({ role: "user", permissions: ["farms.read", "quiz.use"] }).map((item) => item.href)).toEqual(["/", "/farms", "/quiz"]);
  });

  it("shows all workspace sections only to the superuser", () => {
    expect(filterCabinetNavigation({ role: "admin", isSuperuser: true, permissions: [] }).map((item) => item.href)).toEqual([
      "/", "/agro-helper", "/farms", "/proposals/new", "/order-requests", "/sales", "/quiz",
    ]);
  });

  it("keeps the knowledge base outside the graphite theme scope", () => {
    expect(cabinetTheme("/knowledge-base")).toBe("knowledge");
    expect(cabinetTheme("/admin")).toBe("overview");
    expect(cabinetTheme("/farms")).toBe("farms");
  });

  it("keeps five focused destinations in the mobile bottom navigation", () => {
    expect(mobileNavigation.map((item) => [item.href, item.label])).toEqual([
      ["/", "Главная"],
      ["/agro-helper", "Схемы"],
      ["/farms", "Хозяйства"],
      ["/proposals/new", "КП"],
      ["/sales", "Продажи"],
    ]);
  });
});
