const CORPORATE_EMAIL_PATTERN = /^[^@\s]+@doctorfarmer\.ru$/i;

/**
 * Returns true only for a non-empty mailbox hosted exactly on doctorfarmer.ru.
 * Subdomains, malformed addresses, and personal mail providers are rejected.
 */
export function isAllowedCorporateEmail(email: string | null | undefined): boolean {
  return typeof email === "string" && CORPORATE_EMAIL_PATTERN.test(email.trim());
}
