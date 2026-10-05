import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("employee passwords", () => {
  it("stores a salted scrypt hash that verifies the original password", () => {
    const encoded = hashPassword("SecurePass123");
    expect(encoded).toMatch(/^scrypt-v1\$[0-9a-f]+\$[0-9a-f]+$/);
    expect(encoded).not.toContain("SecurePass123");
    expect(verifyPassword("SecurePass123", encoded)).toBe(true);
  });

  it("rejects a wrong password and a malformed hash", () => {
    const encoded = hashPassword("SecurePass123");
    expect(verifyPassword("WrongPass123", encoded)).toBe(false);
    expect(verifyPassword("SecurePass123", "not-a-password-hash")).toBe(false);
  });
});
