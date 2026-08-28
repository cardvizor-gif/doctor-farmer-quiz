import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  getUserPermissions: vi.fn(),
  listFarms: vi.fn(),
  updateUserAccess: vi.fn(),
  transferAndArchiveUser: vi.fn(),
}));

import * as db from "./db";
import { appRouter } from "./routers";

const baseUser = {
  id: 3,
  openId: "employee-1",
  name: "Сотрудник",
  displayName: "Сотрудник",
  email: "employee@example.com",
  loginMethod: "invite",
  role: "user" as const,
  status: "active" as const,
  archivedAt: null,
  archivedByOpenId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

function context(user: typeof baseUser | null): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  } as TrpcContext;
}

describe("user permissions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("denies a user without the required permission and allows an explicitly granted permission", async () => {
    vi.mocked(db.getUserPermissions).mockResolvedValue([]);
    const caller = appRouter.createCaller(context(baseUser));
    await expect(caller.farms.list()).rejects.toMatchObject({ code: "FORBIDDEN" });

    vi.mocked(db.getUserPermissions).mockResolvedValue(["farms.read"]);
    vi.mocked(db.listFarms).mockResolvedValue([]);
    await expect(caller.farms.list()).resolves.toEqual([]);
    expect(db.listFarms).toHaveBeenCalledWith(baseUser.openId);
  });

  it("allows administrators to set a role and a bounded permission list", async () => {
    const admin = { ...baseUser, openId: "owner", role: "admin" as const };
    vi.mocked(db.updateUserAccess).mockResolvedValue({ ...baseUser, permissions: ["farms.read"] } as never);
    const caller = appRouter.createCaller(context(admin));
    await expect(caller.admin.updateAccess({ openId: baseUser.openId, role: "user", permissions: ["farms.read"] })).resolves.toMatchObject({ openId: baseUser.openId });
    expect(db.updateUserAccess).toHaveBeenCalledWith(baseUser.openId, "user", ["farms.read"], "owner");
  });

  it("allows an administrator to transfer a base and archive an employee", async () => {
    const admin = { ...baseUser, openId: "owner", role: "admin" as const };
    vi.mocked(db.transferAndArchiveUser).mockResolvedValue({ sourceOpenId: baseUser.openId, targetOpenId: "employee-2", archivedAt: new Date() });
    const caller = appRouter.createCaller(context(admin));
    await expect(caller.admin.transferAndArchive({ sourceOpenId: baseUser.openId, targetOpenId: "employee-2" })).resolves.toMatchObject({ targetOpenId: "employee-2" });
    expect(db.transferAndArchiveUser).toHaveBeenCalledWith(baseUser.openId, "employee-2", "owner");
  });

  it("does not allow a regular user to change roles or transfer a base", async () => {
    const caller = appRouter.createCaller(context(baseUser));
    await expect(caller.admin.updateAccess({ openId: "another-user", role: "admin", permissions: [] })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.transferAndArchive({ sourceOpenId: baseUser.openId, targetOpenId: "employee-2" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.updateUserAccess).not.toHaveBeenCalled();
    expect(db.transferAndArchiveUser).not.toHaveBeenCalled();
  });
});
