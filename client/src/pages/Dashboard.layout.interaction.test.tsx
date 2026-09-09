// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const overviewMock = {
  userName: "Шамиль Вильданов",
  roleLabel: "Менеджер по продажам",
  scopeLabel: "Республика Башкортостан",
  isLeadership: false,
  summary: { today: 3, overdue: 1, farms: 12, proposals: 2 },
  sales: {
    isConfigured: false,
    percent: null,
    fact: null,
    planTarget: null,
    planScopeLabel: "Личный план",
  },
  tasks: [],
  attention: {
    attentionFarms: [],
    openProposals: 0,
    openOrders: 0,
  },
  notifications: [],
};

vi.mock("@/lib/trpc", () => ({
  trpc: {
    dashboard: {
      overview: {
        useQuery: () => ({ data: overviewMock, isLoading: false, error: null }),
      },
    },
  },
}));

vi.mock("@/components/SupportModal", () => ({
  SupportModal: () => null,
}));

vi.mock("wouter", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe("approved dashboard reference layout", () => {
  beforeEach(() => vi.resetModules());

  it("renders the final reference regions in their actual Dashboard markup", async () => {
    const { default: Dashboard } = await import("./Dashboard");
    render(<Dashboard />);

    const heroRow = screen.getByTestId("dashboard-reference-hero-row");
    expect(heroRow.getAttribute("data-dashboard-region")).toBe("full-width");
    expect(heroRow.querySelector(".dashboard-workday-hero")).toBeTruthy();
    expect(heroRow.querySelector(".dashboard-sales-plan-inline")).toBeTruthy();

    expect(screen.getByTestId("dashboard-workday-main-grid")).toBeTruthy();
    expect(screen.getByTestId("dashboard-workday-right-rail")).toBeTruthy();
    expect(screen.getByText("План не задан")).toBeTruthy();
    expect(screen.queryByLabelText("Сводка рабочего дня")).toBeNull();
  });
});
