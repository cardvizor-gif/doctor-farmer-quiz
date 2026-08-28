import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({
  createSupportTicket: vi.fn(),
  getSupportTicketById: vi.fn(),
  listSupportTickets: vi.fn(),
  updateSupportTicketStatus: vi.fn(),
  getUserPermissions: vi.fn().mockResolvedValue(["support.create"]),
}));

import { appRouter } from "./routers";
import * as db from "./db";
import type { TrpcContext } from "./_core/context";

const timestamp = new Date("2026-08-27T12:00:00.000Z");

function createContext(role: "admin" | "user" = "user", openId = "manager-one"): TrpcContext {
  return {
    user: { id: 1, openId, name: "Иван Менеджер", displayName: "Иван Менеджер", email: "manager@example.com", loginMethod: "invite", role, createdAt: timestamp, updatedAt: timestamp, lastSignedIn: timestamp },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { cookie: vi.fn(), clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

const input = { subject: "Не загружается Excel", message: "Не загружается Excel-файл в реестре хозяйств.", pagePath: "/farms", attachments: [] };

describe("support ticket privacy", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates an in-app ticket only for the authenticated employee", async () => {
    const created = { id: 15, ...input, ownerOpenId: "manager-one", status: "new" };
    vi.mocked(db.createSupportTicket).mockResolvedValue(created as never);

    await expect(appRouter.createCaller(createContext()).support.create(input)).resolves.toEqual(created);
    expect(db.createSupportTicket).toHaveBeenCalledWith(input, "manager-one");
  });

  it("does not expose another employee ticket to a regular user", async () => {
    vi.mocked(db.getSupportTicketById).mockResolvedValue(undefined);

    await expect(appRouter.createCaller(createContext("user", "manager-two")).support.byId({ id: 15 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(db.getSupportTicketById).toHaveBeenCalledWith(15, "manager-two", false);
  });

  it("allows only an administrator to see the common queue and change ticket status", async () => {
    const updated = { id: 15, status: "in_progress" };
    vi.mocked(db.listSupportTickets).mockResolvedValue([] as never);
    vi.mocked(db.updateSupportTicketStatus).mockResolvedValue(updated as never);
    const admin = appRouter.createCaller(createContext("admin", "owner"));

    await expect(admin.support.list()).resolves.toEqual([]);
    await expect(admin.support.updateStatus({ id: 15, status: "in_progress" })).resolves.toEqual(updated);
    expect(db.listSupportTickets).toHaveBeenCalledWith("owner", true);
    expect(db.updateSupportTicketStatus).toHaveBeenCalledWith(15, "in_progress");
    await expect(appRouter.createCaller(createContext()).support.updateStatus({ id: 15, status: "resolved" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects unsupported attachment types before persistence", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.support.create({ ...input, attachments: [{ fileName: "script.exe", mimeType: "application/octet-stream" as never, dataBase64: "dGVzdA==" }] })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(db.createSupportTicket).not.toHaveBeenCalled();
  });
});
