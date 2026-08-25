import { encodeOAuthState, OAUTH_STATE_COOKIE } from "@shared/const";

export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

let loginNavigationStarted = false;

export function readCookieValue(cookieHeader: string, name: string) {
  const prefix = `${name}=`;
  const entry = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(prefix));
  if (!entry) return null;
  try {
    return decodeURIComponent(entry.slice(prefix.length));
  } catch {
    return null;
  }
}

export function resolveOAuthNonce(cookieHeader: string, mintNonce: () => string) {
  return readCookieValue(cookieHeader, OAUTH_STATE_COOKIE) ?? mintNonce();
}

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const existingNonce = readCookieValue(document.cookie, OAUTH_STATE_COOKIE);
  const nonce = resolveOAuthNonce(document.cookie, () => crypto.randomUUID());

  // The server validates this host-only cookie against the nonce carried in
  // state before it exchanges the OAuth code. Reuse an active nonce so a
  // double-click or a second app-open from an email does not desynchronise an
  // in-flight callback; mint a fresh host-only cookie only when none exists.
  if (!existingNonce) {
    document.cookie = `${OAUTH_STATE_COOKIE}=${encodeURIComponent(nonce)}; Path=/; Max-Age=600; SameSite=None; Secure`;
  }
  const state = encodeOAuthState({ redirectUri, nonce });

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};

export const startLogin = () => {
  if (loginNavigationStarted) return;
  loginNavigationStarted = true;
  window.location.assign(getLoginUrl());
};
