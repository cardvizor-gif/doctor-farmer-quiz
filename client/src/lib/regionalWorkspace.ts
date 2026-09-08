export type WorkspaceAssignment = {
  userOpenId: string;
  workspaceName: string;
  regionName: string;
};

export function groupWorkspaceAssignments(assignments: WorkspaceAssignment[]) {
  return assignments.reduce<Map<string, string[]>>((grouped, assignment) => {
    const labels = grouped.get(assignment.userOpenId) ?? [];
    const label = `${assignment.workspaceName} · ${assignment.regionName}`;
    if (!labels.includes(label)) labels.push(label);
    grouped.set(assignment.userOpenId, labels);
    return grouped;
  }, new Map());
}

export function workspaceAssignmentLabel(userOpenId: string, grouped: Map<string, string[]>) {
  const labels = grouped.get(userOpenId);
  return labels?.length ? labels.join(", ") : "не назначен ни в один РЦ";
}
