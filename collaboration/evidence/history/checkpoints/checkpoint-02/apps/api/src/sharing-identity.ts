import { createHash } from "node:crypto";

export function verifiedEmailDigest(email: string): Buffer {
  return createHash("sha256").update(`rillora-invitation-email-v1\u001f${email.trim().toLowerCase()}`, "utf8").digest();
}

export function maskedEmail(email: string): string {
  const [name = "", domain = ""] = email.trim().toLowerCase().split("@");
  return `${name.slice(0, 2)}***@${domain}`;
}
