import { describe, expect, it, vi, beforeEach } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({ getDashboardOverview: vi.fn() }));

import * as db from "./db";
import { ENV } from "./_core/env";
import { appRouter } from "./routers";

const manager = { id: 1, openId: "manager-1", name: "Менеджер", displayName: "Менеджер", email: "manager@example.com", loginMethod: "invite", role: "user" as const, isSuperuser: 0, status: "active" as const };

function context(user: typeof manager): TrpcContext {
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] } as TrpcContext;
}

describe("role-aware dashboard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns a manager workday through the protected dashboard route", async () => {
    vi.mocked(db.getDashboardOverview).mockResolvedValue({ role: "manager", roleLabel: "Менеджер", isLeadership: false, scopeLabel: "Личное рабочее пространство", workspaces: [], summary: { today: 2, overdue: 0, farms: 4, proposals: 1, orders: 0, team: 1 }, tasks: [], attention: { overdueTasks: 0, attentionFarms: [], openProposals: 1, openOrders: 0 }, notifications: [] } as never);

    const result = await appRouter.createCaller(context(manager)).dashboard.overview();

    expect(result.role).toBe("manager");
    expect(result.summary.farms).toBe(4);
    expect(db.getDashboardOverview).toHaveBeenCalledWith({ openId: manager.openId, role: "user", isSuperuser: 0, name: manager.name });
  });

  it("passes the ROP identity to the server scope resolver", async () => {
    const rop = { ...manager, openId: "rop-1", displayName: "РОП" };
    vi.mocked(db.getDashboardOverview).mockResolvedValue({ role: "rop", roleLabel: "РОП", isLeadership: true, scopeLabel: "РЦ Башкортостан", workspaces: [], summary: { today: 5, overdue: 1, farms: 8, proposals: 3, orders: 2, team: 4 }, tasks: [], attention: { overdueTasks: 1, attentionFarms: [], openProposals: 3, openOrders: 2 }, notifications: [] } as never);

    const result = await appRouter.createCaller(context(rop)).dashboard.overview();

    expect(result.roleLabel).toBe("РОП");
    expect(db.getDashboardOverview).toHaveBeenCalledWith({ openId: rop.openId, role: "user", isSuperuser: 0, name: rop.displayName });
  });

  it("passes the immutable superuser marker to the company scope resolver", async () => {
    const owner = { ...manager, openId: ENV.ownerOpenId, role: "admin" as const, isSuperuser: 1 };
    vi.mocked(db.getDashboardOverview).mockResolvedValue({ role: "ceo", roleLabel: "Суперпользователь", isLeadership: true, scopeLabel: "Вся компания", workspaces: [], summary: { today: 8, overdue: 2, farms: 20, proposals: 6, orders: 4, team: 12 }, tasks: [], attention: { overdueTasks: 2, attentionFarms: [], openProposals: 6, openOrders: 4 }, notifications: [] } as never);

    const result = await appRouter.createCaller(context(owner));

    expect((await result.dashboard.overview()).scopeLabel).toBe("Вся компания");
    expect(db.getDashboardOverview).toHaveBeenCalledWith({ openId: ENV.ownerOpenId, role: "admin", isSuperuser: 1, name: owner.displayName });
  });
});
