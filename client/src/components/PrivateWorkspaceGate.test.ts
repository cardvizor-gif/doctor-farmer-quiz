import { describe, expect, it } from "vitest";
import { canAccessWorkspace, privateWorkspaceGateCopy } from "./PrivateWorkspaceGate";

describe("privateWorkspaceGateCopy", () => {
  it("shows an explicit registration requirement for testing", () => {
    expect(privateWorkspaceGateCopy("/quiz")).toMatchObject({
      title: "Тестирование доступно после входа",
    });
  });

  it("keeps a generic private-workspace message for other protected routes", () => {
    expect(privateWorkspaceGateCopy("/farms")).toMatchObject({
      title: "Рабочий раздел доступен после входа",
    });
  });

  it("allows a regular employee only into explicitly assigned sections", () => {
    expect(canAccessWorkspace({ role: "user", permissions: ["farms.read"] }, "farms.read")).toBe(true);
    expect(canAccessWorkspace({ role: "user", permissions: ["farms.read"] }, "quiz.use")).toBe(false);
  });

  it("gives only the superuser access to every protected section", () => {
    expect(canAccessWorkspace({ role: "admin", isSuperuser: true, permissions: [] }, "team.manage")).toBe(true);
  });

  it("does not bypass permissions for a delegated administrator", () => {
    expect(canAccessWorkspace({ role: "admin", isSuperuser: false, permissions: [] }, "team.manage")).toBe(false);
    expect(canAccessWorkspace({ role: "admin", isSuperuser: false, permissions: ["team.read"] }, "team.manage")).toBe(false);
  });
});
