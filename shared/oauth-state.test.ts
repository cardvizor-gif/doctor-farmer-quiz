import { describe, expect, it } from "vitest";
import { decodeOAuthState, encodeOAuthState } from "./const";

describe("OAuth state contract", () => {
  it("preserves callback URL and one-time nonce for the callback CSRF check", () => {
    const state = encodeOAuthState({
      redirectUri: "https://doctor-farmer.example/api/oauth/callback",
      nonce: "nonce-for-login-attempt",
    });

    expect(decodeOAuthState(state)).toEqual({
      redirectUri: "https://doctor-farmer.example/api/oauth/callback",
      nonce: "nonce-for-login-attempt",
    });
  });
});
