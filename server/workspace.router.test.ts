import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  getUserPermissions: vi.fn(),
  createWorkspace: vi.fn(),
  upsertWorkspaceMember: vi.fn(),
  listWorkspacesForUser: vi.fn(),
}));

import * as db from "./db";
import { ENV } from "./_core/env";
import { appRouter } from "./routers";

const owner = {
  id: 1,
  openId: ENV.ownerOpenId,
  name: "Шамиль Вильданов",
  displayName: "Шамиль Вильданов",
  email: "owner@example.com",
  loginMethod: "invite",
  role: "admin" as const,
  isSuperuser: 1,
};

function context(user = owner): TrpcContext {
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] } as TrpcContext;
}

describe("regional workspace membership boundaries", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates an RC without auto-assigning any employee", async () => {
    const createdWorkspace = { id: 30002, name: "РЦ Оренбург", regionId: 2, createdByOpenId: owner.openId, isActive: 1, createdAt: new Date(), updatedAt: new Date() };
    vi.mocked(db.createWorkspace).mockResolvedValue(createdWorkspace as never);

    const caller = appRouter.createCaller(context());
    await expect(caller.workspace.create({ name: "РЦ Оренбург", regionId: 2 })).resolves.toEqual(createdWorkspace);

    expect(db.createWorkspace).toHaveBeenCalledWith("РЦ Оренбург", 2, owner.openId);
    expect(db.upsertWorkspaceMember).not.toHaveBeenCalled();
  });

  it("loads a user's RCs only through explicit workspace membership", async () => {
    vi.mocked(db.getUserPermissions).mockResolvedValue(["sales.read"]);
    vi.mocked(db.listWorkspacesForUser).mockResolvedValue([]);

    const colleague = { ...owner, openId: "unassigned-colleague", role: "user" as const, isSuperuser: 0 };
    const caller = appRouter.createCaller(context(colleague));
    await expect(caller.workspace.mine()).resolves.toEqual([]);

    expect(db.listWorkspacesForUser).toHaveBeenCalledWith(colleague.openId);
  });
});
