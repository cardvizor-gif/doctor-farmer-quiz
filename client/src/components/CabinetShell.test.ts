import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  accountIdentity,
  cabinetPageTitle,
  cabinetTheme,
  filterCabinetNavigation,
  filterMobileUtilityNavigation,
  isMobileSwipeLeft,
  isOutsideAccountMenu,
  mobileNavigation,
  mobileTopbarActions,
} from "./CabinetShell";

describe("accountIdentity", () => {
  it("uses the authenticated name and email in the account menu", () => {
    expect(
      accountIdentity({ name: "Шамиль Ахметов", email: "shamil@example.com" })
    ).toEqual({
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
    expect(
      accountIdentity({
        name: "Shafran",
        displayName: "Шамиль Вильданов",
        email: "shamil@example.com",
      })
    ).toMatchObject({
      name: "Шамиль Вильданов",
      initials: "ШВ",
    });
  });

  it("uses dedicated page titles for internal sections", () => {
    expect(cabinetPageTitle("/support")).toBe("Обращения");
    expect(cabinetPageTitle("/admin")).toBe("Команда");
    expect(cabinetPageTitle("/news")).toBe("Новости");
  });

  it("shows only assigned workspace sections to a regular employee", () => {
    expect(
      filterCabinetNavigation({
        role: "user",
        permissions: ["farms.read", "quiz.use"],
      }).map(item => item.href)
    ).toEqual(["/", "/farms", "/quiz"]);
  });

  it("shows all workspace sections only to the superuser", () => {
    expect(
      filterCabinetNavigation({
        role: "admin",
        isSuperuser: true,
        permissions: [],
      }).map(item => item.href)
    ).toEqual([
      "/",
      "/agro-helper",
      "/farms",
      "/proposals/new",
      "/order-requests",
      "/sales",
      "/catalog",
      "/quiz",
    ]);
  });

  it("keeps the knowledge base outside the graphite theme scope", () => {
    expect(cabinetTheme("/knowledge-base")).toBe("knowledge");
    expect(cabinetTheme("/admin")).toBe("overview");
    expect(cabinetTheme("/farms")).toBe("farms");
  });

  it("shows administrative links in the mobile menu only by permission", () => {
    expect(
      filterMobileUtilityNavigation({
        role: "admin",
        isSuperuser: true,
        permissions: [],
      }).map(item => item.href)
    ).toEqual(["/admin", "/access-requests", "/support"]);
    expect(
      filterMobileUtilityNavigation({
        role: "user",
        permissions: ["support.create"],
      }).map(item => item.href)
    ).toEqual(["/support"]);
    expect(
      filterMobileUtilityNavigation({ role: "user", permissions: [] })
    ).toEqual([]);
  });

  it("keeps five focused destinations in the mobile bottom navigation", () => {
    expect(mobileNavigation.map(item => [item.href, item.label])).toEqual([
      ["/", "Главная"],
      ["/agro-helper", "Схемы"],
      ["/farms", "Хозяйства"],
      ["/proposals/new", "КП"],
      ["/sales", "Продажи"],
    ]);
  });

  it("keeps only four priority actions in the mobile topbar", () => {
    expect(mobileTopbarActions).toEqual([
      "access-requests",
      "support",
      "notifications",
      "account",
    ]);
    expect(mobileTopbarActions).not.toContain("team");
    expect(mobileTopbarActions).toHaveLength(4);
  });

  it("закрывает мобильное меню горизонтальным свайпом влево", () => {
    expect(isMobileSwipeLeft({ x: 180, y: 220 }, { x: 110, y: 228 })).toBe(
      true
    );
    expect(isMobileSwipeLeft({ x: 180, y: 220 }, { x: 150, y: 300 })).toBe(
      false
    );
    expect(isMobileSwipeLeft({ x: 180, y: 220 }, { x: 225, y: 220 })).toBe(
      false
    );
  });

  it("защищает overlay-контракт закрытия мобильного меню", () => {
    const source = readFileSync(
      new URL("./CabinetShell.tsx", import.meta.url),
      "utf8"
    );
    const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
    expect(source).toContain('className="cabinet-mobile-menu-backdrop"');
    expect(source).toContain("onTouchStart={handleTouchStart}");
    expect(source).toContain("onTouchEnd={handleTouchEnd}");
    expect(css).toContain(".cabinet-mobile-menu-backdrop");
    expect(css).toContain("z-index: 300;");
  });

  it("closes the account menu only for a pointer target outside its root", () => {
    const inside = { id: "inside" } as unknown as EventTarget;
    const outside = { id: "outside" } as unknown as EventTarget;
    const root = { contains: (target: object) => target === inside };

    expect(isOutsideAccountMenu(inside, root)).toBe(false);
    expect(isOutsideAccountMenu(outside, root)).toBe(true);
    expect(isOutsideAccountMenu(null, root)).toBe(false);
  });
});
