import { describe, expect, it } from "vitest";
import { getSessionCookieOptions } from "./_core/cookies";

type RequestLike = Parameters<typeof getSessionCookieOptions>[0];

function request(overrides: Partial<RequestLike> = {}) {
  return {
    protocol: "http",
    headers: {},
    ...overrides,
  } as RequestLike;
}

describe("getSessionCookieOptions", () => {
  it("keeps the session usable on a standalone HTTP server", () => {
    expect(getSessionCookieOptions(request())).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });
  });

  it("marks the session secure when the public request is HTTPS", () => {
    expect(getSessionCookieOptions(request({ protocol: "https" }))).toMatchObject({
      sameSite: "lax",
      secure: true,
    });
  });

  it("honors the forwarded HTTPS protocol from a reverse proxy", () => {
    expect(getSessionCookieOptions(request({ headers: { "x-forwarded-proto": "https" } }))).toMatchObject({
      sameSite: "lax",
      secure: true,
    });
  });
});
