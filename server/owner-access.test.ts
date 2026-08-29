import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const { getUserPermissions } = vi.hoisted(() => ({
  getUserPermissions: vi.fn(),
}));

vi.mock("./db", () => ({
  getUserPermissions,
}));

import { appRouter } from "./routers";

const user = {
  id: 7,
  openId: "database-owner",
  name: "Shafran",
  displayName: "Шамиль Вильданов",
  email: "owner@example.com",
  loginMethod: "apple",
  role: "admin" as const,
  status: "active" as const,
  isSuperuser: 1,
  archivedAt: null,
  archivedByOpenId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

function context(): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  } as TrpcContext;
}

describe("database owner access", () => {
  it("grants all permissions to the explicitly marked owner even if the platform owner id differs", async () => {
    const result = await appRouter.createCaller(context()).auth.me();

    expect(result?.isSuperuser).toBe(true);
    expect(result?.permissions).toContain("farms.write");
    expect(result?.permissions).toContain("team.manage");
    expect(getUserPermissions).not.toHaveBeenCalled();
  });
});
