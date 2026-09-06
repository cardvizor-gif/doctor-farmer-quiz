import { describe, expect, it } from "vitest";
import { allPermissionCodes, defaultAdminPermissions, defaultManagerPermissions, defaultPermissionsForRole } from "./permissions";

describe("default role permissions", () => {
  it("gives managers operational access without administrative permissions", () => {
    expect(defaultManagerPermissions).toEqual(defaultPermissionsForRole("user"));
    expect(defaultManagerPermissions).toContain("farms.write");
    expect(defaultManagerPermissions).toContain("proposals.write");
    expect(defaultManagerPermissions).toContain("orders.write");
    expect(defaultManagerPermissions).not.toContain("team.manage");
    expect(defaultManagerPermissions).not.toContain("team.transfer");
    expect(defaultManagerPermissions).not.toContain("workspace.manage");
  });

  it("gives delegated administrators the permission set without making them superusers", () => {
    expect(defaultAdminPermissions).toEqual(allPermissionCodes);
    expect(defaultAdminPermissions).toEqual(defaultPermissionsForRole("admin"));
    expect(defaultAdminPermissions).toContain("team.manage");
    expect(defaultAdminPermissions).toContain("workspace.manage");
  });
});
