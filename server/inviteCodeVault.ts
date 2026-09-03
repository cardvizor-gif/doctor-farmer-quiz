import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { ENV } from "./_core/env";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function encryptionKey() {
  if (!ENV.cookieSecret) throw new Error("JWT_SECRET is required to protect invitation codes");
  return createHash("sha256").update(`doctor-farmer-invite-code-v1:${ENV.cookieSecret}`).digest();
}

export function encryptInviteCode(code: string) {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(code, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv, authTag, ciphertext].map(part => part.toString("base64url")).join(".");
}

export function decryptInviteCode(payload: string) {
  const [ivPart, authTagPart, ciphertextPart] = payload.split(".");
  if (!ivPart || !authTagPart || !ciphertextPart) throw new Error("Invalid encrypted invitation code");
  const decipher = createDecipheriv(ALGORITHM, encryptionKey(), Buffer.from(ivPart, "base64url"));
  decipher.setAuthTag(Buffer.from(authTagPart, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertextPart, "base64url")), decipher.final()]).toString("utf8");
}
