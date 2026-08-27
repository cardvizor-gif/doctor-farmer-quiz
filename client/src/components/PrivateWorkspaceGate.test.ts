import { describe, expect, it } from "vitest";
import { privateWorkspaceGateCopy } from "./PrivateWorkspaceGate";

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
});
