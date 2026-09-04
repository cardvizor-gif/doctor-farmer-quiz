import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  recordUserActivity: vi.fn(),
  getUserActivity: vi.fn(),
}));

import * as db from "./db";
import { appRouter } from "./routers";
import { ENV } from "./_core/env";

const baseUser = {
  id: 8,
  openId: "staff_open_id",
  name: "Сотрудник",
  displayName: "Сотрудник",
  position: "Агроном",
  email: "staff@example.com",
  loginMethod: "invite",
  role: "user" as const,
  isSuperuser: 0,
  status: "active" as const,
  archivedAt: null,
  archivedByOpenId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
  lastActivityAt: null,
  activeSeconds: 0,
};

function context(user: typeof baseUser | null): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("employee activity", () => {
  beforeEach(() => vi.clearAllMocks());

  it("records a heartbeat for an authenticated employee", async () => {
    vi.mocked(db.recordUserActivity).mockResolvedValue({ lastActivityAt: new Date(), creditedSeconds: 60 });
    const caller = appRouter.createCaller(context(baseUser));

    await expect(caller.activity.ping()).resolves.toMatchObject({ creditedSeconds: 60 });
    expect(db.recordUserActivity).toHaveBeenCalledWith(baseUser.openId);
  });

  it("allows only the superuser to inspect employee activity", async () => {
    vi.mocked(db.getUserActivity).mockResolvedValue({ lastSignedIn: new Date(), lastActivityAt: new Date(), activeSeconds: 120 });
    const employee = appRouter.createCaller(context(baseUser));
    const owner = appRouter.createCaller(context({ ...baseUser, openId: ENV.ownerOpenId, role: "admin", isSuperuser: 1 }));

    await expect(employee.activity.forUser({ openId: baseUser.openId })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(owner.activity.forUser({ openId: baseUser.openId })).resolves.toMatchObject({ activeSeconds: 120 });
    expect(db.getUserActivity).toHaveBeenCalledWith(baseUser.openId);
  });
});
