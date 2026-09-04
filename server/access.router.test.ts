import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  requestAccess: vi.fn(), listRegions: vi.fn(), listAccessRequests: vi.fn(), approveAccessRequest: vi.fn(), listInviteCodeHistory: vi.fn(), reissueAccessRequest: vi.fn(), rejectAccessRequest: vi.fn(),
  findActiveInvite: vi.fn(), consumeInvite: vi.fn(), upsertUser: vi.fn(), getUserByOpenId: vi.fn(),
}));
vi.mock("./_core/sdk", () => ({ sdk: { createSessionToken: vi.fn().mockResolvedValue("local-session") } }));

import * as db from "./db";
import { appRouter } from "./routers";
import { ENV } from "./_core/env";

const request = { id: 7, email: "colleague@example.com", requestedName: "Коллега", position: "Менеджер по продажам", regionId: 1, status: "pending" as const, reviewedByOpenId: null, reviewedAt: null, inviteCodeHash: null, inviteCodeExpiresAt: null, inviteCodeUsedAt: null, localOpenId: null, createdAt: new Date(), updatedAt: new Date() };
const user = { id: 4, openId: "invite_test", name: "Коллега", displayName: "Коллега", position: request.position, email: request.email, loginMethod: "invite", role: "user" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
function context(role: "admin" | "user" | null): TrpcContext & { res: { cookie: ReturnType<typeof vi.fn> } } {
  return { user: role ? { ...user, openId: role === "admin" ? ENV.ownerOpenId : "other", role } : null, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { cookie: vi.fn(), clearCookie: vi.fn() } as unknown as TrpcContext["res"] } as TrpcContext & { res: { cookie: ReturnType<typeof vi.fn> } };
}

describe("access invitations", () => {
  beforeEach(() => vi.clearAllMocks());
  it("accepts a public access request without disclosing request data", async () => {
    const caller = appRouter.createCaller(context(null));
    await expect(caller.access.request({ requestedName: "Коллега", position: request.position, email: request.email, regionId: request.regionId })).resolves.toEqual({ accepted: true });
    expect(db.requestAccess).toHaveBeenCalledWith({ requestedName: "Коллега", position: request.position, email: request.email, regionId: request.regionId });
  });
  it("exposes only the active region reference data before authentication", async () => {
    vi.mocked(db.listRegions).mockResolvedValue([{ id: 1, name: "Республика Башкортостан", isActive: 1, createdAt: new Date() }]);
    const caller = appRouter.createCaller(context(null));
    await expect(caller.access.regions()).resolves.toHaveLength(1);
    expect(db.listRegions).toHaveBeenCalledTimes(1);
  });

  it("requires a position when a colleague submits an access request", async () => {
    const caller = appRouter.createCaller(context(null));
    await expect(caller.access.request({ requestedName: "Коллега", email: request.email, regionId: request.regionId } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
  it("limits request review and invitation codes to the administrator", async () => {
    vi.mocked(db.approveAccessRequest).mockResolvedValue({ ...request, status: "approved" });
    const guest = appRouter.createCaller(context("user"));
    const admin = appRouter.createCaller(context("admin"));
    await expect(guest.access.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(guest.access.approve({ id: request.id })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(admin.access.approve({ id: request.id })).resolves.toMatchObject({ request: expect.objectContaining({ id: request.id }), code: expect.stringMatching(/^[A-Z2-9]{10}$/) });
    expect(db.approveAccessRequest).toHaveBeenCalledWith(request.id, ENV.ownerOpenId, expect.stringMatching(/^[A-Z2-9]{10}$/), expect.any(String), expect.any(Date));
  });
  it("activates a valid one-time invitation into a new isolated user session", async () => {
    const code = "ABCDEFGHJK";
    const hash = (await import("crypto")).createHash("sha256").update(code).digest("hex");
    vi.mocked(db.findActiveInvite).mockResolvedValue({ ...request, status: "approved", inviteCodeHash: hash, inviteCodeExpiresAt: new Date(Date.now() + 60000) });
    vi.mocked(db.consumeInvite).mockResolvedValue(true);
    vi.mocked(db.getUserByOpenId).mockResolvedValue(user);
    const ctx = context(null);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.access.activate({ email: request.email, code })).resolves.toEqual(user);
    expect(db.consumeInvite).toHaveBeenCalledWith(request.id, hash, expect.stringMatching(/^invite_/));
    expect(ctx.res.cookie).toHaveBeenCalledWith(expect.any(String), "local-session", expect.objectContaining({ httpOnly: true, maxAge: 2592000000 }));
  });

  it("limits invitation history to the administrator", async () => {
    vi.mocked(db.listInviteCodeHistory).mockResolvedValue([{ id: 1, requestId: request.id, codeHash: "hash", code: "ABCDEFGHJK", expiresAt: new Date(Date.now() + 60000), issuedByOpenId: ENV.ownerOpenId, usedAt: null, usedByOpenId: null, createdAt: new Date() }]);
    const guest = appRouter.createCaller(context("user"));
    const admin = appRouter.createCaller(context("admin"));
    await expect(guest.access.history({ id: request.id })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(admin.access.history({ id: request.id })).resolves.toHaveLength(1);
    expect(db.listInviteCodeHistory).toHaveBeenCalledWith(request.id);
  });

  it("limits code reissue to the administrator", async () => {
    vi.mocked(db.reissueAccessRequest).mockResolvedValue({ ...request, status: "approved" });
    const guest = appRouter.createCaller(context("user"));
    const admin = appRouter.createCaller(context("admin"));
    await expect(guest.access.reissue({ id: request.id })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(admin.access.reissue({ id: request.id })).resolves.toMatchObject({ request: expect.objectContaining({ id: request.id }), code: expect.stringMatching(/^[A-Z2-9]{10}$/) });
    expect(db.reissueAccessRequest).toHaveBeenCalledWith(request.id, ENV.ownerOpenId, expect.stringMatching(/^[A-Z2-9]{10}$/), expect.any(String), expect.any(Date));
  });

  it("allows only the administrator to reject a pending request", async () => {
    vi.mocked(db.rejectAccessRequest).mockResolvedValue({ ...request, status: "rejected" });
    const guest = appRouter.createCaller(context("user"));
    const admin = appRouter.createCaller(context("admin"));
    await expect(guest.access.reject({ id: request.id })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(admin.access.reject({ id: request.id })).resolves.toMatchObject({ status: "rejected" });
    expect(db.rejectAccessRequest).toHaveBeenCalledWith(request.id, ENV.ownerOpenId);
  });

  it("does not create a session for an unknown, expired, or already used invitation", async () => {
    vi.mocked(db.findActiveInvite).mockResolvedValue(undefined);
    const ctx = context(null);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.access.activate({ email: request.email, code: "ABCDEFGHJK" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(db.consumeInvite).not.toHaveBeenCalled();
    expect(ctx.res.cookie).not.toHaveBeenCalled();
  });
});
