import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const { updateUserDisplayName } = vi.hoisted(() => ({
  updateUserDisplayName: vi.fn(),
}));

vi.mock("./db", () => ({ updateUserDisplayName }));

import { appRouter } from "./routers";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 7,
    openId: "profile-owner",
    name: "OAuth account label",
    displayName: null,
    email: "profile@example.com",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("auth.updateProfile", () => {
  it("updates only the current authenticated user's display name", async () => {
    const ctx = createAuthContext();
    const updatedUser = { ...ctx.user!, displayName: "Шамиль Вильданов" };
    updateUserDisplayName.mockResolvedValue(updatedUser);

    const result = await appRouter.createCaller(ctx).auth.updateProfile({ displayName: "  Шамиль Вильданов  " });

    expect(updateUserDisplayName).toHaveBeenCalledWith("profile-owner", "Шамиль Вильданов");
    expect(result.displayName).toBe("Шамиль Вильданов");
  });
});
