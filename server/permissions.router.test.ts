import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  getUserPermissions: vi.fn(),
  getUserByOpenId: vi.fn(),
  listFarms: vi.fn(),
  updateUserAccess: vi.fn(),
  transferUserData: vi.fn(),
  archiveUser: vi.fn(),
  restoreArchivedUser: vi.fn(),
  deleteUserAccount: vi.fn(),
}));

import * as db from "./db";
import { ENV } from "./_core/env";
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
    const admin = { ...baseUser, openId: ENV.ownerOpenId, role: "admin" as const };
    vi.mocked(db.updateUserAccess).mockResolvedValue({ ...baseUser, permissions: ["farms.read"] } as never);
    const caller = appRouter.createCaller(context(admin));
    await expect(caller.admin.updateAccess({ openId: baseUser.openId, role: "user", permissions: ["farms.read"] })).resolves.toMatchObject({ openId: baseUser.openId });
    expect(db.updateUserAccess).toHaveBeenCalledWith(baseUser.openId, "user", ["farms.read"], ENV.ownerOpenId);
  });

  it("transfers a base without archiving the employee", async () => {
    const admin = { ...baseUser, openId: ENV.ownerOpenId, role: "admin" as const };
    vi.mocked(db.transferUserData).mockResolvedValue({ sourceOpenId: baseUser.openId, targetOpenId: "employee-2", transferredByOpenId: ENV.ownerOpenId, transferredAt: new Date() });
    const caller = appRouter.createCaller(context(admin));
    await expect(caller.admin.transferData({ sourceOpenId: baseUser.openId, targetOpenId: "employee-2" })).resolves.toMatchObject({ targetOpenId: "employee-2" });
    expect(db.transferUserData).toHaveBeenCalledWith(baseUser.openId, "employee-2", ENV.ownerOpenId);
    expect(db.archiveUser).not.toHaveBeenCalled();
  });

  it("keeps archiving as a separate superuser-only action", async () => {
    const admin = { ...baseUser, openId: ENV.ownerOpenId, role: "admin" as const, isSuperuser: 1 };
    vi.mocked(db.archiveUser).mockResolvedValue({ openId: baseUser.openId, archivedByOpenId: ENV.ownerOpenId, archivedAt: new Date() });
    const caller = appRouter.createCaller(context(admin));
    await expect(caller.admin.archiveUser({ openId: baseUser.openId })).resolves.toMatchObject({ openId: baseUser.openId });
    expect(db.archiveUser).toHaveBeenCalledWith(baseUser.openId, ENV.ownerOpenId);
  });

  it("allows only the superuser to restore and delete employee accounts", async () => {
    const admin = { ...baseUser, openId: ENV.ownerOpenId, role: "admin" as const, isSuperuser: 1 };
    vi.mocked(db.restoreArchivedUser).mockResolvedValue({ user: { ...baseUser, status: "active" }, restoredByOpenId: ENV.ownerOpenId } as never);
    vi.mocked(db.deleteUserAccount).mockResolvedValue({ openId: baseUser.openId, deleted: true });
    const caller = appRouter.createCaller(context(admin));
    await expect(caller.admin.restoreUser({ openId: baseUser.openId })).resolves.toMatchObject({ restoredByOpenId: ENV.ownerOpenId });
    await expect(caller.admin.deleteUser({ openId: baseUser.openId })).resolves.toMatchObject({ deleted: true });
    expect(db.restoreArchivedUser).toHaveBeenCalledWith(baseUser.openId, ENV.ownerOpenId);
    expect(db.deleteUserAccount).toHaveBeenCalledWith(baseUser.openId);

    const delegatedAdmin = { ...baseUser, openId: "delegated-admin", role: "admin" as const, isSuperuser: 0 };
    const delegatedCaller = appRouter.createCaller(context(delegatedAdmin));
    await expect(delegatedCaller.admin.restoreUser({ openId: baseUser.openId })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(delegatedCaller.admin.deleteUser({ openId: baseUser.openId })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("does not allow a regular user to change roles or transfer a base", async () => {
    const caller = appRouter.createCaller(context(baseUser));
    await expect(caller.admin.updateAccess({ openId: "another-user", role: "admin", permissions: [] })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.transferData({ sourceOpenId: baseUser.openId, targetOpenId: "employee-2" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.updateUserAccess).not.toHaveBeenCalled();
    expect(db.transferUserData).not.toHaveBeenCalled();
  });
});

  it("does not allow a delegated administrator to assign the administrator role", async () => {
    const delegatedAdmin = { ...baseUser, openId: "delegated-admin", role: "admin" as const };
    vi.mocked(db.getUserPermissions).mockResolvedValue(["team.manage"]);
    const caller = appRouter.createCaller(context(delegatedAdmin));
    await expect(caller.admin.updateAccess({ openId: baseUser.openId, role: "admin", permissions: [] })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.updateUserAccess).not.toHaveBeenCalled();
  });

  it("allows a delegated administrator to update permissions of a regular employee", async () => {
    const delegatedAdmin = { ...baseUser, openId: "delegated-admin", role: "admin" as const };
    vi.mocked(db.getUserPermissions).mockResolvedValue(["team.manage"]);
    vi.mocked(db.getUserByOpenId).mockResolvedValue(baseUser as never);
    vi.mocked(db.updateUserAccess).mockResolvedValue({ ...baseUser, permissions: ["farms.read"] } as never);
    const caller = appRouter.createCaller(context(delegatedAdmin));
    await expect(caller.admin.updateAccess({ openId: baseUser.openId, role: "user", permissions: ["farms.read"] })).resolves.toMatchObject({ openId: baseUser.openId });
  });
