import { describe, expect, it } from "vitest";
import { groupWorkspaceAssignments, workspaceAssignmentLabel } from "./regionalWorkspace";

describe("regional workspace assignments", () => {
  it("does not infer an RC membership for a user without an explicit assignment", () => {
    const assignments = groupWorkspaceAssignments([
      { userOpenId: "manager-1", workspaceName: "РЦ Башкортостан", regionName: "Республика Башкортостан" },
    ]);

    expect(workspaceAssignmentLabel("manager-1", assignments)).toBe("РЦ Башкортостан · Республика Башкортостан");
    expect(workspaceAssignmentLabel("unassigned-1", assignments)).toBe("не назначен ни в один РЦ");
  });

  it("keeps explicit assignments for the same employee grouped without duplicates", () => {
    const assignments = groupWorkspaceAssignments([
      { userOpenId: "leader-1", workspaceName: "РЦ Башкортостан", regionName: "Республика Башкортостан" },
      { userOpenId: "leader-1", workspaceName: "РЦ Оренбург", regionName: "Оренбургская область" },
      { userOpenId: "leader-1", workspaceName: "РЦ Башкортостан", regionName: "Республика Башкортостан" },
    ]);

    expect(workspaceAssignmentLabel("leader-1", assignments)).toBe("РЦ Башкортостан · Республика Башкортостан, РЦ Оренбург · Оренбургская область");
  });
});
