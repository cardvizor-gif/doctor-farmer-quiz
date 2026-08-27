import { describe, expect, it, vi } from "vitest";
import { OAUTH_NONCE_COOKIE_ATTRIBUTES, readCookieValue, resolveOAuthNonce } from "./const";

describe("OAuth login nonce", () => {
  it("reuses an active host-only nonce instead of overwriting an in-flight login", () => {
    const mintNonce = vi.fn(() => "fresh-nonce");

    expect(resolveOAuthNonce("theme=light; __Host-oauth_state=active-nonce", mintNonce)).toBe("active-nonce");
    expect(mintNonce).not.toHaveBeenCalled();
  });

  it("mints a nonce when no OAuth transaction is active", () => {
    const mintNonce = vi.fn(() => "fresh-nonce");

    expect(resolveOAuthNonce("theme=light", mintNonce)).toBe("fresh-nonce");
    expect(mintNonce).toHaveBeenCalledTimes(1);
  });

  it("decodes an encoded cookie value safely", () => {
    expect(readCookieValue("__Host-oauth_state=nonce%2Fwith%3Dsymbols", "__Host-oauth_state")).toBe("nonce/with=symbols");
  });

  it("uses a secure Lax cookie for the top-level OAuth callback", () => {
    expect(OAUTH_NONCE_COOKIE_ATTRIBUTES).toContain("SameSite=Lax");
    expect(OAUTH_NONCE_COOKIE_ATTRIBUTES).toContain("Secure");
    expect(OAUTH_NONCE_COOKIE_ATTRIBUTES).not.toContain("SameSite=None");
  });
});
