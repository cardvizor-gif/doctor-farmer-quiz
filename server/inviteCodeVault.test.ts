import { describe, expect, it } from "vitest";
import { decryptInviteCode, encryptInviteCode } from "./inviteCodeVault";

describe("invite code vault", () => {
  it("encrypts and decrypts an invitation code", () => {
    const code = "ABCD2345EF";
    const encrypted = encryptInviteCode(code);

    expect(encrypted).not.toContain(code);
    expect(decryptInviteCode(encrypted)).toBe(code);
  });

  it("uses a fresh nonce for each encryption", () => {
    const code = "ABCD2345EF";

    expect(encryptInviteCode(code)).not.toBe(encryptInviteCode(code));
  });

  it("rejects a malformed or tampered payload", () => {
    expect(() => decryptInviteCode("invalid")) .toThrow();
    const encrypted = encryptInviteCode("ABCD2345EF");
    const tampered = `${encrypted.slice(0, -1)}${encrypted.endsWith("A") ? "B" : "A"}`;

    expect(() => decryptInviteCode(tampered)).toThrow();
  });
});
