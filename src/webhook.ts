import { createHmac, timingSafeEqual } from "node:crypto";

export function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function verifySignature(payload: string, signature: string, secret: string): boolean {
  const expected = signPayload(payload, secret);
  const buf1 = Buffer.from(expected);
  const buf2 = Buffer.from(signature);
  if (buf1.length !== buf2.length) return false;
  return timingSafeEqual(buf1, buf2);
}
